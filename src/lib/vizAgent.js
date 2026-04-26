import { base44 } from "@/api/base44Client";

/**
 * Visualization Agent
 * Given a question, columns, and rows — decides the best chart type,
 * maps the data to the chart config, and validates correctness.
 */
export async function runVizAgent(question, columns, rows) {
  if (!rows || rows.length === 0) {
    return { suitable: false, reason: "No data to visualize" };
  }

  const sampleRows = rows.slice(0, 5);

  const result = await base44.integrations.Core.InvokeLLM({
    model: "gpt_5_mini",
    prompt: `You are a Data Visualization Agent. Your job is to:
1. Decide if a chart/graph is suitable for this data
2. Choose the best chart type
3. Map column names to chart axes
4. Validate the visualization makes sense for the question

Question: "${question}"

Columns: ${JSON.stringify(columns)}

Sample rows (first 5 of ${rows.length}):
${JSON.stringify(sampleRows, null, 2)}

Rules:
- Bar chart: comparisons across categories (e.g. revenue by country)
- Line chart: trends over time (e.g. monthly revenue)
- Pie chart: part-to-whole with <= 8 categories (e.g. genre distribution)
- Area chart: cumulative trends over time
- Scatter chart: correlation between two numeric values
- Do NOT recommend a chart if data has >1 string column and >2 numeric columns without clear axis mapping
- Do NOT use pie chart if there are more than 8 categories

Respond with JSON:
- suitable: boolean — is a chart visualization useful here?
- reason: string — brief explanation of your decision
- chart_type: "bar" | "line" | "pie" | "area" | "scatter" | null
- x_key: the column key to use for X axis (or label for pie)
- y_keys: array of column keys to use for Y axis (or values for pie) — can be multiple for grouped charts
- title: short chart title
- validation: string — confirm the visualization correctly represents what the question asks for`,
    response_json_schema: {
      type: "object",
      properties: {
        suitable: { type: "boolean" },
        reason: { type: "string" },
        chart_type: { type: "string" },
        x_key: { type: "string" },
        y_keys: { type: "array", items: { type: "string" } },
        title: { type: "string" },
        validation: { type: "string" },
      },
    },
  });

  return result;
}