import React from 'react';
import PropTypes from 'prop-types';

/**
 * Header de página consistente y minimalista
 */
const PageHeader = ({
  title,
  description,
  icon: Icon = null,
  actions = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="text-white/70">
            <Icon size={24} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-white/70 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default PageHeader;