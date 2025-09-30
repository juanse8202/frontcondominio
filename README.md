# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Backend API Base URL (Deploy en Vercel + Backend en EC2)

Para apuntar el frontend desplegado en Vercel a tu backend (por ejemplo en EC2 con IP pública `3.23.127.131`) define en Vercel (Project Settings > Environment Variables):

```
KEY: VITE_API_BASE_URL
VALUE: https://3.23.127.131
TARGET: Production (y/o Preview si aplica)
```

Luego vuelve a desplegar. El código usa `VITE_API_BASE_URL` y automáticamente construye las peticiones a `<BASE>/api/...`.

Si más adelante tienes un dominio (ej: api.condominio.com) simplemente cambia el valor y redeploy.

Variable anterior `VITE_API_URL` queda deprecada.

## PWA (Progressive Web App)

Se añadió un Service Worker sencillo (`public/sw.js`) que:

- Hace precache de `index.html`, manifest e iconos principales.
- Usa estrategia network-first para llamadas a `/api/` con fallback a cache si estás offline.
- Usa cache-first para assets estáticos (JS/CSS/imagenes) acelerando cargas repetidas.
- Proporciona fallback básico para navegación SPA cuando no hay red.

Para invalidar caches al hacer cambios importantes incrementa `CACHE_VERSION` dentro de `sw.js`.

Si necesitas desactivar el Service Worker en algún entorno agrega la variable `VITE_DISABLE_SW=true`.

### Pasos de build

1. Instala dependencias: `npm install`
2. Ejecuta build: `npm run build`
3. Despliega la carpeta `dist/` (Vercel ya lo hace automáticamente con el comando build configurado).

Tras el primer load en producción, revisa la pestaña Application > Service Workers en DevTools para confirmar el registro.

