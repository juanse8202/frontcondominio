/**
 * Helper para manejar URLs de ImgBB en el frontend
 * Usar este helper para obtener siempre la URL correcta de las imágenes
 */

import { useState, useEffect } from 'react';

/**
 * Obtiene la URL de una imagen, priorizando ImgBB sobre local
 * @param {Object} item - Objeto que contiene los campos de imagen
 * @param {string} fieldName - Nombre base del campo (sin _url)
 * @returns {string|null} URL de la imagen o null
 * 
 * @example
 * const qrUrl = getImageUrl(visita, 'qr_code');
 * const fotoUrl = getImageUrl(vehiculo, 'foto_vehiculo');
 */
export const getImageUrl = (item, fieldName) => {
  if (!item) return null;
  
  const urlField = `${fieldName}_url`;
  
  // Prioridad 1: URL de ImgBB
  if (item[urlField]) {
    return item[urlField];
  }
  
  // Prioridad 2: ImageField local (con API_URL)
  if (item[fieldName]) {
    // Si ya es una URL completa, retornarla
    if (item[fieldName].startsWith('http')) {
      return item[fieldName];
    }
    // Si no, construir URL completa
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${API_URL}${item[fieldName]}`;
  }
  
  return null;
};

/**
 * Hook personalizado para manejar imágenes con ImgBB
 * @param {Object} item - Objeto que contiene los campos de imagen
 * @param {string} fieldName - Nombre base del campo
 * @returns {Object} { imageUrl, isFromImgBB, hasImage }
 * 
 * @example
 * const { imageUrl, isFromImgBB } = useImageUrl(visita, 'qr_code');
 */
export const useImageUrl = (item, fieldName) => {
  const urlField = `${fieldName}_url`;
  
  const imageUrl = getImageUrl(item, fieldName);
  const isFromImgBB = Boolean(item?.[urlField]);
  const hasImage = Boolean(imageUrl);
  
  return {
    imageUrl,
    isFromImgBB,
    hasImage,
  };
};

/**
 * Componente de imagen optimizado que usa ImgBB
 * @param {Object} props
 * @param {Object} props.item - Objeto con campos de imagen
 * @param {string} props.fieldName - Nombre base del campo
 * @param {string} props.alt - Texto alternativo
 * @param {string} props.className - Clases CSS
 * @param {Object} props.fallback - Imagen de respaldo
 */
export const OptimizedImage = ({ item, fieldName, alt, className, fallback, ...props }) => {
  const { imageUrl, isFromImgBB, hasImage } = useImageUrl(item, fieldName);
  
  if (!hasImage && !fallback) return null;
  
  return (
    <img
      src={imageUrl || fallback}
      alt={alt}
      className={className}
      loading="lazy"
      {...props}
      onError={(e) => {
        if (fallback) {
          e.target.src = fallback;
        }
      }}
    />
  );
};

/**
 * Mapeo de campos de imagen para cada modelo
 */
export const IMAGE_FIELDS = {
  visita: 'qr_code',
  registroVisita: 'foto_entrada',
  plateRecognition: 'image',
  usuario: 'foto',
  vehiculo: 'foto_vehiculo',
  mascota: 'foto',
};

/**
 * Helper para obtener URL de QR de visita
 */
export const getVisitaQRUrl = (visita) => getImageUrl(visita, 'qr_code');

/**
 * Helper para obtener URL de foto de entrada
 */
export const getFotoEntradaUrl = (registro) => getImageUrl(registro, 'foto_entrada');

/**
 * Helper para obtener URL de imagen de placa
 */
export const getPlateImageUrl = (log) => getImageUrl(log, 'image');

/**
 * Helper para obtener URL de foto de usuario
 */
export const getUsuarioFotoUrl = (usuario) => getImageUrl(usuario, 'foto');

/**
 * Helper para obtener URL de foto de vehículo
 */
export const getVehiculoFotoUrl = (vehiculo) => getImageUrl(vehiculo, 'foto_vehiculo');

/**
 * Helper para obtener URL de foto de mascota
 */
export const getMascotaFotoUrl = (mascota) => getImageUrl(mascota, 'foto');

/**
 * Componente de imagen con loading y error handling mejorado
 */
export const ImageWithFallback = ({ 
  src, 
  fallback = '/placeholder.png', 
  alt = 'Image',
  className = '',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setImgSrc(fallback);
  };
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {hasError && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          Error
        </div>
      )}
    </div>
  );
};

// Exportar todo por defecto
export default {
  getImageUrl,
  useImageUrl,
  OptimizedImage,
  IMAGE_FIELDS,
  getVisitaQRUrl,
  getFotoEntradaUrl,
  getPlateImageUrl,
  getUsuarioFotoUrl,
  getVehiculoFotoUrl,
  getMascotaFotoUrl,
  ImageWithFallback,
};
