# EBD Consultores — Monotributo e IIBB

Sistema de gestión para liquidar monotributo (ARCA), ingresos brutos de Provincia
(ARBA) y de Capital (AGIP), y tasas municipales, con control automático de la
recategorización semestral.

**En línea:** <https://speranzaemiliano-rk.github.io/ebd/>

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

> Cada vez que se modifique `index.html` o `naiib.js`, hay que subir el número
> de `VERSION` en `sw.js`. Si no, algunos navegadores siguen mostrando la
> versión vieja.

## Cómo está armado

- **`index.html`** — todo el sistema en un solo archivo: HTML, CSS y JavaScript.
  No usa frameworks ni build. Se edita y se sube tal cual.
- **`naiib.js`** — el nomenclador de actividades de ARBA: 1019 códigos con su
  nombre oficial. Es sólo datos, no tiene lógica. Está aparte de `index.html`
  porque son 70 KB que no cambian nunca.
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

Las **alícuotas de ingresos brutos** sí hay que cargarlas una vez: bajá el anexo
o el nomenclador del organismo y usá **Alícuotas IIBB → Cargar la tabla** (ver
más abajo). Sin eso, los importes de ARBA y AGIP siguen yendo a mano, como hasta
ahora.

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

Por eso la tabla **no viene cargada de fábrica**: los porcentajes tienen que salir
del anexo oficial, no de una estimación. Se carga una sola vez, en la pantalla
**Alícuotas IIBB**, y de ahí en más cada cliente saca la suya por su código de
actividad, sin escribirla ficha por ficha.

**Cargar la tabla** acepta tres formatos:

- el **Excel o CSV** del nomenclador (reconoce las columnas por el encabezado,
  aunque haya renglones de título arriba);
- el **texto pegado** del anexo (un renglón por actividad: código, nombre y
  porcentaje);
- un **PDF**, del que primero intenta leer el texto solo y, si no alcanza, lo
  lee con IA.

Salga de donde salga, antes de guardar se muestra todo en una **tabla editable**:
lo que corrijas ahí es lo que se guarda. El sistema no inventa ningún porcentaje.

Con la tabla cargada:

- en la **ficha del cliente**, debajo de cada alícuota aparece lo que dice la
  tabla para el código de actividad, con un link para copiarla;
- en la **liquidación mensual**, el importe se calcula solo y abajo del cálculo
  dice de dónde salió el porcentaje (ficha, tabla o alícuota general);
- lo que esté escrito en la ficha **siempre gana**: la tabla es el valor por
  defecto, no una imposición.

El **nombre** de cada actividad no hace falta cargarlo: viene con el sistema, en
`naiib.js`. Así que si el anexo trae sólo el código y el porcentaje —que es lo
más común— la tabla igual queda legible. Tocando un código se abre el renglón
en el sitio de ARBA, con el detalle de qué incluye y qué excluye.

Además se puede cargar la **alícuota general** (la subsidiaria) de cada
jurisdicción, que se usa cuando la actividad no figura en la tabla, y marcar
actividades **exentas**. Cuando salga la ley del año que viene se vuelve a
importar el anexo: los códigos que ya estaban se actualizan, no se duplican.

La tabla vive en `config/alicuotas/<jurisdicción>` dentro de la base, así que
**no hay que tocar las reglas de Firebase** para usarla: la rama `config` ya está
publicada desde el paso 4.

## Intimaciones, con aviso antes de que se venzan

Lo que llega de ARCA, ARBA, AGIP o el municipio y tiene fecha para contestar
tiene su propia pantalla: **Intimaciones**. Lo que las separa de cualquier otro
papel es el plazo, porque una intimación que se vence sin contestar no es un
papel traspapelado, es una multa.

De cada una se carga el cliente, el organismo, el asunto, el número de
expediente, el monto reclamado si lo hay, cuándo la notificaron, **cuándo vence**
y el PDF. Con eso:

- el listado ordena por urgencia, con lo vencido arriba de todo, y dice en
  castellano cuánto falta ("vencida hace 3 días", "vence mañana");
- arriba hay un resumen y al lado del nombre de la pestaña queda un número
  —rojo si hay vencidas, amarillo si hay pendientes—, así se ve sin entrar;
- en **Inicio**, la tarjeta de *Próximos vencimientos* dejó de ser una lista fija
  y muestra lo que hay cargado de verdad: las intimaciones sin resolver y los
  VEP con fecha de vencimiento, ordenados y con semáforo;
- un botón **✓** en la fila la marca como respondida, que es el gesto más
  frecuente y no merece abrir un formulario.

El estado guardado es sólo *pendiente*, *respondida* o *archivada*. **Vencida no
se guarda**: se calcula contra el día de hoy, cada vez que se dibuja la pantalla.
Un estado que depende del calendario y queda escrito se vuelve mentira solo.

Las intimaciones se guardan junto con el resto de los papeles, así que también
aparecen en **Archivos**, y **no hay que tocar las reglas de Firebase** para
empezar a usarlas.

## El código de actividad, sin buscarlo a mano

El código de actividad (NAIIB en ARBA, el mismo NAES en AGIP) es la llave de
todo lo de ingresos brutos: de él sale la alícuota. El problema es que son seis
dígitos que nadie se acuerda, y escribirlo mal no da error en ninguna pantalla:
da la alícuota equivocada.

Por eso el sistema trae el **nomenclador completo de ARBA**. En la ficha del
cliente:

- escribís el **código** y abajo aparece el nombre oficial de la actividad, con
  un link para copiarlo al campo de al lado y otro para ver en el sitio de ARBA
  qué incluye y qué excluye ese código;
- o al revés: escribís la **actividad** ("alquiler de maquinaria", "arquitectura")
  y aparecen los códigos que coinciden, para elegir uno de un clic;
- si el código no figura en el nomenclador, avisa. No lo rechaza: puede ser uno
  de los que usa sólo AGIP.

El nomenclador **no trae alícuotas** y no reemplaza al anexo: los porcentajes
los sigue fijando la Ley Impositiva de cada año y se cargan en **Alícuotas IIBB**.

Cuando ARBA publique una versión nueva del nomenclador, se rearma `naiib.js`
desde <https://www.arba.gov.ar/archivos/Publicaciones/naiib.html> y se sube el
`VERSION` de `sw.js`.

## Los formularios no se cierran solos

Un clic afuera de una ventana **no la cierra**: la sacude y la deja donde está.
Antes cerraba, y era una fuente permanente de sustos por tres motivos que no se
ven mirando la pantalla: el fondo no es sólo el borde (tiene margen arriba,
abajo y a los costados, y además scrollea); el navegador cuenta como "clic
afuera" el hecho de apretar adentro y soltar afuera, o sea seleccionar el texto
de un campo arrastrando un poco de más; y si todavía no habías tocado nada,
cerraba sin preguntar.

Para cerrar están la **✕**, el botón **Cancelar** y la tecla **Escape**. Los tres
preguntan si hay algo cargado sin guardar.

Y abrir la **bóveda** desde la ficha de un cliente ya no borra lo que estabas
cargando. La ficha se tiene que sacar de la pantalla —hay una sola ventana a la
vez— pero lo tipeado vuelve a su lugar cuando la ficha se reabre, tanto si
abrís la bóveda como si cancelás.

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
