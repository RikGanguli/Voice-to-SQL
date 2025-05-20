import React from 'react';
import './ChartToggleButtons.css';

const ChartToggleButtons = ({ setChartType, currentType }) => {
  return (
    <div className="chart-toggle-container">
      <button
        className={`glass-button ${currentType === 'pie' ? 'active' : ''}`}
        onClick={() => setChartType('pie')}
      >
        Pie
      </button>
      <button
        className={`glass-button ${currentType === 'line' ? 'active' : ''}`}
        onClick={() => setChartType('line')}
      >
        Line
      </button>
      <button
        className={`glass-button ${currentType === 'bar' ? 'active' : ''}`}
        onClick={() => setChartType('bar')}
      >
        Bar
      </button>
    </div>
  );
};

export default ChartToggleButtons;
