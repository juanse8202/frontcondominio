import React from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

/**
 * Componente Button reutilizable y elegante
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClass = 'btn-base';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    icon: 'btn-icon'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const isDisabled = disabled || loading;

  const buttonClass = variant === 'icon' 
    ? `${variantClasses[variant]} ${className}`
    : `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      className={`${buttonClass} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={variant === 'icon' ? 16 : 16} />
      )}
      
      {variant !== 'icon' && !loading && (
        <span>{children}</span>
      )}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={16} />
      )}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'icon']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  children: PropTypes.node,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.elementType,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;