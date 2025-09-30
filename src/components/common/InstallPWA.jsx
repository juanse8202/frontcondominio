import { useState, useEffect } from 'react';
import { isInstalled } from '../../serviceWorkerRegistration';

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(isInstalled());

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir que Chrome muestre automáticamente la solicitud
      e.preventDefault();
      // Guardar el evento para usarlo después
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      // Limpiar el prompt guardado
      setInstallPrompt(null);
      // Actualizar el estado de instalación
      setIsAppInstalled(true);
    };

    // Comprobar si la app ya está instalada
    setIsAppInstalled(isInstalled());

    // Agregar event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Mostrar el prompt de instalación
    installPrompt.prompt();
    
    // Esperar por la selección del usuario
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Limpiar el prompt guardado - solo se puede usar una vez
    setInstallPrompt(null);
  };

  // No mostrar el botón si la app ya está instalada o no hay prompt disponible
  if (isAppInstalled || !installPrompt) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="btn-secondary text-sm flex items-center gap-2 px-3 py-2"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
      </svg>
      Instalar App
    </button>
  );
};

export default InstallPWA;