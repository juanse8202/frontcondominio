/**
 * EJEMPLOS DE USO - Integración ImgBB en Frontend
 * 
 * Este archivo muestra cómo usar los helpers de imágenes
 * en diferentes componentes del sistema.
 */

// ============================================
// EJEMPLO 1: Mostrar QR Code de Visita
// ============================================
import { getVisitaQRUrl, OptimizedImage } from '../utils/imageHelpers';

function VisitaCard({ visita }) {
  const qrUrl = getVisitaQRUrl(visita);
  
  return (
    <div className="card">
      <h3>{visita.nombre_visitante}</h3>
      
      {/* Método 1: Usando la función helper */}
      {qrUrl && (
        <img src={qrUrl} alt="QR Code" className="w-32 h-32" />
      )}
      
      {/* Método 2: Usando el componente OptimizedImage */}
      <OptimizedImage
        item={visita}
        fieldName="qr_code"
        alt="QR Code"
        className="w-32 h-32"
        fallback="/qr-placeholder.png"
      />
    </div>
  );
}

// ============================================
// EJEMPLO 2: Galería de Vehículos
// ============================================
import { getVehiculoFotoUrl, ImageWithFallback } from '../utils/imageHelpers';

function VehiculosGallery({ vehiculos }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {vehiculos.map((vehiculo) => {
        const fotoUrl = getVehiculoFotoUrl(vehiculo);
        
        return (
          <div key={vehiculo.id} className="card">
            <ImageWithFallback
              src={fotoUrl}
              fallback="/vehicle-placeholder.png"
              alt={`${vehiculo.marca} ${vehiculo.modelo}`}
              className="w-full h-48 object-cover rounded"
            />
            <h4>{vehiculo.placa}</h4>
            <p>{vehiculo.marca} {vehiculo.modelo}</p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// EJEMPLO 3: Foto de Perfil de Usuario
// ============================================
import { getUsuarioFotoUrl, useImageUrl } from '../utils/imageHelpers';

function UserProfile({ usuario }) {
  const { imageUrl, isFromImgBB, hasImage } = useImageUrl(usuario.perfil, 'foto');
  
  return (
    <div className="profile">
      {hasImage ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt={usuario.nombre}
            className="w-24 h-24 rounded-full"
          />
          {isFromImgBB && (
            <span className="badge">☁️ Cloud</span>
          )}
        </div>
      ) : (
        <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-2xl">{usuario.nombre[0]}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 4: Registro de Visita con Foto
// ============================================
import { getFotoEntradaUrl } from '../utils/imageHelpers';

function RegistroVisitaDetail({ registro }) {
  const fotoUrl = getFotoEntradaUrl(registro);
  
  return (
    <div className="registro-detail">
      <h3>Registro de Visita</h3>
      <p>Visitante: {registro.visita.nombre_visitante}</p>
      <p>Entrada: {registro.hora_entrada}</p>
      
      {fotoUrl && (
        <div className="foto-entrada">
          <h4>Foto de Entrada</h4>
          <img
            src={fotoUrl}
            alt="Foto de entrada"
            className="w-full max-w-md rounded-lg shadow"
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 5: Reconocimiento de Placas
// ============================================
import { getPlateImageUrl } from '../utils/imageHelpers';

function PlateRecognitionLog({ log }) {
  const imageUrl = getPlateImageUrl(log);
  
  return (
    <div className="plate-log">
      <div className="flex gap-4">
        {/* Imagen capturada */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`Placa ${log.plate_number}`}
            className="w-48 h-32 object-cover rounded"
          />
        )}
        
        {/* Información */}
        <div>
          <h4 className="text-xl font-bold">{log.plate_number}</h4>
          <p>Vehículo: {log.vehicle_type}</p>
          <p>Marca: {log.vehicle_make}</p>
          <p>Modelo: {log.vehicle_model}</p>
          <p>Color: {log.vehicle_color}</p>
          <p>Confianza: {log.confidence}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EJEMPLO 6: Usar getImageUrl directamente
// ============================================
import { getImageUrl } from '../utils/imageHelpers';

function GenericImageDisplay({ item, fieldName }) {
  const imageUrl = getImageUrl(item, fieldName);
  
  if (!imageUrl) {
    return <p>No hay imagen disponible</p>;
  }
  
  return (
    <div className="image-container">
      <img src={imageUrl} alt="Imagen" className="max-w-full" />
      
      {/* Mostrar si viene de ImgBB o local */}
      {item[`${fieldName}_url`] ? (
        <span className="badge badge-success">☁️ ImgBB</span>
      ) : (
        <span className="badge badge-warning">📁 Local</span>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 7: Lista de Mascotas
// ============================================
import { getMascotaFotoUrl } from '../utils/imageHelpers';

function MascotasList({ mascotas }) {
  return (
    <div className="mascotas-grid">
      {mascotas.map((mascota) => {
        const fotoUrl = getMascotaFotoUrl(mascota);
        
        return (
          <div key={mascota.id} className="mascota-card">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={mascota.nombre}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                🐾
              </div>
            )}
            <h4>{mascota.nombre}</h4>
            <p>{mascota.tipo} - {mascota.raza}</p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// EJEMPLO 8: Hook useImageUrl con loading state
// ============================================
import { useState, useEffect } from 'react';
import { useImageUrl } from '../utils/imageHelpers';

function ImageWithLoading({ item, fieldName }) {
  const { imageUrl, isFromImgBB, hasImage } = useImageUrl(item, fieldName);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => setLoading(false);
      img.onerror = () => setLoading(false);
    } else {
      setLoading(false);
    }
  }, [imageUrl]);
  
  if (!hasImage) {
    return <div>Sin imagen</div>;
  }
  
  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="spinner"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt="Imagen"
        className={`transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
      />
      {isFromImgBB && (
        <span className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          ImgBB
        </span>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 9: Thumbnail y Full Image
// ============================================
import { useState } from 'react';
import { getImageUrl } from '../utils/imageHelpers';

function ImageGalleryWithModal({ items, fieldName }) {
  const [selectedImage, setSelectedImage] = useState(null);
  
  return (
    <>
      {/* Galería de thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const imageUrl = getImageUrl(item, fieldName);
          
          return (
            <img
              key={item.id}
              src={imageUrl}
              alt="Thumbnail"
              className="w-full h-24 object-cover cursor-pointer hover:opacity-80"
              onClick={() => setSelectedImage(imageUrl)}
            />
          );
        })}
      </div>
      
      {/* Modal con imagen completa */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-4xl max-h-screen"
          />
        </div>
      )}
    </>
  );
}

// ============================================
// EJEMPLO 10: Comparación Antes/Después
// ============================================
function ImageComparison({ item, fieldName }) {
  const localUrl = item[fieldName] ? `http://localhost:8000${item[fieldName]}` : null;
  const imgbbUrl = item[`${fieldName}_url`];
  
  return (
    <div className="comparison">
      <div className="side-by-side">
        <div>
          <h4>Local</h4>
          {localUrl ? (
            <img src={localUrl} alt="Local" />
          ) : (
            <p>No disponible</p>
          )}
        </div>
        
        <div>
          <h4>ImgBB</h4>
          {imgbbUrl ? (
            <img src={imgbbUrl} alt="ImgBB" />
          ) : (
            <p>No disponible</p>
          )}
        </div>
      </div>
      
      <div className="status">
        {imgbbUrl ? (
          <span className="text-green-600">✓ Migrada a ImgBB</span>
        ) : (
          <span className="text-yellow-600">⚠ Solo local</span>
        )}
      </div>
    </div>
  );
}

export default {
  VisitaCard,
  VehiculosGallery,
  UserProfile,
  RegistroVisitaDetail,
  PlateRecognitionLog,
  GenericImageDisplay,
  MascotasList,
  ImageWithLoading,
  ImageGalleryWithModal,
  ImageComparison,
};
