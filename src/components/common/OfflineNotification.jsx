import { useState, useEffect } from 'react';
import { setupNetworkListeners } from '../../serviceWorkerRegistration';

const OfflineNotification = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Inicializar listeners de blue
    setupNetworkListeners(handleOnline, handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-indicator">
      Sin conexión - Modo offline
    </div>
  );
};

export default OfflineNotification;