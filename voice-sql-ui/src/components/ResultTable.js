import React from 'react';
import './ResultTable.css';

const ResultTable = ({ data, columnOrder, columnDisplayNames, isSummaryResult }) => {
  if (!data || data.length === 0) return null;

  // ✅ Format currency values with $ and K/M/B suffix
  const formatCurrency = (val) => {
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    if (isNaN(num)) return val;
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };


  // ✅ Helper: format large numbers using K/M/B if applicable
  const formatLargeNumber = (val) => {
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    if (isNaN(num)) return val;
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  // ✅ CASE 1: Scalar result (e.g., COUNT, SUM, AVG)
  if (data.length === 1 && Object.keys(data[0]).length === 1) {
    const key = Object.keys(data[0])[0];
    const rawValue = data[0][key];
    const numericValue = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;
    const isNumeric = !isNaN(numericValue);

      return (
        <div className="scalar-result centered inline">
          <span className="scalar-label">{key.replace(/_/g, ' ').toUpperCase()}:</span>
          <span className="scalar-value">
            {isNumeric
              ? key.toLowerCase().includes('premium') ||
                key.toLowerCase().includes('limit') ||
                key.toLowerCase().includes('incurred') ||
                key.toLowerCase().includes('claims')
                ? formatCurrency(numericValue)
                : Number.isInteger(numericValue)
                  ? numericValue.toLocaleString()
                  : numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : String(rawValue)}
          </span>
        </div>
      );
  }

  // ✅ CASE 2: Aggregated result (e.g., most common transaction type)
  if (data.length === 1 && Object.keys(data[0]).length === 2) {
    const keys = Object.keys(data[0]);
    return (
      <div className="scalar-result centered inline">
        <span className="scalar-label">
          {keys[0].replace(/_/g, ' ').toUpperCase()}:
        </span>
        <span className="scalar-value">{String(data[0][keys[0]])}</span>
        <span className="scalar-label" style={{ marginLeft: '1rem' }}>
          {keys[1].replace(/_/g, ' ').toUpperCase()}:
        </span>
        <span className="scalar-value">{String(data[0][keys[1]])}</span>
      </div>
    );
  }

  // ✅ CASE 3: Standard full table
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
