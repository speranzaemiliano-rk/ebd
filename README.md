# EBD Consultores — Monotributo e IIBB

Sistema de gestión para liquidar monotributo (ARCA), ingresos brutos de Provincia
(ARBA) y de Capital (AGIP), y tasas municipales, con control automático de la
recategorización semestral.

**En línea:** <https://speranzaemiliano-rk.github.io/ebd/>

## Buscador general

La lupa de la barra —o **Ctrl+K** (⌘K en Mac)— abre un buscador que mira en
todo el sistema a la vez: **clientes** (por nombre, CUIT, mail o código de
actividad), **papeles** (por su nombre, con el cliente y el mes al lado) y las
**pantallas**. Se elige con las flechas y se entra con Enter; un papel abre al
cliente directo en sus papeles.

## Filtros en las columnas

En el listado de clientes cada columna tiene su filtro, pegado a la columna que
filtra: nombre, CUIT, actividad, categoría, impuesto, honorario y situación. Se
suman entre sí y con el buscador de arriba, y la ✕ del final los limpia todos.
Abajo dice cuántos clientes quedaron de cuántos.

## Entrar a un cliente

Tocar un cliente en el listado ya no abre una ventana: **se entra al cliente**.
La pantalla entera pasa a ser él, con su propia barra de secciones y un camino
de vuelta arriba a la izquierda.

| Sección | Qué trae |
|---|---|
| **Resumen** | Los dos cortes de recategorización, todos sus datos y la alícuota de IIBB que se le aplica, con su procedencia |
| **Comprobantes** | Lo facturado mes a mes, y el detalle de cada mes |
| **Liquidaciones** | Qué paga por impuesto cada mes, cuántos VEP tiene y en qué estado está, con el botón para cargar |
| **Papeles** | Las carpetas por mes (ver abajo) |
| **Honorarios** | Lo que le corresponde al estudio mes a mes: monto, pagado, saldo y vencimiento |

Es la misma información de siempre, pero ordenada alrededor de la persona en
vez de alrededor de la tarea: antes estaba repartida en cinco solapas, cada una
con su propio filtro «elegí el cliente».

## Todo lo del cliente cuelga de Clientes

**Comprobantes**, **Liquidación** y **Honorarios** dejaron de ser solapas
sueltas de la barra de arriba. Ahora son las vistas «de todos los clientes» y
cuelgan de **Clientes**, en una sub-barra:

> Clientes · Comprobantes · Liquidación · Honorarios

No se perdió ninguna pantalla: la grilla mensual de liquidación y el cuadro de
honorarios del año siguen enteros, porque ver a todos los clientes juntos es
justamente lo que la pantalla de uno no reemplaza. Lo que cambió es que ahora
hay **una sola puerta**, y desde cualquiera de esas vistas el nombre del
cliente entra a su pantalla, en la sección que corresponde: desde la grilla de
liquidación cae en sus Liquidaciones, desde el cuadro de honorarios en sus
Honorarios.

Al revés también: adentro del cliente, **📥 Importar comprobantes** lleva a la
pantalla de importar con ese cliente ya elegido, para no tener que buscarlo de
nuevo en el desplegable.

La barra de arriba quedó en diez solapas en vez de trece, que en el teléfono es
la diferencia entre arrastrarla y no.

Los enlaces viejos siguen andando: los accesos directos del ícono de la app
(`?tab=tabLiquidacion`) y el buscador general abren esas pantallas igual, sólo
que ahora encienden **Clientes** arriba.

## El VEP se lee solo

En la liquidación, al elegir el archivo del VEP o de la declaración jurada, la
IA lo lee y completa **el importe, el número y el vencimiento**.

Lo que está vacío se completa solo. **Lo que ya tiene algo cargado no se pisa**:
se muestra qué dice el papel y se ofrece el cambio, porque un importe escrito
por una persona puede estar corrigiendo al papel a propósito —una compensación,
un plan de pagos— y la IA no tiene manera de saberlo.

Además avisa si el papel **es de otro organismo** o **de otro mes**: pegar el
VEP de ARBA en el casillero de ARCA es un error que después no se ve por ningún
lado.

## Los papeles de cada cliente, mes por mes

Al hacer clic en un cliente, la ficha abre con **Papeles por mes**: una carpeta
por cada mes con todo lo de ese período junto.

Junta las dos cosas que antes vivían separadas:

- lo que se sube desde **Archivos** o desde la propia ficha (declaraciones
  juradas, resúmenes, constancias);
- los **VEP** que se adjuntan al cargar la liquidación del mes — esos no hay que
  volver a subirlos, aparecen solos.

De cada mes se puede **agregar** un papel (ya viene con el cliente y el mes
puestos) y **enviárselo al cliente**.

### Cómo funciona «Enviar al cliente»

Descarga los papeles del mes y abre tu programa de correo con el destinatario,
el asunto y el texto ya escritos, diciendo qué se está mandando. **Los adjuntos
hay que arrastrarlos a mano**: un `mailto:` no puede llevar archivos, y eso lo
prohíbe el navegador — no es algo que falte programar. Por eso el sistema hace
las dos mitades que sí puede: bajar los papeles y dejar el correo escrito.

## Cerrar una ficha

Las ventanas del sistema **no se cierran tocando afuera**. Para salir están la
**✕**, **Cancelar** y **Escape**, y las tres preguntan antes si hay algo cargado
sin guardar. El motivo es concreto: si el botón del mouse se aprieta adentro de
un campo y se suelta afuera —arrastrando para seleccionar texto— el navegador lo
cuenta como un clic en el fondo, y media hora de carga se iba sin aviso.

## En el celular

El mismo sistema, adaptado a pantalla angosta —no el de escritorio achicado—:

- la barra de arriba se queda con lo imprescindible (logo, bóveda, usuario y salir);
- los formularios pasan a una columna y los indicadores a dos;
- **las tablas dejan de ser tablas**: cada fila se lee como una tarjeta de
  «etiqueta: valor», sin arrastrar para los costados. La etiqueta sale sola del
  encabezado de cada tabla, así que vale para todas las pantallas;
- los modales ocupan la pantalla completa con **Cancelar y Guardar fijos abajo**:
  en una ficha larga no hay que scrollear hasta el final para guardar. Y como no
  hay "afuera" del cuadro, tampoco se cierra de un toque perdido.

## Instalarlo como app

El sistema es una PWA: se instala como aplicación, con ícono propio y ventana
sin barra del navegador.

| Dónde | Cómo |
|---|---|
| **Android** | Abrí el link en Chrome y tocá **Instalar app** arriba a la derecha. |
| **iPhone / iPad** | Abrilo en **Safari** (no Chrome) → botón **Compartir** → **Agregar a inicio**. |
| **Windows / Mac** | Abrilo en Chrome o Edge y tocá **Instalar app**, o el ícono ⊕ de la barra de direcciones. |

Instalado, el ícono deja además accesos directos: mantené apretado el ícono y
saltás directo a Recategorización, Liquidación o Clientes.

> Cada vez que se modifique `index.html`, hay que subir el número de `VERSION`
> en `sw.js`. Si no, algunos navegadores siguen mostrando la versión vieja.

## Cómo está armado

- **`index.html`** — todo el sistema en un solo archivo: HTML, CSS y JavaScript.
  No usa frameworks ni build. Se edita y se sube tal cual.
- **`database.rules.json`** — reglas de seguridad de la base. Se pegan en Firebase.
- **Firebase Realtime Database** — la base de datos. Path raíz: `estudioContable`.
- **Firebase Authentication** — login por correo y contraseña, con roles.
- **GitHub Pages** — hosting.

---

## Paso 1 — Crear el proyecto en Firebase

1. Entrá a <https://console.firebase.google.com> con la cuenta de Google del estudio.
2. **Agregar proyecto** → nombre (ej. `estudio-contable`) → podés desactivar Google Analytics.
3. Cuando termine, entrá al proyecto.

## Paso 2 — Crear la base de datos

1. Menú izquierdo → **Compilación → Realtime Database** → **Crear base de datos**.
2. Ubicación: cualquiera (por ejemplo `us-central1`).
3. Elegí **Iniciar en modo bloqueado**. Las reglas buenas las pegamos en el paso 4.

> Ojo: tiene que ser **Realtime Database**, no Firestore. Son dos productos distintos
> y el sistema usa el primero.

## Paso 3 — Activar el login

1. Menú izquierdo → **Compilación → Authentication** → **Comenzar**.
2. Pestaña **Sign-in method** → habilitá **Correo electrónico/contraseña**.
3. Pestaña **Users** → **Agregar usuario** → poné tu correo y una contraseña.
   Ese es el usuario con el que vas a entrar al sistema.

## Paso 4 — Pegar las reglas de seguridad

1. Realtime Database → pestaña **Reglas**.
2. Borrá lo que haya y pegá el contenido completo de `database.rules.json`.
3. **Publicar**.

Qué hacen estas reglas:

| Nodo | Lectura | Escritura |
|---|---|---|
| `clientes`, `comprobantes`, `totales`, `liquidaciones` | cualquier usuario logueado | admin y editor |
| `escalas`, `config` | cualquier usuario logueado | solo admin |
| `credenciales` (bóveda) | **solo admin** | **solo admin** |
| todo lo que esté fuera de `estudioContable` | nadie | nadie |

La interfaz acompaña esas reglas: al entrar, `aplicarPermisos()` esconde los
botones que el rol no puede usar, y los botones que se dibujan por fila
(editar cliente, cargar liquidación, aplicar recategorización, editar o borrar
un movimiento de caja, cuentas y proveedores) se filtran con `puedeEscribir()`.
Un **lector** ve todo pero no le aparece ningún botón de carga; un **editor**
carga datos pero no ve Escalas, Configuración, plantilla de mail, usuarios ni
bóveda; el **admin** ve todo. Si agregás un botón que guarde algo, sumalo a
`BOTONES_ESCRITURA` o a `BOTONES_ADMIN`, según quién deba poder usarlo.

## Paso 5 — Copiar las credenciales al archivo

1. Rueda dentada (arriba a la izquierda) → **Configuración del proyecto**.
2. Bajá hasta **Tus apps** → ícono **`</>`** (Web) → ponele un apodo → **Registrar app**.
3. Firebase te muestra un bloque `const firebaseConfig = { ... }`. Copialo.
4. Abrí `index.html`, buscá `var firebaseConfig = {` (está arriba de todo del script)
   y reemplazá los siete valores `PEGAR_...` por los tuyos.

Importante: el `databaseURL` a veces **no** viene en ese bloque. Si falta, copialo
de la pantalla de Realtime Database (arriba de la tabla de datos). Tiene esta forma:

```
https://tu-proyecto-default-rtdb.firebaseio.com
```

o, según la región:

```
https://tu-proyecto-default-rtdb.southamerica-east1.firebasedatabase.app
```

> Estas claves **no son secretas**: van en el HTML y cualquiera que abra la página
> las ve. Lo que protege la base son las reglas del paso 4, no las claves.

## Paso 6 — Subir a GitHub Pages

```bash
git init
git add .
git commit -m "Sistema estudio contable"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/estudio-contable.git
git push -u origin main
```

Después: repositorio en GitHub → **Settings → Pages** → Source: `main` / carpeta `/ (root)` → **Save**.
En un par de minutos queda en `https://TU-USUARIO.github.io/estudio-contable/`.

Último paso: volvé a Firebase → **Authentication → Settings → Dominios autorizados**
y agregá `TU-USUARIO.github.io`. Sin esto el login no funciona desde GitHub Pages.

---

## Por qué no alcanza con abrir el archivo con doble clic

Los navegadores bloquean el almacenamiento local en las URLs `file://`, y Firebase
lo necesita para mantener la sesión. Si abrís `index.html` desde el disco vas a ver
un aviso. Usá GitHub Pages, o serví la carpeta por HTTP desde tu máquina.

---

## Primer uso

1. Entrá con el usuario que creaste en el paso 3.
2. **Configuración** → cargá los datos del estudio.
3. **Configuración** → inicializá la bóveda con una contraseña maestra.
   Guardala en un lugar seguro: no se almacena en ningún lado y no hay forma de recuperarla.
4. **Clientes** → cargá el primer contribuyente.
5. **Comprobantes** → importá el archivo de Mis Comprobantes, en CSV o en Excel.
6. **Recategorización** → mirá el semáforo.

La escala de ARCA vigente desde el 01/08/2026 ya viene cargada. Cuando publiquen la
próxima (enero 2027), andá a **Escalas ARCA → + Nueva vigencia** en vez de editar la
existente: así los cálculos de períodos anteriores siguen dando bien.

Las **alícuotas de ARBA 2026** también vienen cargadas: se traen con un botón
desde **Alícuotas IIBB → Cargar la tabla** (ver más abajo). Las de AGIP se cargan
con el anexo de la Ley Impositiva de la Ciudad; mientras no estén, los importes
de AGIP siguen yendo a mano.

---

## Traer los comprobantes de ARCA sin importar archivos

El backend que consulta los web services de ARCA está en la carpeta
**`functions/`** — ver `functions/README.md`, que tiene el paso a paso completo.
Trae los comprobantes **emitidos** y la **constancia de inscripción**.

Del lado del sistema ya está todo: en **Configuración → Conexión con ARCA** se
cargan la dirección del backend y el token, con un botón **Probar conexión** que
dice exactamente qué falta. Después, en **Comprobantes**, el botón **Traer de
ARCA** los baja sin pasar por ningún archivo.

Para que empiece a funcionar faltan tres cosas, y ninguna es código:

1. Sacar el certificado digital del estudio en ARCA (clave fiscal nivel 3).
2. Que cada cliente delegue el servicio al estudio desde su clave fiscal.
3. Desplegar la carpeta `functions/` en Railway con el certificado cargado.

Los comprobantes **recibidos** no tienen web service en ARCA: esos se siguen
importando desde el archivo de Mis Comprobantes, en CSV o en Excel.

## Alícuotas de ingresos brutos (ARBA y AGIP)

La alícuota de IIBB no depende del cliente sino de la **actividad**: el código
NAIIB en ARBA —alineado al NAES—, el mismo NAES en AGIP. Y el porcentaje de cada
código lo fija todos los años la **Ley Impositiva** de la jurisdicción.

La de **ARBA 2026 ya viene cargada**: son las 1.022 actividades del nomenclador
NAIIB-18 con sus tramos por facturación, sacadas del archivo oficial de ARBA
(ver `datos/README.md`). Se traen con un botón desde **Alícuotas IIBB → Cargar la
tabla → Traer la tabla de ARBA 2026**. La de AGIP se carga igual, con el anexo
de la Ley Impositiva de la Ciudad.

Ningún porcentaje está estimado: salen del archivo del organismo, y la pantalla
guarda de dónde salieron.

**Cargar la tabla** acepta tres formatos:

- el **Excel o CSV** del nomenclador (reconoce las columnas por el encabezado,
  aunque haya renglones de título arriba);
- el **texto pegado** del anexo (un renglón por actividad: código, nombre y
  porcentaje);
- un **PDF**, del que primero intenta leer el texto solo y, si no alcanza, lo
  lee con IA.

El archivo **Alicuotaria** de ARBA entra tal cual, sin abrirlo ni convertirlo:
se llama `.xls` pero adentro es texto separado por tabulaciones, trae todos los
años y varias filas por actividad. El sistema se queda con el período más nuevo,
arma los tramos y completa solo la vigencia, el mínimo y la fuente.

Salga de donde salga, antes de guardar se muestra todo en una **tabla editable**:
lo que corrijas ahí es lo que se guarda. El sistema no inventa ningún porcentaje.

### Los tramos por facturación

En ARBA la alícuota de una misma actividad **cambia según cuánto facturó el
contribuyente el año anterior** (art. 28 de la Ley Impositiva). Un estudio
jurídico que facturó 8 millones paga **3,5%**; con el mismo código, uno que
facturó 2.000 millones paga **4,5%**. Ignorar el tramo sería cobrarle de más a
casi todos los clientes de un estudio que atiende monotributistas.

El sistema ubica el tramo solo, con lo facturado del año calendario anterior que
ya tiene cargado de los comprobantes. Si de ese año no hay datos usa los últimos
12 meses y lo aclara; si no hay nada, usa la alícuota general de la actividad y
también lo aclara.

Con la tabla cargada:

- en la **ficha del cliente**, debajo de cada alícuota aparece lo que dice la
  tabla para el código de actividad, con un link para copiarla;
- en la **liquidación mensual**, el importe se calcula solo y abajo del cálculo
  dice de dónde salió el porcentaje (ficha, tabla o alícuota general);
- lo que esté escrito en la ficha **siempre gana**: la tabla es el valor por
  defecto, no una imposición.

Además se puede cargar la **alícuota general** (la subsidiaria) de cada
jurisdicción, que se usa cuando la actividad no figura en la tabla, y marcar
actividades **exentas**. Cuando salga la ley del año que viene se vuelve a
importar el anexo: los códigos que ya estaban se actualizan, no se duplican.

La tabla vive en `config/alicuotas/<jurisdicción>` dentro de la base, así que
**no hay que tocar las reglas de Firebase** para usarla: la rama `config` ya está
publicada desde el paso 4. Son mil actividades y más de 100 KB, así que **no se
baja con el arranque**: se carga sola la primera vez que se abre la pantalla de
alícuotas, una ficha de cliente o una liquidación.

## Entrar a ARCA, ARBA y AGIP desde el sistema

En la **bóveda de claves**, cada cliente que tenga credenciales guardadas
muestra un botón **🔑 Entrar** por organismo. Descifra usuario y clave en el
momento, los deja listos para copiar de a uno y abre la página de ingreso.

No entra solo, y no es un tema de programación: ARCA, ARBA y AGIP piden segundo
factor o captcha, y la única forma de saltearlos sería mandarle las claves de
todos los clientes a un servicio de terceros.

## Qué falta (próximos pasos)

- **Tasa municipal**: no tiene tabla de alícuotas (cada municipio es distinto), se carga a mano en la ficha.
- **Adjuntar el PDF del VEP** al mail (hoy va como link).
