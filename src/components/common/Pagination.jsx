import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ 
  currentPage, 
  totalCount, 
  pageSize = 20, 
  onPageChange,
  className = '',
  variant = 'default' // 'default' o 'compact'
}) => {
  // Calcular el número total de páginas
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Si no hay páginas, no mostrar nada
  if (totalPages <= 0) return null;
  
  // Generar el array de páginas a mostrar
  const getPageNumbers = () => {
    if (variant === 'compact' && totalPages > 5) {
      // Para variante compacta con muchas páginas
      const pages = [];
      
      // Siempre incluir la primera página
      pages.push(1);
      
      // Añadir páginas alrededor de la página actual
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      // Añadir la última página si hay más de una página
      if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
      }
      
      // Ordenar el array (por si acaso)
      return pages.sort((a, b) => a - b);
    } else {
      // Para variante predeterminada, mostrar todas las páginas
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className={`flex justify-center mt-6 ${className}`}>
      <div className="flex gap-2">
        {variant === 'compact' && (
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`
              px-3 py-1 rounded-lg text-sm transition-colors
              ${currentPage === 1 
                ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                : 'bg-white/10 hover:bg-white/20 text-white'}
            `}
          >
            Anterior
          </button>
        )}
        
        {pageNumbers.map((page, index) => {
          // Mostrar elipsis para indicar páginas omitidas
          if (variant === 'compact' && index > 0 && pageNumbers[index] - pageNumbers[index - 1] > 1) {
            return (
              <React.Fragment key={`ellipsis-${index}`}>
                <span className="px-3 py-1 bg-white/5 text-white/50 rounded-lg text-sm">...</span>
                <button
                  onClick={() => onPageChange(page)}
                  className={`
                    px-3 py-1 rounded-lg text-sm transition-colors
                    ${currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'}
                  `}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          }
          
          return (
            <button
              key={page}
              onClick={() => {
                if (page !== currentPage) onPageChange(page);
              }}
              className={`
                px-3 py-1 rounded-lg text-sm transition-colors
                ${currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'}
              `}
            >
              {page}
            </button>
          );
        })}
        
        {variant === 'compact' && (
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`
              px-3 py-1 rounded-lg text-sm transition-colors
              ${currentPage === totalPages 
                ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                : 'bg-white/10 hover:bg-white/20 text-white'}
            `}
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'compact'])
};

export default Pagination;