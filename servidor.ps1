# ============================================================
#  Servidor local para probar el sistema antes de subirlo.
#
#  Para qué sirve: si abrís index.html con doble clic, el navegador
#  usa una URL "file://" y bloquea el almacenamiento local, que es
#  lo que Firebase necesita para mantener la sesión iniciada.
#  Este script sirve la carpeta por HTTP en localhost, que Firebase
#  acepta sin configurar nada.
#
#  Cómo usarlo: clic derecho sobre este archivo -> "Ejecutar con PowerShell".
#  Para cortarlo: Ctrl+C en la ventana negra, o cerrala.
# ============================================================

$puerto = 8080
$raiz   = $PSScriptRoot
if ([string]::IsNullOrEmpty($raiz)) { $raiz = (Get-Location).Path }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$puerto/")

try {
    $listener.Start()
} catch {
    Write-Host ""
    Write-Host "No se pudo abrir el puerto $puerto." -ForegroundColor Red
    Write-Host "Puede que ya haya algo usandolo. Proba cambiando la variable"
    Write-Host "`$puerto arriba en este archivo (por ejemplo 8081) y volve a correrlo."
    Write-Host ""
    Read-Host "Enter para cerrar"
    exit 1
}

Write-Host ""
Write-Host "  Sistema EBD Consultores" -ForegroundColor Cyan
Write-Host "  Servidor local levantado en:  http://localhost:$puerto/" -ForegroundColor Green
Write-Host "  Carpeta servida: $raiz"
Write-Host ""
Write-Host "  Dejar esta ventana abierta mientras usas el sistema." -ForegroundColor Yellow
Write-Host "  Para cortar: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

Start-Process "http://localhost:$puerto/"

$tipos = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".csv"  = "text/csv; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    try {
        $ctx  = $listener.GetContext()
        $ruta = [System.Uri]::UnescapeDataString($ctx.Request.Url.LocalPath).TrimStart('/')
        if ([string]::IsNullOrEmpty($ruta)) { $ruta = "index.html" }

        $archivo = Join-Path $raiz $ruta

        # No servir nada fuera de la carpeta del proyecto
        $completo = [System.IO.Path]::GetFullPath($archivo)
        if (-not $completo.StartsWith([System.IO.Path]::GetFullPath($raiz))) {
            $ctx.Response.StatusCode = 403
            $ctx.Response.Close()
            continue
        }

        if (Test-Path $archivo -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($archivo)
            $ext   = [System.IO.Path]::GetExtension($archivo).ToLower()
            $ctx.Response.ContentType = $(if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { "application/octet-stream" })
            $ctx.Response.Headers.Add("Cache-Control", "no-store")
            $ctx.Response.ContentLength64 = $bytes.Length
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host ("  200  /" + $ruta) -ForegroundColor DarkGray
        } else {
            $ctx.Response.StatusCode = 404
            Write-Host ("  404  /" + $ruta) -ForegroundColor DarkYellow
        }
        $ctx.Response.Close()
    } catch {
        # Una peticion cortada por el navegador no tiene que tumbar el servidor
    }
}
