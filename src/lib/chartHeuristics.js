/**
 * Client-side heuristics to detect if data is suitable for visualization
 * before invoking the LLM-based vizAgent.
 * 
 * Returns { suitable: boolean, reason?: string }
 */

export function analyzeDataSuitability(columns, rows) {
  // Empty data
  if (!rows || rows.length === 0) {
    return { suitable: false, reason: "No data rows to visualize" };
  }

  if (!columns || columns.length === 0) {
    return { suitable: false, reason: "No columns to visualize" };
  }

  // Too many columns (hard to visualize)
  if (columns.length > 20) {
    return { suitable: false, reason: "Too many columns for visualization" };
  }

  // Analyze column types and content
  const colTypes = analyzeColumnTypes(columns, rows);
  const numericCount = colTypes.filter((t) => t === "numeric").length;
  const categoricalCount = colTypes.filter((t) => t === "categorical").length;
  const dateCount = colTypes.filter((t) => t === "date").length;

  // Need at least 1 numeric column for most charts
  if (numericCount === 0 && dateCount === 0) {
    return { suitable: false, reason: "No numeric or date columns to chart" };
  }

  // Single row is hard to visualize meaningfully
  if (rows.length === 1 && numericCount === 0) {
    return { suitable: false, reason: "Single row with no numeric data" };
  }

  // Likely suitable for visualization
  return { suitable: true };
}

/**
 * Infer column types from first 10 rows of data
 */
function analyzeColumnTypes(columns, rows) {
  const sampleSize = Math.min(10, rows.length);
  
  return columns.map((col) => {
    const values = rows.slice(0, sampleSize).map((r) => r[col.key || col.name]);
    
    // Check if numeric
    const numericCount = values.filter(
      (v) => !isNaN(v) && v !== null && v !== "" && typeof v !== "boolean"
    ).length;
    
    if (numericCount > sampleSize * 0.7) return "numeric";

    // Check if date-like
    const dateCount = values.filter((v) => {
      if (!v) return false;
      const d = new Date(v);
      return !isNaN(d.getTime());
    }).length;
    
    if (dateCount > sampleSize * 0.7) return "date";

    // Default: categorical
    return "categorical";
  });
}