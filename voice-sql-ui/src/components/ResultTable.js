import React from 'react';
import './ResultTable.css';

const ResultTable = ({ data, columnOrder, columnDisplayNames }) => {
  if (!data || data.length === 0) return null;

  return (
    <table className="result-table">
      <thead>
        <tr>
          {columnOrder.map((col) => (
            <th key={col}>{columnDisplayNames[col] || col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columnOrder.map((key, j) => {
              const val = row[key] ?? '';
              return (
                <td key={j}>
                  {(key === 'limit' || key === 'gross_premium') && !isNaN(val) && val !== ''
                    ? `$${Number(val).toLocaleString('en-US', {
                        minimumFractionDigits: key === 'gross_premium' ? 2 : 0,
                        maximumFractionDigits: key === 'gross_premium' ? 2 : 0
                      })}`
                    : typeof val === 'number'
                      ? val.toLocaleString('en-US')
                      : (typeof val === 'string' && val.includes('T'))
                        ? val.slice(0, 10)
                        : val}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ResultTable;
