# Backend de EBD — traer comprobantes de ARCA

Este servidor existe por una sola razón: los web services de ARCA piden un
**certificado digital** y su **clave privada**, y eso no puede vivir en el
`index.html`, porque cualquiera que abra la página lo vería. Va acá, en
variables de entorno, y el sistema le pide los datos por HTTP.

**Habla directo con ARCA, sin intermediarios.** La primera versión usaba
`@afipsdk/afip.js`, que no se conecta a ARCA sino a los servidores de Afip
SDK: hay que mandarles el certificado y la clave para que firmen ellos, y
depender de una cuenta suya (sin `access_token` devuelve 401 y nada funciona).
`arca.js` hace el trabajo completo en casa: arma el pedido de acceso, lo firma
con el certificado y conversa con WSAA y WSFE. El certificado no sale nunca de
tu Railway, no hay cuentas de terceros, ni límites, ni costos.

## Qué trae y qué no

| | ¿Se puede? | Cómo |
|---|---|---|
| Emitidos por un cliente que factura **con un sistema conectado** (web service) | Sí | WSFE, con certificado |
| Emitidos por un cliente que factura **desde el portal** de ARCA | Por el portal | Automatizando "Mis Comprobantes" con la clave fiscal del cliente |
| Comprobantes **recibidos** | Por el portal | Ídem: ARCA no tiene web service para esto |
| **Constancia de inscripción** | Todavía no | Otro web service, con su propia adhesión |

⚠️ **La limitación grande es la primera, y conviene entenderla antes de
prometerle nada a nadie.** ARCA usa un punto de venta distinto por cada
modalidad de facturación. Los comprobantes emitidos desde **Comprobantes en
Línea** —el portal web, que es como factura la enorme mayoría de los
monotributistas— viven en un punto de venta que WSFE **no ve**. El web service
solo conoce lo que autorizó el propio web service.

Cuando pasa eso, `FEParamGetPtosVenta` contesta `[602] Sin Resultados`, y el
backend lo marca como `sinPuntosWeb: true` en la respuesta para que el sistema
pueda decirlo con todas las letras en vez de mostrar "no hay comprobantes".
No es un trámite que falte: no hay forma de traerlos por acá.

Para esos clientes —o sea, casi todos— hay dos caminos: el archivo de Mis
Comprobantes, o `POST /portal/comprobantes`, que automatiza ese portal.

### El camino del portal, y lo que cuesta

`POST /portal/comprobantes` trae emitidos **y** recibidos de cualquier cliente,
incluidos los del portal. Lo hace a través de **Afip SDK**, que entra al portal
con el **usuario y la clave fiscal del contribuyente**.

Eso hay que entenderlo antes de usarlo: una clave fiscal no abre solo los
comprobantes, abre **toda la cuenta** de esa persona en ARCA. Al usar esta
función, esas credenciales viajan a un tercero. Es una decisión del estudio
frente a sus clientes, no una cuestión técnica.

Por eso las credenciales **no se guardan acá**: no hay variable de entorno con
claves de clientes, ni quedan en disco. Llegan en el cuerpo del pedido, se usan
una vez y se descartan. El sistema las saca de la bóveda cifrada en el momento,
con la contraseña maestra que solo vive en el navegador de quien la escribió.

Necesita la variable `AFIP_SDK_TOKEN` (el token de la cuenta de Afip SDK).

---

## Parte 1 — El trámite en ARCA (una sola vez, para el estudio)

Necesitás clave fiscal **nivel 3** del CUIT del estudio.

### 1. Generar la clave privada y el pedido de certificado

En tu computadora, en una carpeta que no esté dentro del repositorio:

```bash
openssl genrsa -out ebd.key 2048
openssl req -new -key ebd.key \
  -subj "/C=AR/O=EBD Consultores/CN=ebd-sistema/serialNumber=CUIT 20XXXXXXXXX" \
  -out ebd.csr
```

Reemplazá `20XXXXXXXXX` por el CUIT del estudio, sin guiones.

- `ebd.key` es la **clave privada**. No se le manda a nadie, no se sube a
  GitHub, no se pierde. Si se filtra, quien la tenga puede operar en ARCA
  en nombre del estudio.
- `ebd.csr` es el pedido: ese sí se sube a ARCA.

### 2. Subirlo a ARCA

Entrá con clave fiscal a **Administración de Certificados Digitales**, creá un
alias (por ejemplo `ebd-sistema`) y subí el `ebd.csr`. ARCA te devuelve el
archivo `.crt`: ese es el certificado.

Dura **2 años** y avisan por mail 30 días antes del vencimiento. Cuando llegue
ese momento se repite este paso; la clave privada puede ser la misma.

### 3. Habilitar el web service

En **Administrador de Relaciones de Clave Fiscal**, creá una relación nueva:
buscá el servicio **Facturación Electrónica (WSFE)** dentro de Web Services y
elegí como representante el alias del certificado que acabás de crear.

### 4. Que cada cliente te delegue (esto es por cliente)

Sin este paso ARCA no deja consultar los comprobantes de nadie más que del
propio estudio. Cada contribuyente, con **su** clave fiscal, entra a
Administrador de Relaciones y delega el servicio al estudio, eligiendo el alias
del estudio en el desplegable de *Computador Fiscal* (el campo de CUIT queda
vacío).

Es el paso más lento de todos, porque depende de cada cliente. Conviene
arrancar por los que más facturan.

---

## Parte 2 — Desplegarlo en Railway

Ya tenés Railway andando para el otro sistema; este va como un servicio nuevo
apuntando a la carpeta `functions/` de este repositorio.

Los archivos hay que pasarlos a una sola línea para poder pegarlos como
variable de entorno:

```bash
base64 -w0 ebd.crt   # en Mac: base64 -i ebd.crt
base64 -w0 ebd.key
```

### Variables de entorno

| Variable | Qué es | ¿Obligatoria? |
|---|---|---|
| `AFIP_CERT` | El `.crt` en base64 (o el PEM entero) | Sí |
| `AFIP_KEY` | El `.key` en base64 (o el PEM entero) | Sí |
| `AFIP_CUIT` | CUIT del estudio, sin guiones | Sí |
| `AFIP_ENV` | `production` para datos reales, `testing` para probar | Sí |
| `APP_API_TOKEN` | Una contraseña larga inventada por vos. El sistema la manda en cada pedido | Sí |
| `ALLOWED_ORIGINS` | `https://speranzaemiliano-rk.github.io` | Recomendada |
| `AFIP_SDK_TOKEN` | Token de la cuenta de Afip SDK. Solo hace falta para traer del portal | Para el portal |

Sin `APP_API_TOKEN` el backend queda abierto a cualquiera que descubra la URL.
Sin `ALLOWED_ORIGINS`, cualquier página puede llamarlo desde el navegador.

### Comprobar que quedó bien

```bash
curl -H "X-App-Token: TU_TOKEN" https://TU-BACKEND.railway.app/diag
```

Te dice qué está cargado y qué falta, sin mostrar nunca el valor de nada
secreto. Cuando ya tengas el certificado y la delegación de algún cliente:

```bash
curl -H "X-App-Token: TU_TOKEN" "https://TU-BACKEND.railway.app/diag/arca?cuit=CUIT_DEL_CLIENTE"
```

Si devuelve el estado de los servidores y los puntos de venta, está todo bien.
Si dice que no está autorizado, falta la delegación de ese cliente.

---

## Los endpoints

| Endpoint | Qué hace |
|---|---|
| `GET /` | Responde `ok`. Sirve para ver si el servicio está vivo |
| `GET /diag` | Qué credenciales están cargadas y qué falta |
| `GET /diag/firma` | Revisa el certificado **sin hablar con ARCA**: si es legible, si es pareja de la clave y hasta cuándo vale |
| `GET /diag/arca?cuit=` | Prueba real contra ARCA, en tres pasos separados |
| `GET /arca/emitidos?cuit=&desde=&hasta=` | Comprobantes emitidos del rango, más el total por período |
| `GET /arca/constancia?cuit=` | Todavía no implementado (usa otro web service de ARCA) |
| `POST /portal/comprobantes` | Emitidos y recibidos desde el portal, con la clave fiscal del cliente |

Mirá `/diag/firma` **antes** que `/diag/arca`: si la clave y el certificado no
son pareja, no hay nada más que probar, y esta consulta no gasta un ticket de
acceso. Eso importa porque ARCA no emite un ticket nuevo mientras el anterior
siga vigente (duran 12 horas), así que probar "a ver si anda" tiene costo.

`/diag/arca` separa los tres pasos a propósito, porque cada uno falla por un
motivo distinto: el estado de los servidores de ARCA, el ticket de acceso (que
depende del certificado) y los puntos de venta (que dependen de la delegación
de ese cliente).

`desde` y `hasta` son períodos con formato `AAAAMM` (por ejemplo `202601`).

Todos, menos `/`, piden el header `X-App-Token`.

### Sobre `/arca/emitidos`

WSFE no tiene una consulta del tipo "traeme todo lo del mes": hay que pedir
comprobante por comprobante. El backend arranca desde el último y va hacia
atrás, cortando apenas se pasa del rango pedido, así que un mes suelto se
resuelve rápido aunque el cliente tenga años de facturación.

Devuelve `porPeriodo`, que ya viene sumado y con las notas de crédito restadas
—si no, el total facturado queda inflado y la recategorización da mal—, y las
facturas en otra moneda convertidas a pesos con la cotización del propio
comprobante.

## Correrlo en tu máquina

```bash
cd functions
npm install
APP_API_TOKEN=loquesea npm start
```
