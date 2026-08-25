# Ruta Tapas · Stock

PWA para gestionar stock y lista de la compra de un puesto ambulante de tapas.

## Stack
- Frontend: HTML/CSS/JS vanilla (sin framework), PWA instalable.
- Datos: Firebase Firestore (plan gratuito Spark), sync en tiempo real + polling de respaldo cada 15s.
- Hosting: Vercel (estático).
- Backoffice: `/admin.html`, protegido con PIN (ver `ADMIN_PIN` en admin.js) — NO es seguridad real, solo un filtro básico.

## Desarrollo local
Sirve la carpeta con cualquier servidor estático, p.ej.:
```
npx serve .
```

## Despliegue
Conectado a Vercel vía Git — cada push a `main` despliega a producción automáticamente.

## Configuración Firebase
El proyecto usa una única colección `rutatapas`, documento `state`, con un campo `json` que contiene todo el estado de la app serializado. Ver `firebaseConfig` en `app.js`/`admin.js`.

## Notas de mantenimiento
- Los productos maestros (`PRODUCTS`) están duplicados en `app.js` y `admin.js` a propósito, para mantener el código simple sin build step.
- Los iconos son PNG mínimos (icons/icon-180.png para iOS, icons/icon-192.png para Android/manifest) — mantenlos pequeños (<2KB) para evitar problemas al desplegar por API.
