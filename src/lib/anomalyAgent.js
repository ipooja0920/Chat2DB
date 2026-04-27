import { base44 } from "@/api/base44Client";

export async function detectAnomalies(question, columns, rows) {
  if (!rows || rows.length < 3 || !columns || columns.length === 0) {
    return { anomalies: [], suitable: false };
  }

  const sampleRows = rows.slice(0, 20);

  const result = await base44.integrations.Core.InvokeLLM({
    model: "gpt_5_mini",
    prompt: `You are an Anomaly Detection Analyst. Analyze the following query result data and identify unusual patterns, outliers, spikes, drops, gaps, or concentration anomalies.

Original question: "${question}"

Columns: ${columns.map(c => c.label || c.key).join(", ")}

Data (sample):
${JSON.stringify(sampleRows, null, 2)}

Identify up to 4 anomalies. For each anomaly:
- Be specific with actual values from the data
- Classify severity: "high" (red), "medium" (amber), or "low" (blue)
- Give a short title and a 1-2 sentence description

If there are no meaningful anomalies, return an empty array with suitable: false.`,
    response_json_schema: {
      type: "object",
      properties: {
        suitable: { type: "boolean" },
        anomalies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              severity: { type: "string" },
              type: { type: "string" }
            }
          }
        }
      }
    }
  });

  return result;
}