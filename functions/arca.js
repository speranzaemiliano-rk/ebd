/* ==========================================================================
   Conversación directa con ARCA — sin intermediarios

   Por qué existe este archivo: la librería @afipsdk/afip.js no habla con ARCA,
   habla con los servidores de Afip SDK, que firman por vos. Eso significa
   mandarle el certificado y la clave privada del estudio a un tercero, y
   depender de una cuenta suya. Acá se hace todo en casa.

   Son dos servicios encadenados:

   1. WSAA — el portero. Se le manda un pedido (TRA) firmado con el
      certificado, y devuelve un Ticket de Acceso: un token y una firma que
      valen 12 horas.
   2. WSFE — el que tiene los datos. Cada llamada lleva el ticket, más el CUIT
      del contribuyente que se consulta.

   La delegación entra acá: el ticket se saca SIEMPRE con el certificado del
   estudio, y el CUIT que va en cada llamada es el del cliente. ARCA responde
   solo si ese cliente delegó el servicio al estudio.
   ========================================================================== */

const fs    = require('fs');
const path  = require('path');
const forge = require('node-forge');
const { XMLParser } = require('fast-xml-parser');

const URLS = {
  production: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
  },
  testing: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
  }
};

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true
});

/* ==========================================================================
   EL TICKET DE ACCESO (WSAA)
   ========================================================================== */

/* ARCA rechaza pedir un ticket nuevo mientras el anterior siga vivo, así que
   guardarlo no es una optimización: es parte del protocolo. Va en memoria y
   también en disco, porque Railway reinicia el proceso cada tanto y sin la
   copia en disco el reinicio deja al backend sin poder pedir uno nuevo hasta
   que el viejo expire, 12 horas después. */
let ticketEnMemoria = null;
const ARCHIVO_TICKET = path.join(process.env.TMPDIR || '/tmp', 'arca-ta-wsfe.json');

function leerTicketGuardado() {
  if (ticketEnMemoria) return ticketEnMemoria;
  try {
    const t = JSON.parse(fs.readFileSync(ARCHIVO_TICKET, 'utf8'));
    ticketEnMemoria = t;
    return t;
  } catch (_) { return null; }
}

function guardarTicket(t) {
  ticketEnMemoria = t;
  try { fs.writeFileSync(ARCHIVO_TICKET, JSON.stringify(t)); } catch (_) { /* disco de solo lectura: seguimos con memoria */ }
}

function ticketVigente() {
  const t = leerTicketGuardado();
  /* Diez minutos de colchón: un ticket que vence mientras viaja el pedido no
     sirve de nada. */
  if (t && t.expira && Date.now() < t.expira - 10 * 60 * 1000) return t;
  return null;
}

/* El pedido que se firma. Los tiempos importan: ARCA rechaza un TRA con
   fechas muy lejanas a la suya. */
function armarTRA(servicio) {
  const ahora = Date.now();
  const desde = new Date(ahora - 10 * 60 * 1000).toISOString();
  const hasta = new Date(ahora + 10 * 60 * 1000).toISOString();
  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<loginTicketRequest version="1.0">' +
      '<header>' +
        '<uniqueId>' + Math.floor(ahora / 1000) + '</uniqueId>' +
        '<generationTime>' + desde + '</generationTime>' +
        '<expirationTime>' + hasta + '</expirationTime>' +
      '</header>' +
      '<service>' + servicio + '</service>' +
    '</loginTicketRequest>';
}

/* Firma CMS (PKCS#7) del TRA, en base64. Es lo que ARCA usa para saber que el
   pedido viene de quien dice venir. */
function firmarTRA(tra, certPem, keyPem) {
  let cert, key;
  try {
    cert = forge.pki.certificateFromPem(certPem);
  } catch (e) {
    throw new Error('El certificado (AFIP_CERT) no se puede leer: ' + e.message);
  }
  try {
    key = forge.pki.privateKeyFromPem(keyPem);
  } catch (e) {
    throw new Error('La clave privada (AFIP_KEY) no se puede leer: ' + e.message);
  }

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(tra, 'utf8');
  p7.addCertificate(cert);
  p7.addSigner({
    key: key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() }
    ]
  });
  p7.sign({ detached: false });

  return forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes());
}

function escaparXml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/* Cuando ARCA rechaza algo devuelve un SOAP Fault, que es un 500 con el
   motivo adentro. Sin sacarlo de ahí, el error que se ve arriba es un
   "500" pelado que no dice nada. */
function motivoDelFault(xml) {
  const m = String(xml || '').match(/<faultstring>([\s\S]*?)<\/faultstring>/i);
  return m ? m[1].trim() : '';
}

async function pedirTicket(certPem, keyPem, ambiente, servicio) {
  const tra = armarTRA(servicio);
  const cms = firmarTRA(tra, certPem, keyPem);

  const sobre =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">' +
      '<soapenv:Header/><soapenv:Body><wsaa:loginCms><wsaa:in0>' + cms + '</wsaa:in0></wsaa:loginCms></soapenv:Body>' +
    '</soapenv:Envelope>';

  const r = await fetch(URLS[ambiente].wsaa, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '' },
    body: sobre
  });
  const texto = await r.text();

  if (!r.ok) {
    const motivo = motivoDelFault(texto);
    if (motivo.indexOf('ya posee un TA valido') !== -1) {
      throw new Error('ARCA dice que ya hay un ticket de acceso vigente y no emite otro. Esperá unos minutos y probá de nuevo.');
    }
    throw new Error('WSAA rechazó el pedido: ' + (motivo || ('HTTP ' + r.status)));
  }

  const cuerpo = parser.parse(texto);
  const ta = cuerpo && cuerpo.Envelope && cuerpo.Envelope.Body &&
             cuerpo.Envelope.Body.loginCmsResponse &&
             cuerpo.Envelope.Body.loginCmsResponse.loginCmsReturn;
  if (!ta) throw new Error('WSAA respondió algo que no se entiende.');

  /* El ticket viene como un XML adentro del XML. */
  const dentro = parser.parse(ta);
  const cred = dentro && dentro.loginTicketResponse && dentro.loginTicketResponse.credentials;
  const header = dentro && dentro.loginTicketResponse && dentro.loginTicketResponse.header;
  if (!cred || !cred.token || !cred.sign) throw new Error('El ticket de acceso vino incompleto.');

  const t = {
    token: cred.token,
    sign:  cred.sign,
    expira: header && header.expirationTime ? new Date(header.expirationTime).getTime() : (Date.now() + 11 * 60 * 60 * 1000)
  };
  guardarTicket(t);
  return t;
}

async function obtenerTicket(certPem, keyPem, ambiente) {
  const guardado = ticketVigente();
  if (guardado) return guardado;
  return pedirTicket(certPem, keyPem, ambiente, 'wsfe');
}

/* ==========================================================================
   LAS CONSULTAS (WSFE)
   ========================================================================== */

async function llamarWsfe(metodo, cuerpoXml, ambiente) {
  const sobre =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">' +
      '<soap:Body><ar:' + metodo + '>' + cuerpoXml + '</ar:' + metodo + '></soap:Body>' +
    '</soap:Envelope>';

  const r = await fetch(URLS[ambiente].wsfe, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'http://ar.gov.afip.dif.FEV1/' + metodo
    },
    body: sobre
  });
  const texto = await r.text();

  if (!r.ok) {
    const motivo = motivoDelFault(texto);
    throw new Error('ARCA rechazó la consulta ' + metodo + ': ' + (motivo || ('HTTP ' + r.status)));
  }

  const parseado = parser.parse(texto);
  const body = parseado && parseado.Envelope && parseado.Envelope.Body;
  const resp = body && body[metodo + 'Response'];
  const resultado = resp && resp[metodo + 'Result'];
  if (!resultado) throw new Error('ARCA respondió a ' + metodo + ' algo que no se entiende.');

  /* Los errores de negocio no vienen como error de HTTP: vienen adentro de la
     respuesta, con código y mensaje. El 600 es el clásico "no estás
     autorizado a representar a ese CUIT". */
  if (resultado.Errors && resultado.Errors.Err) {
    const errs = [].concat(resultado.Errors.Err);
    const detalle = errs.map(function (e) { return '[' + e.Code + '] ' + e.Msg; }).join(' · ');
    const err = new Error(detalle);
    err.codigosArca = errs.map(function (e) { return String(e.Code); });
    throw err;
  }

  return resultado;
}

function bloqueAuth(ticket, cuit) {
  return '<ar:Auth>' +
    '<ar:Token>' + escaparXml(ticket.token) + '</ar:Token>' +
    '<ar:Sign>'  + escaparXml(ticket.sign)  + '</ar:Sign>' +
    '<ar:Cuit>'  + cuit + '</ar:Cuit>' +
  '</ar:Auth>';
}

/* Ping a ARCA. No lleva credenciales: sirve para saber si el problema es de
   ellos o nuestro. */
async function estadoServidores(ambiente) {
  const r = await llamarWsfe('FEDummy', '', ambiente);
  return { appServer: r.AppServer, dbServer: r.DbServer, authServer: r.AuthServer };
}

async function puntosDeVenta(ticket, cuit, ambiente) {
  const r = await llamarWsfe('FEParamGetPtosVenta', bloqueAuth(ticket, cuit), ambiente);
  const lista = r.ResultGet && r.ResultGet.PtoVenta ? [].concat(r.ResultGet.PtoVenta) : [];
  return lista.map(function (p) {
    return { nro: parseInt(p.Nro, 10), tipo: p.EmisionTipo, bloqueado: p.Bloqueado === 'S' };
  });
}

async function ultimoComprobante(ticket, cuit, ptoVta, tipo, ambiente) {
  const r = await llamarWsfe('FECompUltimoAutorizado',
    bloqueAuth(ticket, cuit) +
    '<ar:PtoVta>' + ptoVta + '</ar:PtoVta><ar:CbteTipo>' + tipo + '</ar:CbteTipo>',
    ambiente);
  return parseInt(r.CbteNro, 10) || 0;
}

async function consultarComprobante(ticket, cuit, ptoVta, tipo, nro, ambiente) {
  const r = await llamarWsfe('FECompConsultar',
    bloqueAuth(ticket, cuit) +
    '<ar:FeCompConsReq>' +
      '<ar:CbteTipo>' + tipo + '</ar:CbteTipo>' +
      '<ar:CbteNro>' + nro + '</ar:CbteNro>' +
      '<ar:PtoVta>' + ptoVta + '</ar:PtoVta>' +
    '</ar:FeCompConsReq>',
    ambiente);
  return r.ResultGet || null;
}

/* Arma y firma un TRA de prueba, pero NO lo manda. Sirve para revisar el
   certificado sin gastar un ticket: ARCA no emite uno nuevo mientras el
   anterior siga vigente, así que probar "a ver si anda" tiene costo. */
function probarFirma(certPem, keyPem) {
  const cms  = firmarTRA(armarTRA('wsfe'), certPem, keyPem);
  const cert = forge.pki.certificateFromPem(certPem);
  const key  = forge.pki.privateKeyFromPem(keyPem);

  const pubDelCert = forge.pki.publicKeyToPem(cert.publicKey);
  const pubDeLaKey = forge.pki.publicKeyToPem(forge.pki.setRsaPublicKey(key.n, key.e));

  return {
    firmaGenerada: cms.length > 100,
    sonPareja:     pubDelCert === pubDeLaKey,
    certificadoDe: cert.subject.attributes.map(function (a) { return (a.shortName || a.name) + '=' + a.value; }).join(', '),
    vigenteHasta:  cert.validity.notAfter.toISOString(),
    yaVencio:      cert.validity.notAfter.getTime() < Date.now()
  };
}

module.exports = {
  obtenerTicket,
  probarFirma,
  estadoServidores,
  puntosDeVenta,
  ultimoComprobante,
  consultarComprobante
};
