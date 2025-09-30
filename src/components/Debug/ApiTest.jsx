import React, { useState } from 'react';
import { Bug, Play, CheckCircle, XCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import Button from '../common/Button';

const ApiTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const testEndpoints = [
    { name: 'Unidades', endpoint: '/unidades/', method: 'GET' },
    { name: 'Propietarios', endpoint: '/propietarios/', method: 'GET' },
    { name: 'Mi Perfil', endpoint: '/propietarios/me/', method: 'GET' },
    { name: 'Expensas', endpoint: '/expensas/', method: 'GET' },
    { name: 'Mascotas', endpoint: '/mascotas/', method: 'GET' },
  ];

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    for (const test of testEndpoints) {
      try {
        console.log(`Testing ${test.name}: ${test.endpoint}`);
        const response = await axiosInstance[test.method.toLowerCase()](test.endpoint);
        
        setResults(prev => [...prev, {
          name: test.name,
          endpoint: test.endpoint,
          status: 'success',
          statusCode: response.status,
          data: response.data,
          count: Array.isArray(response.data) ? response.data.length : 
                 response.data?.results ? response.data.results.length :
                 response.data?.count || 'No array'
        }]);
      } catch (error) {
        console.error(`Error testing ${test.name}:`, error);
        setResults(prev => [...prev, {
          name: test.name,
          endpoint: test.endpoint,
          status: 'error',
          statusCode: error.response?.status || 'Network Error',
          error: error.response?.data || error.message,
          message: error.response?.data?.detail || error.message
        }]);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Bug className="w-8 h-8 text-yellow-500" />
            API Test Tool
          </h1>
          <p className="text-white/60">Verificar conexiones y datos de la API</p>
        </div>

        <div className="mb-8 text-center">
          <Button
            onClick={runTests}
            loading={loading}
            icon={Play}
            variant="primary"
          >
            {loading ? 'Ejecutando pruebas...' : 'Ejecutar Pruebas'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  {result.status === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-blue-400" />
                  )}
                  <h3 className="text-xl font-bold text-white">{result.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    result.status === 'success' 
                      ? 'text-green-400 bg-green-500/20'
                      : 'text-blue-400 bg-blue-500/20'
                  }`}>
                    {result.statusCode}
                  </span>
                </div>

                <div className="text-sm text-white/60 mb-3">
                  <code className="bg-white/10 px-2 py-1 rounded">{result.endpoint}</code>
                </div>

                {result.status === 'success' ? (
                  <div className="space-y-3">
                    <div className="text-white/70">
                      <strong>Elementos encontrados:</strong> {result.count}
                    </div>
                    <details className="bg-white/5 rounded-lg p-4">
                      <summary className="cursor-pointer text-white/80 font-medium">
                        Ver datos raw (JSON)
                      </summary>
                      <pre className="mt-3 text-xs text-white/60 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-blue-300">
                      <strong>Error:</strong> {result.message}
                    </div>
                    <details className="bg-blue-500/10 rounded-lg p-4">
                      <summary className="cursor-pointer text-blue-300 font-medium">
                        Ver error completo
                      </summary>
                      <pre className="mt-3 text-xs text-blue-200 overflow-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTest;