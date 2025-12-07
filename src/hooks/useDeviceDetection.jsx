import { useEffect, useState } from 'react';
import { isMobile } from '../serviceWorkerRegistration';

/**
 * Hook personalizado para manejar la detección de características del dispositivo
 * y proporcionar información útil para adaptar la UI
 */
const useDeviceDetection = () => {
  // Estado para dispositivo móvil
  const [isDeviceMobile, setIsDeviceMobile] = useState(isMobile());
  
  // Estado para detectar orientación
  const [isLandscape, setIsLandscape] = useState(
    window.matchMedia('(orientation: landscape)').matches
  );
  
  // Estado para detectar si se abrió el teclado virtual (aproximación)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  // Estado para pantalla pequeña
  const [isSmallScreen, setIsSmallScreen] = useState(
    window.innerWidth < 640
  );
  
  // Estado para detectar si está en modo standalone (PWA instalada)
  const [isStandalone, setIsStandalone] = useState(
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://')
  );

  useEffect(() => {
    // Manejador para cambio de orientación
    const handleOrientationChange = () => {
      setIsLandscape(window.matchMedia('(orientation: landscape)').matches);
    };
    
    // Manejador para cambio de tamaño de ventana
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
      
      // Detección aproximada de teclado virtual en móviles
      // (cuando la altura visible disminuye significativamente)
      if (isMobile()) {
        const windowHeight = window.innerHeight;
        const screenHeight = window.screen.height;
        setIsKeyboardOpen(screenHeight > windowHeight + 150);
      }
    };
    
    // Manejador para detectar cambio en modo standalone
    const handleDisplayModeChange = (e) => {
      setIsStandalone(e.matches || 
        window.navigator.standalone || 
        document.referrer.includes('android-app://'));
    };
    
    // Agregar listeners
    window.addEventListener('resize', handleResize);
    window.matchMedia('(orientation: landscape)').addEventListener('change', handleOrientationChange);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.matchMedia('(orientation: landscape)').removeEventListener('change', handleOrientationChange);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange);
    };
  }, []);
  
  return {
    isMobile: isDeviceMobile,
    isLandscape,
    isKeyboardOpen,
    isSmallScreen,
    isStandalone
  };
};

export default useDeviceDetection;