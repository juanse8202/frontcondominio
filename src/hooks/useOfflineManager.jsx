import { useState, useEffect } from 'react';

/**
 * Hook para manejar el estado online/offline de la aplicación
 * y proporcionar funciones útiles para operaciones offline
 */
const useOfflineManager = () => {
  // Estado de conexión
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Estado para almacenar operaciones pendientes
  const [pendingOperations, setPendingOperations] = useState([]);

  useEffect(() => {
    // Manejadores para eventos de conexión
    const handleOnline = () => {
      setIsOnline(true);
      // Intentar sincronizar operaciones pendientes al recuperar conexión
      syncPendingOperations();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    // Registrar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Intentar cargar operaciones pendientes desde localStorage
    const loadPendingOperations = () => {
      try {
        const storedOperations = localStorage.getItem('pendingOperations');
        if (storedOperations) {
          setPendingOperations(JSON.parse(storedOperations));
        }
      } catch (error) {
        console.error('Error cargando operaciones pendientes:', error);
      }
    };
    
    loadPendingOperations();
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guardar operaciones pendientes en localStorage
  useEffect(() => {
    if (pendingOperations.length > 0) {
      localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
    } else {
      localStorage.removeItem('pendingOperations');
    }
  }, [pendingOperations]);

  // Función para sincronizar operaciones pendientes
  const syncPendingOperations = async () => {
    if (!isOnline || pendingOperations.length === 0) return;
    
    // Hacer una copia para no modificar el estado durante la iteración
    const operations = [...pendingOperations];
    const successfulOps = [];
    
    for (const op of operations) {
      try {
        // Realizar la operación de sincronización
        switch (op.type) {
          case 'create':
            // Lógica para sincronizar una creación
            await fetch(op.url, {
              method: 'POST',
              headers: op.headers || { 'Content-Type': 'application/json' },
              body: JSON.stringify(op.data)
            });
            break;
          case 'update':
            // Lógica para sincronizar una actualización
            await fetch(op.url, {
              method: 'PUT',
              headers: op.headers || { 'Content-Type': 'application/json' },
              body: JSON.stringify(op.data)
            });
            break;
          case 'delete':
            // Lógica para sincronizar una eliminación
            await fetch(op.url, { method: 'DELETE' });
            break;
          default:
            console.warn(`Tipo de operación desconocido: ${op.type}`);
            continue;
        }
        
        // Si llegamos aquí, la operación fue exitosa
        successfulOps.push(op.id);
      } catch (error) {
        console.error(`Error sincronizando operación ${op.id}:`, error);
      }
    }
    
    // Eliminar las operaciones exitosas del estado
    if (successfulOps.length > 0) {
      setPendingOperations(prev => 
        prev.filter(op => !successfulOps.includes(op.id))
      );
    }
  };

  // Función para agregar una operación pendiente
  const addPendingOperation = (operation) => {
    // Agregar un ID único y timestamp a la operación
    const newOperation = {
      ...operation,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    setPendingOperations(prev => [...prev, newOperation]);
    
    // Si estamos online, intentar sincronizar inmediatamente
    if (isOnline) {
      syncPendingOperations();
    }
    
    return newOperation.id; // Retornar el ID para seguimiento
  };

  // Función para simular operaciones offline y guardarlas para sincronización posterior
  const performOfflineOperation = (type, url, data, headers) => {
    // Simular la operación localmente (podría actualizar el estado local)
    
    // Guardar para sincronización posterior
    return addPendingOperation({ type, url, data, headers });
  };

  return {
    isOnline,
    pendingOperations,
    syncPendingOperations,
    addPendingOperation,
    performOfflineOperation
  };
};

export default useOfflineManager;