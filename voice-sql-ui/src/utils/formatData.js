export const formatForChart = (data, xField, yField) => {
  if (!Array.isArray(data) || data.length === 0 || !xField || !yField) return [];

  return data
    .filter(item => item && item[xField] !== undefined && item[yField] !== undefined)
    .map(item => ({
      label: String(item[xField] ?? ''),  // Handles null/undefined safely
      value: Number(item[yField] ?? 0)    // Defaults to 0 if missing
    }))
    .filter(item => item.label !== '' && !isNaN(item.value));  // Clean invalids
};
