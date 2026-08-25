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

## Datos maestros (productos)

Desde 2026-08-25 la lista de productos **ya no está hardcodeada**: vive en
Firestore, dentro de `state.products` (mismo documento `rutatapas/state`,
junto a `stock` e `historial`). Se edita desde el backoffice
(`admin.html` → sección "Gestión de productos"): añadir producto nuevo,
cambiar nombre/precio/stock objetivo, o eliminar uno (eliminar no borra su
rastro en el historial — aparece como "(producto eliminado)").

`app.js` y `admin.js` siguen teniendo un array `SEED_PRODUCTS` (44 productos,
extraídos del Excel original `Material_tapas_reorganizado.xlsx`) — ya **no**
es la fuente de verdad, solo la semilla inicial para crear `state.products`
la primera vez, o red de seguridad (`ensureProducts()`) si algún día la nube
tiene un documento sin ese campo. Los IDs de producto nuevos se asignan como
`max(id existente) + 1`.

## Otras funciones añadidas (2026-08-25)

- **Exportar a CSV**: botón "⤓ Exportar a hoja de cálculo (CSV)" en Stock,
  Lista de compra, detalle de un evento del Historial, y en la pestaña
  Resumen (general y por evento). Usa `downloadCSV()` en `app.js` — separador
  `;` y BOM UTF-8 para que Excel en español lo abra bien.
- **Pestaña "Resumen"** (5ª pestaña, `viewResumen()` en `app.js`): ranking de
  productos más gastados, en general (todos los eventos) y filtrable por
  evento concreto, con barras proporcionales.

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

## Estado del despliegue (hecho el 2026-08-25)

Completados los dos pasos que antes estaban pendientes:
1. Repo subido a GitHub: https://github.com/angelareacoordinacion-code/ruta-tapas-stock
   (privado, creado con `gh repo create`).
2. Repo conectado al proyecto Vercel existente `ruta-tapas-stock` (team
   `angelcode`) desde Project Settings → Git → Connect. Fue necesario:
   - Conectar la cuenta de GitHub `angelareacoordinacion-code` como Login
     Connection en Vercel (Account Settings → Login Connections → GitHub →
     pestaña "Managed", no "Your own credentials").
   - Instalar la GitHub App de Vercel (https://github.com/apps/vercel) con
     acceso al repo `ruta-tapas-stock` (Only select repositories).

A partir de ahora el deploy es automático: cada `git push` a `master`
despliega a producción (https://ruta-tapas-stock.vercel.app). Ya no se usa
despliegue manual, así que la limitación de "un solo binario grande por
llamada" (ver Lecciones aprendidas) ya no aplica en la práctica.

git remoto configurado: `origin` → github.com/angelareacoordinacion-code/ruta-tapas-stock.git
git identity local: user.name `angelareacoordinacion-code`, user.email
`320973145+angelareacoordinacion-code@users.noreply.github.com` (noreply de GitHub).

## Excel original (contexto adicional, no forma parte de este repo)

El punto de partida fue un Excel de inventario muy desordenado
(`Material_tapas1.xlsx`) con datos duplicados ~14 veces por ciudad y fórmulas
encadenadas. Se reorganizó en un fichero nuevo con hojas: Productos,
Registro Eventos, Lista de Compra, Nuevo Evento. Ese Excel es un entregable
aparte, no vive en este repositorio de código.
