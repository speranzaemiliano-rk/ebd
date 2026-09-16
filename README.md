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

## El cliente elegido no se pierde al cambiar de vista

Las cuatro vistas que cuelgan de Clientes hablan del mismo cliente, pero cada
una tenía su forma de elegirlo: un desplegable en Comprobantes, un filtro de
texto en Liquidación, nada en Honorarios. Pasar de una a otra obligaba a volver
a buscarlo — y en un estudio con cien clientes, eso es la mitad del trabajo.

Ahora hay **un cliente elegido para todas**, y se ve en la sub-barra:

> Clientes · Comprobantes · Liquidación · Honorarios &nbsp;&nbsp; 👤 Estudio Jurídico Prueba ✕

- Elegirlo en el desplegable de **Comprobantes** lo deja elegido para las otras.
- **Entrar a un cliente** también lo elige: al salir a Liquidación sigue siendo
  el mismo.
- **Liquidación** abre con la grilla ya filtrada por él, y **Honorarios** con su
  sola fila.
- La **✕** del chip los vuelve a mostrar a todos. Limpiar los filtros de
  Liquidación hace lo mismo — es el mismo gesto.
- Se guarda en el navegador, así que tampoco se pierde al recargar.

Un detalle: el filtro de Liquidación es de texto, así que el cliente elegido
entra por ahí y se ve escrito. Si uno escribe otra cosa encima, soltar el
cliente **no** se lleva puesto lo que escribió.

## Declaración jurada y acuse, con su botón

En **ARCA** y en **ARBA**, los dos papeles que se piden siempre tienen su propio
botón adentro del bloque del impuesto:

> 📎 Subir declaración jurada &nbsp;&nbsp; 📎 Subir acuse de presentación

Abren el selector de archivos con el tipo ya puesto, así no hay que ir a
elegirlo en una lista —que es donde se elige mal—. En ARBA la declaración
jurada que carga es la de **Ingresos Brutos**, que es la suya.

El **acuse de presentación** es un tipo de papel más, disponible también en la
lista de los cuatro impuestos. Es el que prueba que la declaración se presentó,
y es lo primero que piden en una fiscalización.

Un detalle que importa: el número que trae un acuse o una declaración jurada es
el de **transacción**, no el de un VEP, así que **no se copia al casillero del
Nº de VEP**. Si se copiara, la liquidación diría «2/2» con el volante todavía
sin emitir. El importe sí se aprovecha.

Para todo lo demás sigue estando la lista, que arranca en **VEP**: es lo que se
sube sin pensar, y lo que el bloque es.

## El sitio de cada municipio

ARCA, ARBA y AGIP se pagan siempre en la misma web y el sistema ya las sabe.
**La tasa municipal es la excepción**: cada municipio tiene la suya, y era el
único impuesto donde había que acordarse de a dónde entrar.

Ahora el link se carga **una vez por municipio** —el nombre que está en la
ficha del cliente— y lo usan todos los clientes de ese municipio:

- en la **liquidación**, el bloque de la tasa municipal muestra el enlace al
  sitio, listo para abrir;
- en la **bóveda de claves**, «🔑 Entrar» del municipio ya abre la página, igual
  que los otros tres organismos;
- si el cliente todavía no tiene municipio, se cargan el nombre y el link
  juntos **desde la propia liquidación**, sin salir a editar la ficha.

Se administran en **Configuración → Municipios** (agregar, editar, borrar). El
campo *Municipio* de la ficha sugiere los ya cargados, para que escribir
«Avellaneda» de dos formas distintas no termine en dos municipios de los cuales
uno se queda sin link.

Un link pegado sin `https://` se completa solo; uno que no sea `http`/`https`
se rechaza, porque termina adentro de un enlace de verdad.

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
puestos), **enviárselo al cliente** y **borrarlo**.

### Borrar un papel

El 🗑️ está en las dos listas donde aparece un papel: en la **liquidación**, al
lado de cada adjunto del impuesto, y en los **papeles del cliente**, mes por
mes.

La confirmación aparece **en la propia fila**, no en un cuadro aparte. Es a
propósito: en toda la app hay un solo cuadro de diálogo, y abrir uno encima de
la liquidación borraría lo que se está cargando. De paso, la pregunta queda
pegada al papel del que habla, así que no hay forma de confundirse de archivo.
Decir que no lo deja todo como estaba.

Borra las dos cosas juntas —la ficha del papel y su contenido—, para no dejar
archivos huérfanos ocupando lugar. Un VEP guardado dentro de una liquidación se
borra de ahí, que es donde vive, y el contador de VEP del mes se actualiza solo.

### Se abre Gmail, no el programa del equipo

`mailto:` abre el programa de correo de la máquina —Outlook, el Mail de
Windows, o nada— y si el estudio trabaja con Gmail en el navegador, eso es una
puerta a otro lado.

Por defecto el sistema abre **Gmail** en una pestaña, en la casilla del estudio
(`ebdconsultores@gmail.com`). El `authuser` de la URL es lo que evita que, con
varias cuentas de Google abiertas en el navegador, el correo salga de la
personal.

Se cambia en **Configuración → Datos del estudio**: *Cómo se abre el correo*
(Gmail o el programa del equipo) y *Casilla de Gmail del estudio*.

Un detalle que no se ve: la pestaña se **reserva en el mismo clic**, en blanco
y con un cartel de «Preparando el correo…», y recién se la manda a Gmail cuando
los papeles terminaron de bajar. Abrirla después sería un pop-up para el
navegador, y la bloquearía.

### Los adjuntos van adentro del mail

El link de redacción de Gmail **no puede llevar archivos**: acepta
destinatario, asunto y cuerpo, nada más. Por eso durante mucho tiempo esto se
hizo en dos mitades —bajar los papeles y abrir el correo escrito— y los
adjuntos se arrastraban a mano.

Con la **API de Gmail** sí se puede. Configurado eso, «Enviar al cliente» arma
el mail entero —texto y archivos— y lo deja como **borrador** en la casilla del
estudio; después abre ese borrador para revisarlo y mandarlo. No se manda solo
a propósito: un mail al cliente lo mira una persona antes.

**Se configura una vez** en Configuración → *Adjuntar en Gmail*, con el botón
**Cómo se saca** que lleva el paso a paso de la consola de Google Cloud
(proyecto → habilitar la Gmail API → pantalla de consentimiento con la casilla
del estudio como usuario de prueba → ID de cliente OAuth de tipo *Aplicación
web* con este sitio como origen autorizado). Después, **Conectar Gmail** una
vez y listo: el permiso se renueva solo.

El permiso que se pide es **redactar** (`gmail.compose`): el sistema puede
dejar borradores, no leer el correo ni mandar nada por su cuenta.

Si no está configurado —o si Gmail falla— vuelve solo al camino de siempre
(bajar los papeles y abrir el correo escrito), diciendo por qué.

### El mail habla del mes que se liquida

El estudio liquida **a mes vencido**: los papeles que se juntan y se mandan en
septiembre son los de **agosto**. La carpeta del sistema sigue siendo la del
mes en que se cargaron —que es cuando uno los busca— pero el asunto y el cuerpo
del mail nombran el mes anterior:

> *Asunto:* EBD Consultores — agosto de 2026
> *Cuerpo:* Le enviamos la documentación correspondiente al mes de agosto de 2026

Decirle al cliente «documentación de septiembre» cuando se le manda la DDJJ de
agosto es un error que después vuelve como consulta. El botón **Enviar al
cliente** y el aviso de la liquidación dicen de qué mes va a hablar el mail,
para que no sorprenda.

### Sin adjuntos, los papeles bajan en un solo .zip

Mientras Gmail no esté configurado —o si falla— sigue funcionando el camino de
siempre, pero **en una sola descarga**: un `.zip` con todos los papeles del mes,
llamado `Papeles agosto de 2026 - Cliente.zip`. Cae en Descargas y se arrastra
entero al correo.

Antes bajaba de a uno, con una pausa en el medio. Eso era cuatro veces la misma
pregunta del navegador y, con los PDF, más de una vez el navegador los **abría**
en su visor en lugar de bajarlos: quedaban cuatro pestañas y ningún archivo.

El `.zip` se arma en el navegador, sin librería y sin comprimir (método
*stored*): un PDF ya viene comprimido, así que comprimirlo de nuevo no achica
nada y traer una librería por CDN costaría más que las cuarenta líneas que
ocupa. Dos papeles con el mismo nombre no se pisan: al segundo se le agrega
`(2)`. Si por lo que fuera el `.zip` no se pudiera armar, bajan de a uno como
antes — mejor cuatro archivos que ninguno.

### Cómo funciona «Enviar al cliente»

Descarga los papeles del mes y abre tu programa de correo con el destinatario,
el asunto y el texto ya escritos, diciendo qué se está mandando. **Los adjuntos
hay que arrastrarlos a mano**: un `mailto:` no puede llevar archivos, y eso lo
prohíbe el navegador — no es algo que falte programar. Por eso el sistema hace
las dos mitades que sí puede: bajar los papeles y dejar el correo escrito.

## Corregir los comprobantes importados

Un archivo importado llega mal: una fila con el importe cambiado, el mismo mes
cargado dos veces, o todo un período que se fue al cliente equivocado. Hasta
acá esta pantalla sólo miraba, y la única salida era volver a importar encima.

En **Comprobantes → 🔍** (o dentro del cliente, en *Comprobantes → Ver*) cada
fila del detalle tiene ahora **✏️ editar** y **🗑️ borrar**, y abajo un
**Borrar todo el período** para deshacer una importación entera.

- **Editar** convierte la fila en campos, ahí mismo. Se puede cambiar la fecha,
  el tipo, el número, la contraparte, el importe y si es emitido o recibido.
- Pasar un comprobante de **emitido a recibido** lo mueve de una rama a la
  otra: no queda duplicado ni contado dos veces.
- Ponerle una **fecha de otro mes** lo muda a ese mes, y los totales de los dos
  meses se recalculan.
- **Borrar** pregunta en la propia fila; **borrar el período** pregunta en el
  mismo cuadro y avisa cuántos comprobantes se lleva.

Lo que importa y no se ve: después de cada cambio, **los totales del período se
vuelven a sumar desde los comprobantes que quedaron**. Si no se recalcularan,
la recategorización y el cálculo de ingresos brutos seguirían trabajando con el
número viejo — que es el error que no se nota hasta que ya está presentado. Si
no queda ningún comprobante, el período desaparece en vez de quedar en cero.

Todo esto necesita permiso de escritura: un rol *lector* ve el detalle sin
botones.

## Usuarios y roles

En **Configuración → Usuarios del sistema** está quién puede entrar y con qué
rol. Cada fila tiene **su selector de rol**: se cambia ahí, sin tener que
escribir el UID de Firebase a mano (un dato que uno no tiene ni sabe dónde
buscar). El 🗑️ le quita el acceso, preguntando antes en la propia fila.

| Rol | Qué puede |
|---|---|
| **Admin** | Todo, incluida la configuración y repartir roles |
| **Editor** | Carga y edita datos; no toca la configuración |
| **Lector** | Sólo mira |

Tres cosas que evitan quedarse afuera:

- **Nadie se puede sacar el admin a sí mismo** desde la lista: si es el único,
  el sistema se queda sin quien reparta roles.
- Si **no hay ningún admin** guardado, la tarjeta lo avisa arriba.
- **Dos cuentas con el mismo correo** se marcan. Pasa siempre que una se creó
  con contraseña y otra entrando con Google: son UID distintos, y sin el aviso
  se le termina dando el rol a la que no se usa.

### El correo del dueño, con puntos o sin puntos

En Gmail, `speranza.emiliano@gmail.com` y `speranzaemiliano@gmail.com` son **la
misma casilla**: Gmail ignora los puntos y todo lo que vaya después de un `+`.
Comparar los textos tal cual dejó al dueño del sistema con rol **lector**, sin
un solo admin y sin forma de arreglarlo desde adentro.

Ahora los correos se comparan **normalizados** (fuera de Gmail los puntos sí
cuentan), y si el dueño figura en la base con otro rol, el sistema **lo corrige
en la base**, no sólo en pantalla. Antes se ponía admin en memoria pero la base
seguía diciendo lector, así que las reglas de Firebase le rechazaban todo lo
que guardara.

Las reglas (`database.rules.json`) aceptan las dos escrituras del correo. ⚠️ Hay
que **publicarlas a mano** en Firebase → Realtime Database → Reglas: el archivo
del repo no se aplica solo.

### Si te quedaste sin admin

Es la situación en la que nadie puede arreglar nada desde adentro. La salida no
depende del sistema: en **Firebase Console → Realtime Database**, abrí
`estudioContable / usuarios / <tu-uid> / rol` y escribí `admin`. La tarjeta de
Usuarios muestra tu UID exacto para que no haya que adivinarlo.

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
