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

/* Los PDF y las fotos viajan en base64 dentro del JSON, y una constancia
   escaneada tranquilamente pasa los 2 MB. */
app.use(express.json({ limit: '12mb' }));

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
   COMPROBANTES DEL PORTAL ("Mis Comprobantes", vía Afip SDK)
   ==========================================================================

   Esto es lo que WSFE no puede hacer: traer lo que el cliente facturó desde
   el portal de ARCA, y también lo que recibió. No hay web service oficial,
   así que se automatiza el portal a través de Afip SDK.

   El precio es alto y hay que tenerlo presente: se usa el **usuario y la
   clave fiscal del contribuyente**, y esas credenciales viajan a un tercero.
   Una clave fiscal no abre solo los comprobantes: abre toda la cuenta de esa
   persona en ARCA.

   Por eso acá las credenciales NO se guardan en ninguna variable de entorno
   ni en disco: llegan en el pedido, se usan una vez y se descartan. El
   sistema las saca de la bóveda cifrada en el momento, con la contraseña
   maestra que solo vive en el navegador de quien la escribió. */

const AFIPSDK_BASE = 'https://app.afipsdk.com/api/v1';

function esperar(ms) { return new Promise(r => setTimeout(r, ms)); }

/* El portal espera las fechas como DD/MM/AAAA. */
function fechaDMY(iso) {
  const p = String(iso || '').split('-');
  return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : '';
}

app.post('/portal/comprobantes', async (req, res) => {
  const token = limpiar(process.env.AFIP_SDK_TOKEN) || limpiar(process.env.AFIP_ACCESS_TOKEN);
  if (!token) {
    return res.status(400).json({ error: 'Falta AFIP_SDK_TOKEN en Railway. Es el token de la cuenta de Afip SDK, que es la que automatiza el portal.' });
  }

  const cuit    = String(req.body.cuit || '').replace(/\D/g, '');
  const usuario = String(req.body.usuario || '').trim() || cuit;
  const clave   = String(req.body.clave || '');
  const tipo    = req.body.tipo === 'R' ? 'R' : 'E';
  const desde   = String(req.body.desde || '');
  const hasta   = String(req.body.hasta || desde);

  if (cuit.length !== 11) return res.status(400).json({ error: 'CUIT inválido.' });
  if (!clave)             return res.status(400).json({ error: 'Falta la clave fiscal de ese cliente. Cargala en la bóveda.' });
  if (!fechaDMY(desde))   return res.status(400).json({ error: 'Falta el rango de fechas.' });

  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  const filtros = { t: tipo, fechaEmision: fechaDMY(desde) + ' - ' + fechaDMY(hasta) };

  try {
    /* 1) Se crea la automatización. */
    const crear = await fetch(AFIPSDK_BASE + '/automations', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        automation: 'mis-comprobantes',
        params: { cuit: cuit, username: usuario, password: clave, filters: filtros }
      })
    });
    const creado = await crear.json().catch(() => ({}));
    if (!crear.ok) {
      return res.status(crear.status).json({ error: 'Afip SDK rechazó el pedido.', detalle: JSON.stringify(creado) });
    }
    const id = creado.id || creado._id || (creado.data && creado.data.id);
    if (!id) return res.status(502).json({ error: 'Afip SDK no devolvió un identificador de la tarea.' });

    /* 2) Es asíncrona: hay que preguntar hasta que termine. El portal de ARCA
       es lento, así que se espera hasta tres minutos. */
    let resultado = null;
    for (let intento = 0; intento < 36; intento++) {
      await esperar(5000);
      const r = await fetch(AFIPSDK_BASE + '/automations/' + id, { headers });
      const j = await r.json().catch(() => ({}));
      const estado = String(j.status || (j.data && j.data.status) || '').toLowerCase();
      if (estado && ['in_process', 'pending', 'processing'].indexOf(estado) === -1) { resultado = j; break; }
    }
    if (!resultado) {
      return res.status(504).json({ error: 'El portal de ARCA tardó demasiado. Probá con un rango de fechas más corto.' });
    }

    const estado = String(resultado.status || (resultado.data && resultado.data.status) || '').toLowerCase();
    if (estado === 'error' || estado === 'failed') {
      return res.status(502).json({
        error: 'No se pudo entrar al portal con esas credenciales. Revisá el usuario y la clave fiscal de ese cliente en la bóveda.',
        detalle: JSON.stringify(resultado).slice(0, 400)
      });
    }

    /* 3) La forma exacta de la respuesta cambia según la versión, así que se
       buscan las filas en los tres lugares donde suelen venir. */
    let filas = resultado.data;
    if (filas && !Array.isArray(filas) && Array.isArray(filas.data)) filas = filas.data;
    if (!Array.isArray(filas)) filas = resultado.result || resultado.comprobantes || [];
    if (!Array.isArray(filas)) filas = [];

    /* Se devuelven tal como vinieron: el sistema las pasa por el mismo
       reconocedor de columnas que usa para el archivo de Mis Comprobantes,
       que ya tolera que ARCA les cambie el nombre a las columnas. */
    return res.json({ cuit, tipo, desde, hasta, cantidad: filas.length, filas });
  } catch (e) {
    return res.status(500).json({ error: 'Falló la consulta al portal: ' + e.message });
  }
});

/* ==========================================================================
   GEMINI — leer constancias y responder preguntas

   La clave de Gemini no puede vivir en el index.html: cualquiera que abra la
   página la vería y la podría gastar. Va acá, en una variable de entorno, y el
   sistema le pide a este backend que hable con Google.

   Un solo endpoint para los dos usos —leer un archivo y contestar una
   pregunta— porque a Gemini se le manda lo mismo: texto y, si hay, un archivo
   adjunto. Lo que cambia es la consigna, y esa la arma el frontend.
   ========================================================================== */

const GEMINI_KEY    = limpiar(process.env.GEMINI_API_KEY);
const GEMINI_MODELO = limpiar(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';

/* Tipos que Gemini acepta como adjunto. Cualquier otro se rechaza acá y no se
   gasta una llamada para que conteste que no puede. */
const TIPOS_ADJUNTO = [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'
];

app.post('/gemini', async (req, res) => {
  if (!GEMINI_KEY) {
    return res.status(503).json({
      error: 'Falta GEMINI_API_KEY en el backend',
      detalle: 'Cargala en las variables de entorno de Railway y reiniciá el servicio.'
    });
  }

  const prompt  = limpiar(req.body && req.body.prompt);
  const archivo = req.body && req.body.archivo;   // { mime, datos } en base64, sin el prefijo data:

  if (!prompt) return res.status(400).json({ error: 'Falta el texto de la consulta' });

  if (archivo && TIPOS_ADJUNTO.indexOf(limpiar(archivo.mime)) === -1) {
    return res.status(400).json({
      error: 'Tipo de archivo no soportado',
      detalle: 'Se puede mandar PDF, PNG, JPG, WEBP o HEIC. Llegó: ' + limpiar(archivo.mime)
    });
  }

  const partes = [{ text: prompt }];
  if (archivo && archivo.datos) {
    partes.push({ inline_data: { mime_type: archivo.mime, data: archivo.datos } });
  }

  const cuerpo = {
    contents: [{ parts: partes }],
    generationConfig: {
      temperature: req.body.temperatura === undefined ? 0.2 : Number(req.body.temperatura),
      maxOutputTokens: 2048
    }
  };

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
                encodeURIComponent(GEMINI_MODELO) + ':generateContent?key=' + encodeURIComponent(GEMINI_KEY);

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo)
    });
    const j = await r.json();

    if (!r.ok) {
      /* El error de Google se devuelve tal cual: dice si la clave es inválida,
         si se agotó la cuota o si el modelo no existe, y son tres arreglos
         distintos. Esconderlo detrás de "error de Gemini" no ayuda a nadie. */
      return res.status(r.status).json({
        error: 'Gemini rechazó la consulta',
        detalle: (j && j.error && j.error.message) || ('HTTP ' + r.status)
      });
    }

    const cand  = j.candidates && j.candidates[0];
    const texto = cand && cand.content && cand.content.parts
      ? cand.content.parts.map(p => p.text || '').join('').trim()
      : '';

    if (!texto) {
      return res.status(502).json({
        error: 'Gemini no devolvió texto',
        detalle: (cand && cand.finishReason) || 'sin respuesta'
      });
    }

    res.json({ texto, modelo: GEMINI_MODELO });
  } catch (e) {
    res.status(502).json({ error: 'No pude hablar con Gemini', detalle: e.message });
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
  if (entorno() !== 'production') avisos.push('ARCA en modo TESTING: las consultas van al ambiente de homologación, no a los datos reales.');
  if (!APP_TOKEN) avisos.push('APP_API_TOKEN sin configurar: el backend acepta pedidos de cualquiera.');
  if (!ORIGENES.length) avisos.push('ALLOWED_ORIGINS sin configurar: acepta llamadas desde cualquier dominio.');
  if (!GEMINI_KEY) avisos.push('GEMINI_API_KEY sin configurar: no funcionan ni el lector de constancias con IA ni el asistente.');

  res.json({
    certificadoCargado: !!cert,
    claveCargada:       !!key,
    certificadoEsPem:   cert.indexOf('-----BEGIN CERTIFICATE-----') === 0,
    claveEsPem:         key.indexOf('-----BEGIN') === 0,
    cuitDelEstudio:     process.env.AFIP_CUIT ? String(process.env.AFIP_CUIT).replace(/\D/g, '') : '',
    ambiente:           entorno(),
    tokenConfigurado:   !!APP_TOKEN,
    corsRestringido:    ORIGENES.length > 0,
    geminiConfigurado:  !!GEMINI_KEY,
    geminiModelo:       GEMINI_KEY ? GEMINI_MODELO : '',
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
