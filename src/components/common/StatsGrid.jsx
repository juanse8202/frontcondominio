import React from 'react';
import PropTypes from 'prop-types';

/**
 * Grid de estadísticas minimalista
 */
const StatsGrid = ({ stats = [], className = '' }) => {
  if (!stats.length) return null;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(stats.length, 4)} gap-4 mb-6 ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

const StatCard = ({ 
  title, 
  value, 
  icon: Icon = null, 
  variant = 'default',
  trend = null,
  className = '' 
}) => {
  const variantClasses = {
    default: 'from-white/5 to-white/10',
    success: 'from-green-500/10 to-green-600/20',
    warning: 'from-yellow-500/10 to-yellow-600/20',
    error: 'from-blue-500/10 to-blue-600/20',
    info: 'from-blue-500/10 to-blue-600/20'
  };

  return (
    <div className={`bg-gradient-to-br ${variantClasses[variant]} border border-white/10 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide">
            {title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-white text-xl font-bold">
              {value}
            </p>
            {trend && (
              <span className={`text-xs font-medium ${
                trend.type === 'up' ? 'text-green-400' : 
                trend.type === 'down' ? 'text-blue-400' : 
                'text-gray-400'
              }`}>
                {trend.value}
              </span>
            )}
          </div>
        </div>
        
        {Icon && (
          <div className="text-white/50">
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

StatsGrid.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      icon: PropTypes.elementType,
      variant: PropTypes.oneOf(['default', 'success', 'warning', 'error', 'info']),
      trend: PropTypes.shape({
        type: PropTypes.oneOf(['up', 'down', 'neutral']),
        value: PropTypes.string,
      }),
      className: PropTypes.string,
    })
  ),
  className: PropTypes.string,
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'error', 'info']),
  trend: PropTypes.shape({
    type: PropTypes.oneOf(['up', 'down', 'neutral']),
    value: PropTypes.string,
  }),
  className: PropTypes.string,
};

export default StatsGrid;