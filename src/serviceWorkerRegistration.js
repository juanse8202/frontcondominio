// Registro de Service Worker para PWA con soporte offline y cache básico.
// Si quieres desactivar SW en algún entorno, define VITE_DISABLE_SW=true
export function register() {
  if (import.meta.env?.VITE_DISABLE_SW === 'true') {
    console.info('[SW] Deshabilitado por variable VITE_DISABLE_SW');
    return;
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';
      navigator.serviceWorker.register(swUrl)
        .then(reg => {
          console.log('[SW] Registrado', reg.scope);
          // Actualizaciones
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (installing) {
              installing.addEventListener('statechange', () => {
                if (installing.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[SW] Nueva versión lista (actualizar para aplicar)');
                  } else {
                    console.log('[SW] Contenido cacheado para uso offline');
                  }
                }
              });
            }
          });
        })
        .catch(err => console.error('[SW] Error registrando', err));
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  }
}

// Función para verificar si la aplicación se está ejecutando en modo standalone (instalada)
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || 
         document.referrer.includes('android-app://');
}

// Función para verificar si el dispositivo es móvil
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detectar eventos de online/offline
export function setupNetworkListeners(onlineCallback, offlineCallback) {
  window.addEventListener('online', () => {
    if (onlineCallback) onlineCallback();
  });
  
  window.addEventListener('offline', () => {
    if (offlineCallback) offlineCallback();
  });
  
  // Retorna el estado inicial
  return navigator.onLine;
}