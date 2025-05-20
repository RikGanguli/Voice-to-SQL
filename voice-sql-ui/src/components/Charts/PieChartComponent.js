import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './Charts.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChartComponent = ({ data, xField, yField }) => {
  console.log('PieChartComponent - data received:', data);
  console.log('Using xField:', xField, 'yField:', yField);

  if (!data || !xField || !yField) return null;

  const labels = data.map(item => String(item[xField]));
  const values = data.map(item => Number(item[yField]));

  console.log('Processed labels:', labels);
  console.log('Processed values:', values);

  const chartData = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: [
        '#6366f1', '#60a5fa', '#34d399', '#fbbf24',
        '#f87171', '#a78bfa', '#f472b6', '#10b981'
      ],
      borderColor: 'white',
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = String(context.label || '');
            const value = context.parsed || 0;
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  return (
    <div className="chart-container" style={{ height: '300px', width: '100%' }}>
      <Chart type="pie" data={chartData} options={options} />
    </div>
  );
};

export default PieChartComponent;
