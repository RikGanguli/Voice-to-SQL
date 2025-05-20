import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './Charts.css';

// Register necessary chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChartComponent = ({ data, xField, yField }) => {
  if (!data || !xField || !yField) return null;

  console.log('BarChartComponent - data received:', data);
  console.log(`Using xField: ${xField}, yField: ${yField}`);

  const labels = data.map(item => String(item[xField]));
  const values = data.map(item => Number(item[yField]));

  console.log('Processed labels:', labels);
  console.log('Processed values:', values);

  const chartData = {
    labels,
    datasets: [{
      label: yField,
      data: values,
      backgroundColor: '#60a5fa',
      borderColor: '#3b82f6',
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = String(context.label || '');
            const value = Number(context.parsed.y || 0);
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xField,
          font: { weight: 'bold', size: 14 }
        }
      },
      y: {
        title: {
          display: true,
          text: yField,
          font: { weight: 'bold', size: 14 }
        },
        beginAtZero: true
      }
    }
  };

  const chartKey = labels.join('-') + values.join('-');

  return (
    <div className="chart-container" style={{ height: '300px' }}>
      <Chart key={chartKey} type="bar" data={chartData} options={options} />
    </div>
  );
};

export default BarChartComponent;
