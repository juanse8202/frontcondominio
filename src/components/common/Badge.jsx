import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge minimalista y elegante
 */
const Badge = ({ 
  variant = 'info', 
  children, 
  size = 'md',
  className = '',
  icon: Icon = null 
}) => {
  const baseClass = 'badge-base';
  
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning', 
    error: 'badge-error',
    info: 'badge-info'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {Icon && <Icon size={12} className="mr-1" />}
      {children}
    </span>
  );
};

Badge.propTypes = {
  variant: PropTypes.oneOf(['success', 'warning', 'error', 'info']),
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  icon: PropTypes.elementType,
};

export default Badge;