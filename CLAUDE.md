# Ruta Tapas · Stock — contexto del proyecto

Este archivo resume todo lo decidido en la sesión de Claude.ai donde se construyó
este proyecto, para que Claude Code pueda continuar sin tener que redescubrir nada.

## Qué es

PWA (app web instalable) para que el dueño de un puesto ambulante de tapas
en Alemania controle stock y genere la lista de la compra tras cada evento/ciudad.
Nace de reorganizar un Excel de inventario muy desordenado (ver más abajo).

## Stack y arquitectura

- **Frontend**: HTML/CSS/JS vanilla, sin build step ni framework. Módulos ES
  (`type="module"`) cargados directamente en el navegador.
- **Datos**: Firebase Firestore, plan gratuito Spark.
  - Proyecto Firebase: `ruta-tapa-471c8`
    (console: https://console.firebase.google.com/project/ruta-tapa-471c8/firestore)
  - Config completa (apiKey, etc.) ya está embebida en `app.js` y `admin.js`
    (duplicada a propósito en ambos ficheros para simplicidad).
  - Estructura: colección `rutatapas`, documento `state`, campo `json` con
    **todo** el estado de la app serializado como string JSON (`{stock, historial}`).
  - Reglas de seguridad de Firestore: **abiertas** (`allow read, write: if true`).
    Es una decisión consciente para simplicidad — el usuario fue avisado de que
    esto no es seguro, solo aceptable para una herramienta interna pequeña.
  - Sync: `onSnapshot` en tiempo real + `setInterval` de respaldo cada 15s
    (por si el canal realtime está bloqueado por firewall/adblocker) +
    guard `CLIENT_ID`/`lastWriteFromThisTab` para no auto-sobreescribirse
    con el eco de la propia escritura.
- **Hosting**: Vercel, proyecto `ruta-tapas-stock`, team/cuenta `angelcode`.
  - URL producción: https://ruta-tapas-stock.vercel.app
  - Backoffice: https://ruta-tapas-stock.vercel.app/admin.html
  - **PIN del backoffice: `2026`** (constante `ADMIN_PIN` en `admin.js`).
    Es un filtro básico, NO seguridad real — está documentado así en el código.
- **PWA**: `manifest.json` + `sw.js` (service worker mínimo, solo pasa peticiones,
  necesario para que Chrome/Edge ofrezcan "Instalar").

## Estructura de ficheros

```
index.html      - app principal (4 tabs: evento, compra, stock, historial)
admin.html       - backoffice con PIN
app.js           - lógica app principal + PRODUCTS + Firebase
admin.js         - lógica backoffice + PRODUCTS (duplicado) + Firebase
styles.css       - estilos compartidos
admin.css        - estilos solo del backoffice
manifest.json    - manifest PWA
sw.js            - service worker mínimo
vercel.json      - cache headers (no-cache en todo, para evitar problemas de
                   caché del navegador con versiones antiguas del JS)
icons/
  icon-180.png   - apple-touch-icon (iOS), PNG real, diseño simple (skewer/pincho)
  icon-192.png   - icono manifest (Android/Chrome), mismo diseño
```

## Datos maestros (PRODUCTS)

44 productos con `{id, nombre, precio, stockObjetivo}`, extraídos del Excel
original de la empresa (`Material_tapas_reorganizado.xlsx`, generado en la
misma sesión). Están hardcodeados en `app.js` y `admin.js` — si se añaden/quitan
productos, hay que editar **ambos** ficheros igual.

## Lecciones aprendidas (evitar repetir errores)

- **NUNCA meter más de un archivo binario (base64) grande en una sola llamada
  de despliegue** si se despliega manualmente pegando contenido (p.ej. vía
  `deploy_to_vercel` de Claude.ai) — payloads grandes con varios binarios se
  corrompen de forma intermitente. Con git push esto no aplica (git maneja
  binarios correctamente), así que una vez conectado a GitHub este problema
  desaparece por completo.
- Por eso los iconos actuales son deliberadamente mínimos (~1KB cada uno,
  diseño plano sin gradientes) — no hace falta mantenerlos así una vez que
  el despliegue vaya por git, pero tampoco hay prisa por rehacerlos.
- El favicon usa un SVG inline (`data:image/svg+xml,...con emoji`) en vez de
  un fichero — evita el problema de arriba para el icono de pestaña.

## Pendiente / próximos pasos (por qué existe este CLAUDE.md)

El usuario quiere:
1. Subir este proyecto a un repositorio de GitHub.
2. Conectar ese repo a Vercel (proyecto `ruta-tapas-stock`) para que cada
   push a `main` despliegue automáticamente — sustituyendo el despliegue
   manual usado hasta ahora.

Pasos sugeridos en Claude Code:
```bash
git init
git add .
git commit -m "Initial commit: Ruta Tapas stock app"
gh repo create ruta-tapas-stock --private --source=. --push
# o si no hay gh CLI: crear el repo en github.com y luego
# git remote add origin <url> && git push -u origin main
```
Luego, en el dashboard de Vercel (o con `vercel link` / `vercel git connect`),
conectar el proyecto existente `ruta-tapas-stock` (team `angelcode`) a este
repo para que quede el deploy automático en cada push.

## Excel original (contexto adicional, no forma parte de este repo)

El punto de partida fue un Excel de inventario muy desordenado
(`Material_tapas1.xlsx`) con datos duplicados ~14 veces por ciudad y fórmulas
encadenadas. Se reorganizó en un fichero nuevo con hojas: Productos,
Registro Eventos, Lista de Compra, Nuevo Evento. Ese Excel es un entregable
aparte, no vive en este repositorio de código.
