import React from 'react';
import './SQLBox.css';

const SQLBox = ({ sql }) => {
  if (!sql) return null;

  return (
    <div className="sql-box">
      <strong>Generated SQL:</strong>
      <div><code>{sql}</code></div>
    </div>
  );
};

export default SQLBox;
