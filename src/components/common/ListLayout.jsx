import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import Pagination from './Pagination';

/**
 * A reusable list layout component that provides a consistent UI for all list views
 * with responsive design for mobile devices
 */
const ListLayout = ({
  title,
  description,
  createButtonText,
  createButtonLink,
  searchPlaceholder = "Buscar...",
  searchTerm = "",
  onSearchChange,
  renderTable,
  children,
  currentPage,
  totalCount,
  onPageChange,
  isLoading,
  error,
  filters = null,
  searchFilters = null,
  actions = null,
  stats = null,
  loading = false,
  onFilterChange = null
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Use the more specific loading prop if available, otherwise fall back to isLoading
  const showLoading = loading || isLoading;

  if (showLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    let errorMsg = error;
    if (error === 'Invalid page.') {
      errorMsg = 'Página inválida. No existen más páginas.';
    }
    return (
      <div className="bg-blue-500/20 border border-blue-500/30 text-white p-3 rounded-lg animate-fade-in">
        <p className="flex items-center gap-2">
          <X className="w-5 h-5" />
          {errorMsg}
        </p>
      </div>
    );
  }

  const renderFilters = () => {
    if (!filters) return null;
    
    return (
      <div className={`
        ${isFilterOpen ? 'block' : 'hidden md:block'} 
        bg-white/5 border border-white/10 rounded-lg p-4 mb-6 animate-fade-in
        ${isFilterOpen ? 'absolute z-20 top-full mt-2 left-4 right-4' : ''}
      `}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-white">Filtros</h3>
          {isFilterOpen && (
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {filters}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {description && (
            <p className="text-white/70 mt-1">{description}</p>
          )}
        </div>

        {/* Actions section */}
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
        
        {/* Legacy mobile search and actions (keep for backward compatibility) */}
        {(onSearchChange || createButtonLink) && !actions && (
          <>
            {/* Mobile Search Expanded */}
            {isSearchExpanded && (
              <div className="fixed inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 z-40 p-4 animate-fade-in md:hidden">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSearchExpanded(false)}
                    className="text-white p-2 rounded-xl hover:bg-white/10"
                    aria-label="Cerrar búsqueda"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      className="pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white w-full"
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-3 relative">
              {/* Desktop Search */}
              {onSearchChange && (
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm w-64"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                  />
                </div>
              )}
              
              {/* Mobile Actions */}
              <div className="flex items-center gap-2 md:hidden">
                {onSearchChange && (
                  <button
                    onClick={() => setIsSearchExpanded(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white"
                    aria-label="Buscar"
                  >
                    <Search size={18} />
                    <span>Buscar</span>
                  </button>
                )}
                
                {filters && (
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`
                      flex items-center justify-center p-2 rounded-lg
                      ${isFilterOpen ? 'bg-blue-500 text-white' : 'bg-white/5 border border-white/10 text-white'}
                    `}
                    aria-label="Filtrar"
                  >
                    <SlidersHorizontal size={18} />
                  </button>
                )}
                
                {createButtonLink && (
                  <Link 
                    to={createButtonLink} 
                    className="flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm"
                    aria-label={createButtonText}
                  >
                    <Plus size={18} />
                  </Link>
                )}
              </div>
              
              {/* Desktop Actions */}
              {filters && (
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`
                    hidden md:flex items-center gap-2 px-4 py-2 rounded-lg
                    ${isFilterOpen ? 'bg-blue-500 text-white' : 'bg-white/5 border border-white/10 text-white'}
                  `}
                >
                  <Filter size={16} />
                  <span>Filtros</span>
                  <ChevronDown size={16} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
              
              {createButtonLink && (
                <Link to={createButtonLink} className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-sm">
                  <Plus size={16} />
                  <span>{createButtonText}</span>
                </Link>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stats section */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className={`bg-gradient-to-r ${stat.color} p-6 rounded-xl text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="text-white/80">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search filters section */}
      {searchFilters && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          {searchFilters}
        </div>
      )}
      
      {/* Legacy filters section (keep for backward compatibility) */}
      {renderFilters()}
      
      {/* Content section */}
      <div className="overflow-x-auto pb-4">
        {children || (renderTable && renderTable())}
      </div>

      {/* Paginación */}
      {totalCount > 0 && onPageChange && (
        <Pagination 
          currentPage={currentPage}
          totalCount={totalCount}
          onPageChange={onPageChange}
          variant="compact"
        />
      )}
    </div>
  );
};

ListLayout.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  createButtonText: PropTypes.string,
  createButtonLink: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  renderTable: PropTypes.func,
  children: PropTypes.node,
  currentPage: PropTypes.number,
  totalCount: PropTypes.number,
  onPageChange: PropTypes.func,
  isLoading: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.any,
  filters: PropTypes.node,
  searchFilters: PropTypes.node,
  actions: PropTypes.node,
  stats: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    color: PropTypes.string.isRequired
  })),
  onFilterChange: PropTypes.func
};

export default ListLayout;