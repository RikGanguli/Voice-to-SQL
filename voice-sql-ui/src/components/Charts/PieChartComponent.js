import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './Charts.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChartComponent = ({ data, xField, yField }) => {
  if (!data || !xField || !yField) return null;

  const labels = [];
  const values = [];

  data.forEach((item) => {
    const label = String(item[xField] ?? '').trim();
    const value = Number(item[yField] ?? 0);

    if (label && !isNaN(value)) {
      labels.push(label);
      values.push(value);
    }
  });

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          '#6366f1', '#60a5fa', '#34d399', '#fbbf24',
          '#f87171', '#a78bfa', '#f472b6', '#10b981'
        ],
        borderColor: 'white',
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // ❗ Allow the chart to fill its container
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = String(context.label || '');
            const value = context.parsed || 0;
            return `${label}: ${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  return (
    <div className="chart-container" style={{ width: '100%', maxWidth: '500px', height: '300px', margin: '0 auto' }}>
      <Chart
        key={labels.join('-')}
        type="pie"
        data={chartData}
        options={options}
      />
    </div>
  );
};

export default PieChartComponent;
