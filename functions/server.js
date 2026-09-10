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
const Afip    = require('@afipsdk/afip.js');

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
const APP_TOKEN = process.env.APP_API_TOKEN || '';
if (!APP_TOKEN) {
  console.warn('[seguridad] APP_API_TOKEN no está configurado: el backend acepta pedidos sin autenticar.');
}

app.use((req, res, next) => {
  if (req.path === '/') return next();
  if (!APP_TOKEN) return next();
  if (req.get('X-App-Token') === APP_TOKEN) return next();
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

/* Instancia de Afip para consultar por un CUIT.
   Ojo con esto, que es la clave de todo el asunto: el certificado es SIEMPRE
   el del estudio, y `cuit` es el del cliente que se consulta. ARCA lo permite
   solo si ese cliente delegó el servicio al estudio desde su clave fiscal. */
function crearAfip(cuit) {
  const cert = leerPem(process.env.AFIP_CERT);
  const key  = leerPem(process.env.AFIP_KEY);
  const cuitConsulta = String(cuit || process.env.AFIP_CUIT || '').replace(/\D/g, '');

  if (!cert || !key) {
    const err = new Error('Faltan las credenciales de ARCA. Configurá AFIP_CERT y AFIP_KEY en Railway.');
    err.faltanCreds = true;
    throw err;
  }
  if (!cuitConsulta) {
    const err = new Error('Falta el CUIT a consultar.');
    err.faltanCreds = true;
    throw err;
  }

  const opts = {
    CUIT: cuitConsulta,
    cert, key,
    production: (process.env.AFIP_ENV || 'testing') === 'production'
  };
  const token = process.env.AFIP_ACCESS_TOKEN || '';
  if (token) opts.access_token = token;
  return new Afip(opts);
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
async function traerDeUnTipo(afip, ptoVta, tipo, desdeNum, hastaNum) {
  const lista = [];
  let ultimo = 0;
  try {
    ultimo = await afip.ElectronicBilling.getLastVoucher(ptoVta, tipo);
  } catch (_) {
    return lista;   // ese punto de venta no tiene comprobantes de este tipo
  }
  if (!ultimo) return lista;

  let consultas = 0;
  let anterioresSeguidos = 0;

  for (let nro = ultimo; nro >= 1 && consultas < TOPE_CONSULTAS; nro--) {
    consultas++;
    let v = null;
    try {
      v = await afip.ElectronicBilling.getVoucherInfo(nro, ptoVta, tipo);
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

    const afip = crearAfip(cuit);
    const desdeNum = desdeANumero(desde);
    const hastaNum = hastaANumero(hasta);

    let puntos = [];
    try {
      const pv = await afip.ElectronicBilling.getSalesPoints();
      puntos = (pv || []).filter(p => p.Bloqueado === 'N').map(p => p.Nro);
    } catch (_) {
      /* Algunos contribuyentes no exponen el padrón de puntos de venta.
         El 1 es el habitual, así que se intenta igual en vez de fallar. */
      puntos = [1];
    }
    if (!puntos.length) puntos = [1];

    const tipoParam = parseInt(req.query.tipo, 10) || 0;
    const tipos = tipoParam ? [tipoParam] : TIPOS;

    const comprobantes = [];
    for (const pto of puntos) {
      for (const tipo of tipos) {
        const parcial = await traerDeUnTipo(afip, pto, tipo, desdeNum, hastaNum);
        comprobantes.push(...parcial);
      }
    }

    comprobantes.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));

    return res.json({
      cuit, desde, hasta,
      puntosDeVenta: puntos,
      cantidad: comprobantes.length,
      porPeriodo: totalizarPorPeriodo(comprobantes),
      comprobantes
    });
  } catch (e) {
    return res.status(e.faltanCreds ? 400 : 500).json({ error: e.message, detalle: detalleError(e) });
  }
});

/* ==========================================================================
   CONSTANCIA DE INSCRIPCIÓN (web service de padrón)
   ========================================================================== */

/* GET /arca/constancia?cuit=20123456786
   Devuelve los datos del contribuyente: razón social, domicilio, actividades,
   impuestos y categoría de monotributo. Sirve para llenar la ficha sola. */
app.get('/arca/constancia', async (req, res) => {
  try {
    const cuit = String(req.query.cuit || '').replace(/\D/g, '');
    if (cuit.length !== 11) return res.status(400).json({ error: 'CUIT inválido.' });

    const afip = crearAfip(process.env.AFIP_CUIT || cuit);
    const datos = await afip.RegisterScopeThirteen.getTaxpayerDetails(cuit);
    if (!datos) return res.status(404).json({ error: 'ARCA no devolvió datos para ese CUIT.' });

    const persona  = datos.datosGenerales || {};
    const mono     = datos.datosMonotributo || {};
    const domicilio = persona.domicilioFiscal || {};

    return res.json({
      cuit,
      razonSocial: persona.razonSocial ||
                   [persona.apellido, persona.nombre].filter(Boolean).join(', '),
      estado:      persona.estadoClave || '',
      domicilio: {
        calle:      domicilio.direccion || '',
        localidad:  domicilio.localidad || '',
        provincia:  domicilio.descripcionProvincia || '',
        cp:         domicilio.codPostal || ''
      },
      categoriaMonotributo: mono.categoriaMonotributo &&
                            (mono.categoriaMonotributo.descripcionCategoria ||
                             mono.categoriaMonotributo.idCategoria) || '',
      actividad: (mono.actividadMonotributista &&
                  mono.actividadMonotributista.descripcionActividad) || '',
      crudo: datos
    });
  } catch (e) {
    return res.status(e.faltanCreds ? 400 : 500).json({ error: e.message, detalle: detalleError(e) });
  }
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
  if ((process.env.AFIP_ENV || 'testing') !== 'production') avisos.push('ARCA en modo TESTING: las consultas van al ambiente de homologación, no a los datos reales.');
  if (!APP_TOKEN) avisos.push('APP_API_TOKEN sin configurar: el backend acepta pedidos de cualquiera.');
  if (!ORIGENES.length) avisos.push('ALLOWED_ORIGINS sin configurar: acepta llamadas desde cualquier dominio.');

  res.json({
    certificadoCargado: !!cert,
    claveCargada:       !!key,
    certificadoEsPem:   cert.indexOf('-----BEGIN CERTIFICATE-----') === 0,
    claveEsPem:         key.indexOf('-----BEGIN') === 0,
    cuitDelEstudio:     process.env.AFIP_CUIT ? String(process.env.AFIP_CUIT).replace(/\D/g, '') : '',
    ambiente:           process.env.AFIP_ENV || 'testing',
    tokenConfigurado:   !!APP_TOKEN,
    corsRestringido:    ORIGENES.length > 0,
    avisos
  });
});

/* Prueba de punta a punta contra ARCA: si esto responde, el certificado y la
   delegación de ese CUIT están bien. Es el primer lugar donde mirar cuando
   "no trae nada". */
app.get('/diag/arca', async (req, res) => {
  try {
    const cuit = String(req.query.cuit || process.env.AFIP_CUIT || '').replace(/\D/g, '');
    const afip = crearAfip(cuit);
    const out = { cuit, estadoServidores: null, puntosDeVenta: null };
    try { out.estadoServidores = await afip.ElectronicBilling.getServerStatus(); } catch (e) { out.estadoServidores = 'error: ' + e.message; }
    try { out.puntosDeVenta    = await afip.ElectronicBilling.getSalesPoints();  } catch (e) { out.puntosDeVenta = 'error: ' + e.message; }
    return res.json(out);
  } catch (e) {
    return res.status(e.faltanCreds ? 400 : 500).json({ error: e.message, detalle: detalleError(e) });
  }
});

app.listen(PORT, () => console.log('EBD backend escuchando en el puerto ' + PORT));
