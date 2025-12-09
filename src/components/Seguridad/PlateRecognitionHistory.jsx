import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';

const PlateRecognitionHistory = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        axiosInstance.get('/seguridad/plate-recognition-logs/'),
        axiosInstance.get('/seguridad/plate-recognition-logs/stats/')
      ]);
      
      setLogs(logsResponse.data.results || logsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || 
      (filter === 'registered' && log.is_registered) ||
      (filter === 'unregistered' && !log.is_registered) ||
      (filter === 'allowed' && log.acceso_permitido) ||
      (filter === 'denied' && !log.acceso_permitido);

    const matchesSearch = searchTerm === '' || 
      log.plate_number.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Total Reconocimientos</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_reconocimientos}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Vehículos Registrados</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.vehiculos_registrados}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Accesos Permitidos</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.accesos_permitidos}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Accesos Denegados</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.accesos_denegados}</p>
          </div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('registered')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'registered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Registrados
            </button>
            <button
              onClick={() => setFilter('allowed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'allowed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Permitidos
            </button>
            <button
              onClick={() => setFilter('denied')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'denied'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Denegados
            </button>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Historial de Reconocimientos ({filteredLogs.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredLogs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No se encontraron registros
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-gray-900">{log.plate_number}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        log.acceso_permitido
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.acceso_permitido ? '✓ Permitido' : '✗ Denegado'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        log.confidence === 'high'
                          ? 'bg-green-100 text-green-800'
                          : log.confidence === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.confidence_score ? `${log.confidence_score}%` : log.confidence}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Tipo:</span>
                        <span className="ml-2 font-medium capitalize">{log.tipo_acceso}</span>
                      </div>
                      {log.vehicle_type && (
                        <div>
                          <span className="text-gray-500">Vehículo:</span>
                          <span className="ml-2 font-medium">{log.vehicle_type}</span>
                        </div>
                      )}
                      {log.vehiculo_info && (
                        <>
                          <div>
                            <span className="text-gray-500">Marca:</span>
                            <span className="ml-2 font-medium">{log.vehiculo_info.marca}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Propietario:</span>
                            <span className="ml-2 font-medium">{log.vehiculo_info.propietario}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(log.fecha_reconocimiento).toLocaleString('es-ES')}
                    </div>
                  </div>
                  
                  {log.image && (
                    <div className="ml-4">
                      <img
                        src={log.image}
                        alt={`Placa ${log.plate_number}`}
                        className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlateRecognitionHistory;
