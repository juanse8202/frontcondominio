import { useState, useEffect } from 'react';

/**
 * Hook para obtener datos de referencia de vehículos (marcas, modelos, tipos, colores)
 */
const useVehiculosData = () => {
  const [vehiculosData, setVehiculosData] = useState({
    marcas: [],
    tipos: [],
    colores: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/vehiculos-data.json');
        const data = await response.json();
        setVehiculosData(data);
      } catch (error) {
        console.error('Error loading vehiculos data:', error);
        // Datos por defecto si falla la carga
        setVehiculosData({
          marcas: [],
          tipos: [
            { value: 'sedan', label: 'Sedán' },
            { value: 'suv', label: 'SUV' },
            { value: 'pickup', label: 'Pickup' },
            { value: 'hatchback', label: 'Hatchback' },
            { value: 'camioneta', label: 'Camioneta' }
          ],
          colores: ['Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul']
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /**
   * Obtiene los modelos de una marca específica
   */
  const getModelosPorMarca = (marcaNombre) => {
    const marca = vehiculosData.marcas.find(m => m.nombre === marcaNombre);
    return marca ? marca.modelos : [];
  };

  return {
    marcas: vehiculosData.marcas,
    tipos: vehiculosData.tipos,
    colores: vehiculosData.colores,
    getModelosPorMarca,
    loading
  };
};

export default useVehiculosData;
