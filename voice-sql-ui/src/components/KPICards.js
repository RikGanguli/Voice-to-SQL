import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './KPICards.css';

const KPICards = () => {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/kpis');
        setKpis(response.data);
      } catch (error) {
        console.error("Failed to fetch KPIs:", error);
      }
    };
    fetchKPIs();
  }, []);

  if (!kpis) return <p>Loading KPIs...</p>;

  const kpiItems = [
    { label: 'Total Policies', value: kpis.totalPolicies },
    { label: 'Total Gross Premium', value: kpis.totalGrossPremium },
    { label: 'Average Policy Limit', value: kpis.avgPolicyLimit },
    { label: 'Policies Issued This Month', value: kpis.policiesThisMonth },
    { label: 'Most Common Transaction Type', value: kpis.commonTransactionType },
    { label: 'Top Insured State', value: kpis.topInsuredState },
  ];

  return (
    <div className="kpi-container">
      {kpiItems.map((kpi, index) => (
        <div key={index} className="kpi-card">
          <h2>{kpi.value}</h2>
          <p>{kpi.label}</p>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
