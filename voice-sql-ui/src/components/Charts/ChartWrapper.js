import React from 'react';
import PieChartComponent from './PieChartComponent';
import LineChartComponent from './LineChartComponent';
import BarChartComponent from './BarChartComponent';
import './Charts.css';

const ChartWrapper = ({ chartType, data, xField, yField }) => {
  if (!data || data.length === 0 || !xField || !yField) return null;

  switch (chartType) {
    case 'pie':
      return <PieChartComponent data={data} xField={xField} yField={yField} />;
    case 'line':
      return <LineChartComponent data={data} xField={xField} yField={yField} />;
    case 'bar':
      return <BarChartComponent data={data} xField={xField} yField={yField} />;
    default:
      return null;
  }
};

export default ChartWrapper;
