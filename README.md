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

---

## Traer los comprobantes de ARCA sin importar archivos

El backend que consulta los web services de ARCA está escrito y probado en la
carpeta **`functions/`** — ver `functions/README.md`, que tiene el paso a paso
completo. Trae los comprobantes **emitidos** y la **constancia de inscripción**.

Para que empiece a funcionar faltan tres cosas, y ninguna es código:

1. Sacar el certificado digital del estudio en ARCA (clave fiscal nivel 3).
2. Que cada cliente delegue el servicio al estudio desde su clave fiscal.
3. Desplegar la carpeta `functions/` en Railway con el certificado cargado.

Los comprobantes **recibidos** no tienen web service en ARCA: esos se siguen
importando desde el archivo de Mis Comprobantes.

## Qué falta (próximos pasos)

- **Botón "Traer de ARCA"** en la pantalla de Comprobantes, que llame al backend.
  Se conecta cuando el certificado y las delegaciones estén listas.
- **Cálculo de IIBB**: hoy los importes de ARBA, AGIP y municipio se cargan a mano.
- **Adjuntar el PDF del VEP** al mail (hoy va como link).
