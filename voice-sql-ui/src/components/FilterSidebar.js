import React from 'react';
import './FilterSidebar.css';

const FilterSidebar = ({ filters, onChange, onApplyFilters, onManualQuerySubmit }) => {

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <aside className="filter-sidebar">
      <h2>Filters</h2>

      {/* Manual Query */}
      <div className="filter-section">
        <h3>Ask About Your Data</h3>
        <input
          type="text"
          name="manualQuery"
          value={filters.manualQuery}
          onChange={handleInputChange}
          placeholder="Type your query here"
        />
        <button className="submit-query-btn" onClick={onManualQuerySubmit}>
          Submit Query
        </button>
      </div>

      {/* Effective Date */}
      <div className="filter-section effective-date">
        <h3>Effective Date</h3>
        <label>
            From:
            <input
            type="date"
            name="effectiveFrom"
            value={filters.effectiveFrom}
            onChange={handleInputChange}
            />
        </label>
        <label>
            To:
            <input
            type="date"
            name="effectiveTo"
            value={filters.effectiveTo}
            onChange={handleInputChange}
            />
        </label>
      </div>


      {/* Transaction Type */}
      <div className="filter-section">
        <h3>Transaction Type</h3>
        <input
          type="text"
          name="transactionType"
          value={filters.transactionType}
          onChange={handleInputChange}
          placeholder="e.g., New Business"
        />
      </div>

      {/* Insured State */}
      <div className="filter-section">
        <h3>Insured State</h3>
        <input
          type="text"
          name="insuredState"
          value={filters.insuredState}
          onChange={handleInputChange}
          placeholder="e.g., CA"
        />
      </div>

      {/* Coverage */}
      <div className="filter-section">
        <h3>Coverage</h3>
        <input
          type="text"
          name="coverage"
          value={filters.coverage}
          onChange={handleInputChange}
          placeholder="Coverage Type"
        />
      </div>

      {/* Agent Name
      <div className="filter-section">
        <h3>Agent Name</h3>
        <input
          type="text"
          name="agentName"
          value={filters.agentName}
          onChange={handleInputChange}
          placeholder="Search agent"
        />
      </div> */}

      {/* Limit Range */}
      <div className="filter-section">
        <h3>Limit Range</h3>
        <input
          type="number"
          name="limitMin"
          value={filters.limitMin}
          onChange={handleInputChange}
          placeholder="Min"
        />
        <input
          type="number"
          name="limitMax"
          value={filters.limitMax}
          onChange={handleInputChange}
          placeholder="Max"
        />
      </div>

      {/* Gross Premium Range */}
      <div className="filter-section">
        <h3>Gross Premium Range</h3>
        <input
          type="number"
          name="premiumMin"
          value={filters.premiumMin}
          onChange={handleInputChange}
          placeholder="Min"
        />
        <input
          type="number"
          name="premiumMax"
          value={filters.premiumMax}
          onChange={handleInputChange}
          placeholder="Max"
        />
      </div>

      <button className="apply-filters-btn" onClick={onApplyFilters}>
        Apply Filters
      </button>
    </aside>
  );
};

export default FilterSidebar;
