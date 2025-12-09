import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';

const PlateRecognition = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [_isCameraOpen, _setIsCameraOpen] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Wrapper con logging para debuguear
  const setIsCameraOpen = (value) => {
    console.log(`📹 setIsCameraOpen(${value}) llamado desde:`);
    console.trace();
    _setIsCameraOpen(value);
  };
  
  const isCameraOpen = _isCameraOpen;

  // Listar cámaras solo al montar (sin cleanup que interfiera)
  useEffect(() => {
    listCameras();
  }, []);

  const listCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      
      // Seleccionar la primera cámara por defecto
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
    } catch (err) {
      console.error('Error al listar cámaras:', err);
    }
  };

  const stopCamera = () => {
    try {
      console.log('🛑 stopCamera() llamado');
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOpen(false);
      // NO borrar selectedImage aquí - se necesita para el reconocimiento
      console.log('✓ Cámara detenida (imagen preservada)');
    } catch (err) {
      console.error('Error al detener cámara:', err);
    }
  };

  const startCamera = async () => {
    try {
      console.log('🎬 Iniciando cámara...');
      
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Tu navegador no soporta acceso a la cámara.');
        return;
      }

      setError(null);
      setLoading(true);

      // Solicitar stream de video (lo más simple posible)
      console.log('📹 Solicitando acceso a la cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true 
      });
      
      console.log('✅ Stream obtenido:', stream);
      
      if (!stream) {
        throw new Error('No se obtuvo el stream');
      }
      
      // Guardar referencia al stream
      streamRef.current = stream;
      
      // Asignar stream al video element
      if (videoRef.current) {
        console.log('🎥 Asignando stream al video element...');
        videoRef.current.srcObject = stream;
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          console.log('📊 Metadata cargada');
          console.log('Dimensiones:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          
          // Reproducir el video
          videoRef.current.play()
            .then(() => {
              console.log('▶️ Video reproduciendo');
              setLoading(false);
              setIsCameraOpen(true);
              console.log('✅ CÁMARA ABIERTA Y VISIBLE');
            })
            .catch(err => {
              console.error('❌ Error al reproducir:', err);
              setLoading(false);
              setError('No se pudo reproducir el video de la cámara');
            });
        };
      } else {
        console.error('❌ videoRef.current es null');
        setError('Error interno: elemento de video no encontrado');
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      console.error('Error fatal al acceder a la cámara:', err);
      
      let errorMessage = 'No se pudo acceder a la cámara. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Haz clic en el ícono 🎥 en la barra de direcciones y selecciona "Permitir".';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No se detectó ninguna cámara. Verifica la conexión USB de tu Redragon.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Otra aplicación está usando la cámara. Cierra: Cámara de Windows, Teams, Zoom, Discord, OBS.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'La cámara no soporta esta configuración. Prueba con otra cámara del selector.';
      } else if (err.message === 'Timeout') {
        errorMessage += 'La cámara tardó mucho en responder. Desconéctala, espera 3 segundos y reconéctala.';
      } else {
        errorMessage += 'Error desconocido. Usa "Subir Imagen" como alternativa.';
      }
      
      setError(errorMessage);
    }
  };

  const capturePhoto = () => {
    console.log('📸 Capturando foto...');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Configurar el canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log('📐 Canvas configurado:', canvas.width, 'x', canvas.height);

      // Dibujar el frame actual del video en el canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log('🖼️ Frame capturado en canvas');

      // Convertir el canvas a blob
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ Blob creado, tamaño:', blob.size, 'bytes');
          const file = new File([blob], 'captured-plate.jpg', { type: 'image/jpeg' });
          console.log('📄 File creado:', file.name, file.size, 'bytes');
          handleImageSelect(file);
          console.log('🎬 Cerrando cámara...');
          stopCamera();
        } else {
          console.error('❌ Error: blob es null');
          setError('Error al capturar la imagen');
        }
      }, 'image/jpeg', 0.95);
    } else {
      console.error('❌ videoRef o canvasRef no disponible');
      setError('Error: elementos no disponibles para captura');
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleImageSelect = (file) => {
    console.log('🖼️ handleImageSelect llamado con:', file);
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 5MB');
      return;
    }

    console.log('✅ Imagen válida, guardando...');
    setSelectedImage(file);
    const previewURL = URL.createObjectURL(file);
    setPreviewUrl(previewURL);
    console.log('✅ Preview URL creada:', previewURL);
    setResult(null);
    setError(null);
    console.log('✅ Estado actualizado, imagen lista para reconocimiento');
  };

  const recognizePlate = async () => {
    console.log('🔍 recognizePlate llamado');
    console.log('📦 selectedImage:', selectedImage);
    console.log('🖼️ previewUrl:', previewUrl);
    
    if (!selectedImage) {
      console.error('❌ selectedImage es null/undefined');
      setError('Por favor selecciona o captura una imagen primero');
      return;
    }

    console.log('✅ selectedImage existe, preparando envío...');
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedImage);
    console.log('📦 FormData creado con imagen de', selectedImage.size, 'bytes');

    try {
      console.log('🚀 Enviando solicitud a:', '/seguridad/visitas/recognize_plate/');
      console.log('📊 Detalles:', {
        name: selectedImage.name,
        size: selectedImage.size,
        type: selectedImage.type
      });
      
      const response = await axiosInstance.post('/seguridad/visitas/recognize_plate/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 segundos timeout
      });

      console.log('Respuesta recibida:', response.data);
      setResult(response.data);
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Error al reconocer la placa. Intenta de nuevo.';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'La solicitud tardó demasiado. Verifica que el servidor esté funcionando.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Endpoint no encontrado. Verifica que el servidor esté corriendo en http://localhost:8000';
      } else if (err.response?.status === 500) {
        errorMessage = 'Error del servidor: ' + (err.response?.data?.error || 'Error interno');
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (!err.response) {
        errorMessage = 'No se pudo conectar al servidor. Verifica que Django esté corriendo.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    stopCamera();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h1 className="text-2xl font-bold">Reconocimiento de Placas Vehiculares</h1>
          <p className="text-blue-100 text-sm mt-1">Captura o sube una imagen de la placa</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Controles de Captura */}
          {!result && (
            <div className="space-y-4">
              {/* Selector de cámara */}
              {availableCameras.length > 1 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📹 Seleccionar Cámara ({availableCameras.length} disponibles):
                  </label>
                  <select
                    value={selectedCamera || ''}
                    onChange={(e) => {
                      setSelectedCamera(e.target.value);
                      if (isCameraOpen) {
                        stopCamera();
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableCameras.map((camera, index) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Cámara ${index + 1}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Si ves "Cámara 1, Cámara 2", una de ellas es tu Redragon
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={isCameraOpen ? stopCamera : startCamera}
                  disabled={loading}
                  className={`flex-1 min-w-[200px] px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCameraOpen
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? '⏳ Iniciando...' : isCameraOpen ? '✖️ Cerrar Cámara' : '📷 Abrir Cámara'}
                </button>

                <label className="flex-1 min-w-[200px] px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-center cursor-pointer transition-colors">
                  📁 Subir Imagen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Ayuda para acceso a cámara */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Consejo:</strong> Si la cámara no abre:
                </p>
                <ul className="text-sm text-blue-700 mt-2 ml-4 space-y-1">
                  <li>• Verifica que ninguna otra app esté usando la cámara</li>
                  <li>• Busca el ícono de cámara 🎥 en la barra de direcciones y permite el acceso</li>
                  <li>• En Windows: Configura permisos en Configuración → Privacidad → Cámara</li>
                  <li>• Cierra y vuelve a abrir el navegador si es necesario</li>
                </ul>
              </div>
            </div>
          )}

          {/* Video Stream de la Cámara - SIEMPRE renderizado pero oculto si no está abierto */}
          <div className={isCameraOpen ? "space-y-3" : "hidden"}>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[400px] object-contain"
              />
              <div className="absolute inset-0 border-4 border-yellow-400 border-dashed pointer-events-none opacity-50" />
            </div>
            <button
              onClick={capturePhoto}
              className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
            >
              📸 Capturar Foto
            </button>
          </div>

          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Preview de la Imagen */}
          {previewUrl && !isCameraOpen && (
            <div className="space-y-3">
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-[400px] object-contain bg-gray-50"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={recognizePlate}
                  disabled={loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? '🔄 Procesando...' : '🔍 Reconocer Placa'}
                </button>
                
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  🔄 Nueva Imagen
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
                <div>
                  <h3 className="text-red-800 font-semibold">Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className="space-y-4">
              <div className={`border-l-4 p-4 rounded ${
                result.acceso_permitido
                  ? 'bg-green-50 border-green-500'
                  : 'bg-yellow-50 border-yellow-500'
              }`}>
                <div className="flex items-start">
                  <span className="text-3xl mr-3">
                    {result.acceso_permitido ? '✅' : '⚠️'}
                  </span>
                  <div className="flex-1">
                    <h3 className={`font-bold text-xl ${
                      result.acceso_permitido ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      Placa Detectada: {result.plate_number}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      result.acceso_permitido ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {result.acceso_permitido
                        ? 'Vehículo registrado - Acceso permitido'
                        : 'Vehículo no registrado - Verificación requerida'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Vehículo Registrado */}
              {result.vehicle_info && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">📋 Información del Vehículo</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-blue-600">Marca</p>
                      <p className="font-medium text-blue-900">{result.vehicle_info.marca}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Modelo</p>
                      <p className="font-medium text-blue-900">{result.vehicle_info.modelo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Color</p>
                      <p className="font-medium text-blue-900">{result.vehicle_info.color}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Año</p>
                      <p className="font-medium text-blue-900">{result.vehicle_info.año || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-blue-600">Propietario</p>
                      <p className="font-medium text-blue-900">{result.vehicle_info.propietario}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-blue-600">Unidad</p>
                      <p className="font-medium text-blue-900">{result.vehicle_info.unidad || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información Detectada por IA */}
              {result.detected_info && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">🤖 Información Detectada por IA</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-purple-600">Tipo</p>
                      <p className="font-medium text-purple-900">{result.detected_info.type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">Marca</p>
                      <p className="font-medium text-purple-900">{result.detected_info.make || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">Modelo</p>
                      <p className="font-medium text-purple-900">{result.detected_info.model || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">Color</p>
                      <p className="font-medium text-purple-900">{result.detected_info.color || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Confianza</p>
                  <p className="font-bold text-lg text-gray-900">
                    {result.confidence_score ? `${result.confidence_score}%` : result.confidence}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Tipo de Acceso</p>
                  <p className="font-bold text-lg text-gray-900 capitalize">{result.tipo_acceso}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Tiempo</p>
                  <p className="font-bold text-lg text-gray-900">
                    {result.processing_time ? `${result.processing_time.toFixed(2)}s` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Botón para otro reconocimiento */}
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                🔄 Reconocer Otra Placa
              </button>
            </div>
          )}

          {/* Instrucciones */}
          {!previewUrl && !isCameraOpen && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">📖 Instrucciones</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Asegúrate de que la placa esté bien iluminada</li>
                <li>Captura la imagen lo más cerca posible</li>
                <li>La placa debe estar visible y legible</li>
                <li>Evita reflejos o sombras sobre la placa</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlateRecognition;
