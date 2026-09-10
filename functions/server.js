/* ==========================================================================
   EBD Consultores — backend

   Qué hace: lo que el navegador no puede hacer solo. Hoy es una sola cosa,
   hablar con los web services de ARCA (ex AFIP) para traer los comprobantes
   emitidos de cada cliente y su constancia de inscripción.

   Por qué hace falta un backend: los web services de ARCA piden un
   certificado digital y una clave privada. Eso NO puede vivir en el HTML:
   cualquiera que abra la página lo vería. Va acá, en variables de entorno.

   Cómo se despliega: ver README.md de esta carpeta.
   ========================================================================== */

const express = require('express');
const cors    = require('cors');
const arca    = require('./arca');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

/* ---------- CORS ----------
   ALLOWED_ORIGINS es una lista separada por comas con los dominios que
   pueden llamar al backend. Sin definir, acepta cualquiera (cómodo para
   probar, pero conviene cerrarlo antes de usarlo en serio). */
const ORIGENES = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: ORIGENES.length ? ORIGENES : true,
  allowedHeaders: ['Content-Type', 'X-App-Token']
}));

/* ---------- Autenticación ----------
   Token compartido en el header X-App-Token. El sistema lo manda en cada
   pedido; se configura en Railway (APP_API_TOKEN) y en el propio sistema.
   Si no está definido, el backend queda ABIERTO y lo avisa por consola. */
/* Al pegar valores en Railway se cuela seguido un espacio o un tabulador
   invisible adelante. Sin recortarlo, "production" con un tab no es
   "production" y el backend se va al ambiente de pruebas sin decir por qué;
   con el token pasa lo mismo y todo responde 401. */
function limpiar(v) { return String(v || '').trim(); }
function entorno() { return limpiar(process.env.AFIP_ENV) || 'testing'; }

const APP_TOKEN = limpiar(process.env.APP_API_TOKEN);
if (!APP_TOKEN) {
  console.warn('[seguridad] APP_API_TOKEN no está configurado: el backend acepta pedidos sin autenticar.');
}

app.use((req, res, next) => {
  if (req.path === '/') return next();
  if (!APP_TOKEN) return next();
  if (limpiar(req.get('X-App-Token')) === APP_TOKEN) return next();
  return res.status(401).json({ error: 'No autorizado. Falta o no coincide el X-App-Token.' });
});

/* ==========================================================================
   CREDENCIALES DE ARCA
   ========================================================================== */

/* El certificado y la clave se pegan en Railway. Se aceptan las tres formas
   en que suelen quedar al copiarlos: PEM con saltos de línea reales, PEM con
   "\n" literales, o el PEM entero en base64. */
function leerPem(valor) {
  let v = (valor || '').trim();
  if (!v) return '';
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  if (v.indexOf('-----BEGIN') !== -1) return v.replace(/\\n/g, '\n');
  try {
    const dec = Buffer.from(v, 'base64').toString('utf8');
    if (dec.indexOf('-----BEGIN') !== -1) return dec.replace(/\\n/g, '\n');
  } catch (_) {}
  return v;
}

/* El ticket de acceso sale SIEMPRE del certificado del estudio; el CUIT del
   cliente va después, en cada consulta. ARCA responde solo si ese cliente
   delegó el servicio al estudio desde su clave fiscal. */
function credenciales() {
  const cert = leerPem(process.env.AFIP_CERT);
  const key  = leerPem(process.env.AFIP_KEY);
  if (!cert || !key) {
    const err = new Error('Faltan las credenciales de ARCA. Configurá AFIP_CERT y AFIP_KEY en Railway.');
    err.faltanCreds = true;
    throw err;
  }
  return { cert, key };
}

function ticket() {
  const c = credenciales();
  return arca.obtenerTicket(c.cert, c.key, entorno());
}

/* Traduce los códigos con los que ARCA contesta que no. El 600 es el que se
   ve cuando falta la delegación, y sin traducirlo parece un error del sistema. */
function explicarArca(e) {
  const codigos = e.codigosArca || [];
  if (codigos.indexOf('600') !== -1) {
    return 'ARCA no te reconoce como representante de ese CUIT. Falta la delegación del cliente, o quedó a medias: ' + e.message;
  }
  return e.message;
}

function detalleError(e) {
  let detalle = '';
  const fuente = e.data || (e.response && e.response.data);
  if (fuente) detalle = typeof fuente === 'string' ? fuente : JSON.stringify(fuente);
  if (e.status) detalle = '[HTTP ' + e.status + '] ' + detalle;
  return detalle;
}

/* ==========================================================================
   FECHAS Y PERÍODOS
   ========================================================================== */

/* ARCA devuelve las fechas como 'AAAAMMDD' (número o texto). */
function fechaArcaAISO(f) {
  const s = String(f || '').replace(/\D/g, '');
  if (s.length !== 8) return '';
  return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
}
function periodoDeFechaArca(f) {
  const s = String(f || '').replace(/\D/g, '');
  return s.length === 8 ? s.slice(0, 6) : '';
}

/* Los períodos del sistema son 'AAAAMM'. Estos dos convierten los extremos
   del rango pedido a 'AAAAMMDD' numérico, que es como se comparan las fechas
   de ARCA sin tener que construir objetos Date. */
function desdeANumero(periodo) {
  const p = String(periodo || '').replace(/\D/g, '').slice(0, 6);
  return p.length === 6 ? parseInt(p + '01', 10) : 0;
}
function hastaANumero(periodo) {
  const p = String(periodo || '').replace(/\D/g, '').slice(0, 6);
  return p.length === 6 ? parseInt(p + '31', 10) : 99999999;
}

/* ==========================================================================
   COMPROBANTES EMITIDOS (web service WSFE)
   ========================================================================== */

/* Tipos de comprobante que emite un monotributista y, por las dudas, los del
   régimen general. 11/12/13 son Factura, Nota de Débito y Nota de Crédito C. */
const TIPOS = [11, 12, 13, 1, 2, 3, 6, 7, 8];

/* Las notas de crédito restan: si no, el total facturado del período queda
   inflado y la recategorización da mal. */
const NOTAS_CREDITO = [3, 8, 13];

/* Tope de consultas por punto de venta y tipo. WSFE no tiene "traeme todo lo
   del mes": hay que pedir comprobante por comprobante hacia atrás desde el
   último. El tope evita que un cliente con miles de facturas deje el pedido
   colgado para siempre. */
const TOPE_CONSULTAS = 1200;

/* Recorre un punto de venta y un tipo, desde el último comprobante hacia
   atrás, y corta apenas se pasa del rango de fechas pedido. Ir al revés es
   lo que hace la diferencia: los comprobantes del período buscado son los
   últimos, así que en general se resuelve en pocas consultas. */
async function traerDeUnTipo(tk, cuit, ptoVta, tipo, desdeNum, hastaNum) {
  const amb = entorno();
  const lista = [];
  let ultimo = 0;
  try {
    ultimo = await arca.ultimoComprobante(tk, cuit, ptoVta, tipo, amb);
  } catch (e) {
    /* Un CUIT sin ese tipo de comprobante da error de negocio, no es una
       falla: se saltea. Pero si es un problema de permisos hay que avisarlo,
       porque si no el resultado es "cero comprobantes" sin explicación. */
    if ((e.codigosArca || []).indexOf('600') !== -1) throw e;
    return lista;
  }
  if (!ultimo) return lista;

  let consultas = 0;
  let anterioresSeguidos = 0;

  for (let nro = ultimo; nro >= 1 && consultas < TOPE_CONSULTAS; nro--) {
    consultas++;
    let v = null;
    try {
      v = await arca.consultarComprobante(tk, cuit, ptoVta, tipo, nro, amb);
    } catch (_) { continue; }
    if (!v || !v.CbteFch) continue;

    const fechaNum = parseInt(String(v.CbteFch).replace(/\D/g, ''), 10);
    if (!fechaNum) continue;

    if (fechaNum > hastaNum) { anterioresSeguidos = 0; continue; }

    if (fechaNum < desdeNum) {
      /* La numeración es cronológica, pero un par de comprobantes fuera de
         orden no deberían cortar la búsqueda: se corta recién con varios
         seguidos por debajo del rango. */
      if (++anterioresSeguidos >= 5) break;
      continue;
    }

    anterioresSeguidos = 0;
    lista.push({
      tipo, ptoVta, numero: nro,
      fecha:    fechaArcaAISO(v.CbteFch),
      periodo:  periodoDeFechaArca(v.CbteFch),
      moneda:   v.MonId || 'PES',
      cotiz:    v.MonCotiz || 1,
      docNro:   String(v.DocNro || ''),
      neto:     v.ImpNeto  || 0,
      iva:      v.ImpIVA   || 0,
      total:    v.ImpTotal || 0,
      cae:      v.CodAutorizacion || '',
      caeVto:   fechaArcaAISO(v.FchVto)
    });
  }
  return lista;
}

/* Suma los comprobantes por período, que es lo que el sistema guarda en
   `totales/<cliente>/<AAAAMM>` y usa para la recategorización. */
function totalizarPorPeriodo(comprobantes) {
  const out = {};
  comprobantes.forEach(c => {
    if (!c.periodo) return;
    if (!out[c.periodo]) out[c.periodo] = { emitido: 0, cantEmitidos: 0 };
    const signo = NOTAS_CREDITO.indexOf(c.tipo) !== -1 ? -1 : 1;
    /* Si facturó en otra moneda, se lleva a pesos con la cotización del
       propio comprobante: la escala del monotributo está en pesos. */
    const enPesos = c.moneda === 'PES' ? c.total : c.total * (c.cotiz || 1);
    out[c.periodo].emitido += signo * enPesos;
    out[c.periodo].cantEmitidos += 1;
  });
  Object.keys(out).forEach(p => {
    out[p].emitido = Math.round(out[p].emitido * 100) / 100;
  });
  return out;
}

/* GET /arca/emitidos?cuit=20123456786&desde=202601&hasta=202612
   Devuelve los comprobantes emitidos del rango y el total por período. */
app.get('/arca/emitidos', async (req, res) => {
  try {
    const cuit  = String(req.query.cuit || '').replace(/\D/g, '');
    const desde = String(req.query.desde || '');
    const hasta = String(req.query.hasta || desde);

    if (cuit.length !== 11) return res.status(400).json({ error: 'CUIT inválido.' });
    if (!desdeANumero(desde)) return res.status(400).json({ error: 'Falta el período desde (AAAAMM).' });

    const tk = await ticket();
    const desdeNum = desdeANumero(desde);
    const hastaNum = hastaANumero(hasta);

    let puntos = [];
    let sinPuntosWeb = false;
    try {
      const pv = await arca.puntosDeVenta(tk, cuit, entorno());
      puntos = pv.filter(p => !p.bloqueado).map(p => p.nro);
    } catch (e) {
      /* Sin delegación no hay nada que hacer: cortar acá y decirlo. */
      if ((e.codigosArca || []).indexOf('600') !== -1) throw e;
      /* El 602 acá significa algo muy concreto: ese contribuyente no tiene
         ningún punto de venta de web service. Pasa con quien factura desde
         "Comprobantes en Línea", el portal de ARCA: esos comprobantes viven
         en otro punto de venta que WSFE no ve, y no hay trámite que lo
         cambie. Se intenta igual con el 1 por si acaso, pero se avisa. */
      if ((e.codigosArca || []).indexOf('602') !== -1) sinPuntosWeb = true;
      puntos = [1];
    }
    if (!puntos.length) puntos = [1];

    const tipoParam = parseInt(req.query.tipo, 10) || 0;
    const tipos = tipoParam ? [tipoParam] : TIPOS;

    const comprobantes = [];
    for (const pto of puntos) {
      for (const tipo of tipos) {
        const parcial = await traerDeUnTipo(tk, cuit, pto, tipo, desdeNum, hastaNum);
        comprobantes.push(...parcial);
      }
    }

    comprobantes.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));

    return res.json({
      cuit, desde, hasta,
      puntosDeVenta: puntos,
      sinPuntosWeb: sinPuntosWeb,
      cantidad: comprobantes.length,
      porPeriodo: totalizarPorPeriodo(comprobantes),
      comprobantes
    });
  } catch (e) {
    return res.status(e.faltanCreds ? 400 : 500).json({ error: explicarArca(e), detalle: detalleError(e) });
  }
});

/* ==========================================================================
   CONSTANCIA DE INSCRIPCIÓN (web service de padrón)
   ========================================================================== */

/* GET /arca/constancia?cuit=20123456786
   Todavía no está. El padrón es OTRO web service (ws_sr_constancia_inscripcion):
   pide su propio ticket de acceso, su propia adhesión en el Administrador de
   Relaciones y habla en otro dialecto. Cuando los comprobantes estén andando
   en producción, se agrega acá con el mismo mecanismo de arca.js. */
app.get('/arca/constancia', (req, res) => {
  return res.status(501).json({
    error: 'La constancia todavía no está implementada en este backend.',
    detalle: 'Usa otro web service de ARCA (padrón), que necesita su propia adhesión. Por ahora, los datos del contribuyente se cargan a mano en la ficha del cliente.'
  });
});

/* ==========================================================================
   DIAGNÓSTICO
   ========================================================================== */

app.get('/', (req, res) => res.json({ status: 'ok', service: 'EBD Consultores — backend' }));

/* Qué hay configurado y qué falta. Nunca devuelve el valor de nada secreto:
   solo si está o no está. */
app.get('/diag', (req, res) => {
  const cert = leerPem(process.env.AFIP_CERT);
  const key  = leerPem(process.env.AFIP_KEY);
  const avisos = [];

  if (!cert || !key) avisos.push('Faltan AFIP_CERT y/o AFIP_KEY: no se puede consultar nada de ARCA todavía.');
  if (entorno() !== 'production') avisos.push('ARCA en modo TESTING: las consultas van al ambiente de homologación, no a los datos reales.');
  if (!APP_TOKEN) avisos.push('APP_API_TOKEN sin configurar: el backend acepta pedidos de cualquiera.');
  if (!ORIGENES.length) avisos.push('ALLOWED_ORIGINS sin configurar: acepta llamadas desde cualquier dominio.');

  res.json({
    certificadoCargado: !!cert,
    claveCargada:       !!key,
    certificadoEsPem:   cert.indexOf('-----BEGIN CERTIFICATE-----') === 0,
    claveEsPem:         key.indexOf('-----BEGIN') === 0,
    cuitDelEstudio:     process.env.AFIP_CUIT ? String(process.env.AFIP_CUIT).replace(/\D/g, '') : '',
    ambiente:           entorno(),
    tokenConfigurado:   !!APP_TOKEN,
    corsRestringido:    ORIGENES.length > 0,
    avisos
  });
});

/* Revisa el certificado sin hablar con ARCA. Conviene mirar esto primero:
   si la clave y el certificado no son pareja, no hay nada más que probar. */
app.get('/diag/firma', (req, res) => {
  try {
    const c = credenciales();
    return res.json(arca.probarFirma(c.cert, c.key));
  } catch (e) {
    return res.status(e.faltanCreds ? 400 : 500).json({ error: e.message });
  }
});

/* Pide un ticket nuevo aunque el anterior siga vigente. Es lo que hay que
   hacer después de agregar la delegación de un cliente: el ticket lleva
   grabadas las relaciones del momento en que se emitió. */
app.get('/diag/ticket-nuevo', async (req, res) => {
  try {
    const c = credenciales();
    const tk = await arca.renovarTicket(c.cert, c.key, entorno());
    return res.json({ ticket: 'renovado, vence ' + new Date(tk.expira).toISOString() });
  } catch (e) {
    return res.status(e.faltanCreds ? 400 : 500).json({ error: e.message });
  }
});

/* Prueba de punta a punta contra ARCA: si esto responde, el certificado y la
   delegación de ese CUIT están bien. Es el primer lugar donde mirar cuando
   "no trae nada". */
app.get('/diag/arca', async (req, res) => {
  const cuit = String(req.query.cuit || process.env.AFIP_CUIT || '').replace(/\D/g, '');
  const out = { cuit, ambiente: entorno(), estadoServidores: null, ticket: null, puntosDeVenta: null };

  /* Los tres pasos se prueban por separado y en orden, porque cada uno falla
     por un motivo distinto: ARCA caído, certificado mal, o delegación
     faltante. Juntos darían un solo error que no distingue nada. */
  try {
    out.estadoServidores = await arca.estadoServidores(entorno());
  } catch (e) {
    out.estadoServidores = 'error: ' + e.message;
  }

  let tk = null;
  try {
    tk = await ticket();
    out.ticket = 'ok, vence ' + new Date(tk.expira).toISOString();
  } catch (e) {
    out.ticket = 'error: ' + e.message;
    return res.json(out);
  }

  try {
    out.puntosDeVenta = await arca.puntosDeVenta(tk, cuit, entorno());
  } catch (e) {
    out.puntosDeVenta = 'error: ' + explicarArca(e);
  }
  return res.json(out);
});

app.listen(PORT, () => console.log('EBD backend escuchando en el puerto ' + PORT));
