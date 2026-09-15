/* ==========================================================================
   Service worker — EBD Consultores

   Qué hace: permite instalar el sistema como app y que abra rápido.

   Cómo trata cada cosa:
   - index.html  -> primero red, y si no hay conexión usa la copia guardada.
                    Así, cuando subimos una versión nueva, la ves enseguida.
   - íconos      -> primero la copia guardada (nunca cambian).
   - Firebase, Google, EmailJS -> ni los toca. Van derecho a internet,
                    porque son datos vivos y sesiones que no se pueden cachear.

   IMPORTANTE: cada vez que se cambie index.html hay que subir el número de
   VERSION de acá abajo. Si no, algunos navegadores siguen mostrando la vieja.
   Lo mismo vale si se corrige el archivo de alícuotas sin cambiarle el nombre:
   queda guardado igual que los íconos y sin VERSION nueva no se vuelve a bajar.
   ========================================================================== */

var VERSION = "v41";
var CACHE   = "ebd-" + VERSION;

/* Archivos propios que se guardan para que la app abra sin conexión. */
var SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./alicuotas-arba-2026.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./mess-logo.svg"
];

/* Dominios que NUNCA se cachean: sesiones, base de datos y envío de mails. */
var PASAR_DE_LARGO = [
  "firebaseio.com",
  "firebasedatabase.app",
  "googleapis.com",
  "gstatic.com",
  "firebaseapp.com",
  "identitytoolkit",
  "emailjs.com",
  "jsdelivr.net"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* addAll falla entero si un archivo falla; los agregamos de a uno. */
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () { /* si uno falla, seguimos */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);

  /* Nada de otros dominios sensibles pasa por acá. */
  for (var i = 0; i < PASAR_DE_LARGO.length; i++) {
    if (url.hostname.indexOf(PASAR_DE_LARGO[i]) !== -1) return;
  }
  if (url.origin !== self.location.origin) return;

  var esDocumento = req.mode === "navigate" ||
                    url.pathname.endsWith("/") ||
                    url.pathname.endsWith("index.html");

  if (esDocumento) {
    /* Primero red: así una versión nueva se ve al toque. */
    e.respondWith(
      fetch(req).then(function (resp) {
        var copia = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
        return resp;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match("./index.html");
        });
      })
    );
    return;
  }

  /* El resto (íconos, manifest): primero lo guardado. */
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === "basic") {
          var copia = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
        }
        return resp;
      });
    })
  );
});

/* Permite que la página fuerce la actualización sin esperar. */
self.addEventListener("message", function (e) {
  if (e.data === "actualizar-ya") self.skipWaiting();
});
