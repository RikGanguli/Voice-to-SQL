import React from 'react';
import './KPICards.css';

const KPICards = () => {
  // Hardcoded KPI values with types for styling
  const kpiItems = [
    { label: 'GWP Issued Today', value: 251234, type: 'gwp' },
    { label: 'GWP MTD', value: 2144578.32, type: 'gwp' },
    { label: 'GWP YTD', value: 5638921.64, type: 'gwp' },
    { label: 'Total Incurred', value: 2000000, type: 'totals' },
    { label: 'Open Claims Today', value: 65873.42, type: 'claims' },
    { label: 'Open Claims MTD', value: 214987.1, type: 'claims' },
    { label: 'Open Claims YTD', value: 1274589.99, type: 'claims' },
  ];

  // const formatCurrency = (amount, type) => {
  //   const isGWP = type === 'gwp';

  //   // Round to 2 decimals for claims/totals, no decimals for GWP
  //   const precision = isGWP ? 0 : 2;
  //   const num = Number(amount);

  //   if (num >= 1_000_000) {
  //     const value = (num / 1_000_000).toFixed(precision);
  //     return `$${value}M`;
  //   } else if (num >= 1_000) {
  //     const value = (num / 1_000).toFixed(precision);
  //     return `$${value}K`;
  //   } else {
  //     return `$${num.toFixed(precision)}`;
  //   }
  // };

  const formatCurrency = (amount, type) => {
  const num = Number(amount);

  if (num >= 1_000_000) {
    const value = (num / 1_000_000).toFixed(2);
    return `$${value}M`;
  } else if (num >= 1_000) {
    const value = (num / 1_000).toFixed(2);
    return `$${value}K`;
  } else {
    const precision = type === 'gwp' ? 0 : 2;
    return `$${num.toFixed(precision)}`;
  }
};


  return (
    <div className="kpi-container">
      {kpiItems.map((kpi, index) => (
        <div key={index} className={`kpi-card ${kpi.type}`}>
          <h2>{formatCurrency(kpi.value, kpi.type)}</h2>
          <p>{kpi.label}</p>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
