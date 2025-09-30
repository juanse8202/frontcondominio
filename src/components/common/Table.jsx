import React from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

/**
 * Componente de tabla minimalista y reutilizable
 */
const Table = ({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = "No hay datos disponibles",
  className = "",
  onRowClick = null
}) => {
  if (loading) {
    return (
      <div className="table-container">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white/70" />
          <span className="ml-2 text-white/70">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="table-primary">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index}
                className={column.className || ''}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="text-center py-12 text-white/60"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={`${onRowClick ? 'cursor-pointer' : ''} ${row.className || ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex}
                    className={column.cellClassName || ''}
                  >
                    {column.render 
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      render: PropTypes.func,
      width: PropTypes.string,
      className: PropTypes.string,
      cellClassName: PropTypes.string,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
  onRowClick: PropTypes.func,
};

export default Table;