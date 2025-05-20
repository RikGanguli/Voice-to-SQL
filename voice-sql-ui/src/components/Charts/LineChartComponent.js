import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './Charts.css';

// Register necessary chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const LineChartComponent = ({ data, xField, yField }) => {
  if (!data || !xField || !yField) return null;

  console.log('LineChartComponent - data received:', data);
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
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      tension: 0.3,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#ffffff'
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
          font: { size: 14, weight: 'bold' }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yField,
          font: { size: 14, weight: 'bold' }
        }
      }
    }
  };

  const chartKey = labels.join('-') + values.join('-');

  return (
    <div className="chart-container" style={{ height: '300px' }}>
      <Chart key={chartKey} type="line" data={chartData} options={options} />
    </div>
  );
};

export default LineChartComponent;
