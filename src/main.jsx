import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { register } from './serviceWorkerRegistration';

// Registrar el service worker para PWA
register();

// Listener de mensajes desde el Service Worker (ej: abrir comunicado específico)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'OPEN_COMUNICADO') {
      // Guardar en sessionStorage para que la página de comunicados lo procese (navegación diferida)
      if (event.data.id) {
        sessionStorage.setItem('openComunicadoId', String(event.data.id));
      }
      // Navegar a /comunicados
      if (window.location.pathname !== '/comunicados') {
        window.location.href = '/comunicados';
      }
    }
  });
}

// Detectar si es un dispositivo móvil para ajustes específicos
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
  // Añadir clase al body para estilos específicos de móviles
  document.body.classList.add('mobile-device');
  
  // Prevenir comportamientos indeseados en dispositivos táctiles
  document.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('prevent-scroll')) {
      e.preventDefault();
    }
  }, { passive: false });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
