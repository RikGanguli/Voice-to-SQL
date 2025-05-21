import React from 'react';
import PieChartComponent from './PieChartComponent';
import LineChartComponent from './LineChartComponent';
import BarChartComponent from './BarChartComponent';
import './Charts.css';

const ChartWrapper = ({ chartType, data, xField, yField, userQuestion }) => {
  if (!data || data.length === 0 || !xField || !yField) return null;

  const chartComponent = {
    pie: <PieChartComponent data={data} xField={xField} yField={yField} />,
    line: <LineChartComponent data={data} xField={xField} yField={yField} />,
    bar: <BarChartComponent data={data} xField={xField} yField={yField} />
  }[chartType] || null;

  const generateTitle = () => {
    if (userQuestion && userQuestion.length > 0) {
      let cleaned = userQuestion.toLowerCase();

      // Remove filler and chart phrases
      cleaned = cleaned.replace(
        /\b(show|display|give me|plot|draw|visualize|chart|graph|illustrate|render|generate|make|compare|using( a)? (pie|bar|line)? chart|using( a)? (pie|bar|line)?|grouped by|as (a )?(pie|bar|line)? chart|the|of|a|an|please)\b/g,
        ''
      );

      cleaned = cleaned.replace(/\s+/g, ' ').trim();

      const toTitleCase = (str) =>
        str.replace(/\w\S*/g, (w) =>
          ['ytd', 'mtd', 'gwp', 'kpi', 'api'].includes(w.toLowerCase())
            ? w.toUpperCase()
            : w.charAt(0).toUpperCase() + w.slice(1)
        );

      if (cleaned.length > 0) {
        return toTitleCase(cleaned);
      }
    }

    // Fallback title
    const fallback = `${yField} vs ${xField}`.replace(/_/g, ' ');
    return fallback
      .split(' ')
      .map((word) =>
        ['ytd', 'mtd', 'gwp'].includes(word.toLowerCase())
          ? word.toUpperCase()
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ');
  };


  return (
    <div className="chart-wrapper">
      {chartComponent}
      <p className="chart-title">{generateTitle()}</p>
    </div>
  );
};

export default ChartWrapper;
