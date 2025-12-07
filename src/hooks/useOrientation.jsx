import { useEffect, useState } from 'react';

/**
 * Hook para manejar la orientación del dispositivo
 * Útil para adaptar la UI según la orientación
 */
const useOrientation = () => {
  // Estado inicial basado en la orientación actual
  const [orientation, setOrientation] = useState({
    type: window.screen.orientation ? window.screen.orientation.type : 
          window.matchMedia('(orientation: portrait)').matches ? 'portrait-primary' : 'landscape-primary',
    angle: window.screen.orientation ? window.screen.orientation.angle : 0,
    isPortrait: window.matchMedia('(orientation: portrait)').matches,
    isLandscape: window.matchMedia('(orientation: landscape)').matches
  });

  useEffect(() => {
    // Función para actualizar la orientación
    const updateOrientation = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      
      // Intentar obtener datos más detallados si la API está disponible
      if (window.screen.orientation) {
        setOrientation({
          type: window.screen.orientation.type,
          angle: window.screen.orientation.angle,
          isPortrait,
          isLandscape
        });
      } else {
        // Fallback para navegadores sin la API completa
        setOrientation({
          type: isPortrait ? 'portrait-primary' : 'landscape-primary',
          angle: isPortrait ? 0 : 90,
          isPortrait,
          isLandscape
        });
      }
    };

    // Registrar listeners para detectar cambios de orientación
    if (window.screen.orientation) {
      // Método moderno
      window.screen.orientation.addEventListener('change', updateOrientation);
    } else {
      // Método de fallback
      window.addEventListener('orientationchange', updateOrientation);
    }
    
    // Registrar también listener para cambios de media query como respaldo
    window.matchMedia('(orientation: portrait)').addEventListener('change', updateOrientation);
    
    // Cleanup
    return () => {
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation);
      } else {
        window.removeEventListener('orientationchange', updateOrientation);
      }
      window.matchMedia('(orientation: portrait)').removeEventListener('change', updateOrientation);
    };
  }, []);

  return orientation;
};

export default useOrientation;