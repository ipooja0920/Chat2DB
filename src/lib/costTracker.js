import { base44 } from "@/api/base44Client";

// Pricing per 1M tokens (USD) — approximate published rates
const PRICING = {
  gpt_5_mini:       { input: 0.15,  output: 0.60  },
  gpt_5:            { input: 2.50,  output: 10.00 },
  claude_sonnet_4_6:{ input: 3.00,  output: 15.00 },
  // fallback
  default:          { input: 2.50,  output: 10.00 },
};

// Rough token estimation: 1 token ≈ 4 chars
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost and log a query to QueryLog entity.
 * Call this after runQuery() returns.
 */
export async function logQueryCost({ question, model, pipeline, database, result, promptText }) {
  const pricing = PRICING[model] || PRICING.default;

  // Input = prompt (schema + question + context). Estimate from question length + schema overhead.
  const inputTokens = estimateTokens(promptText || question) + 1500; // 1500 = avg schema overhead
  // Output = the JSON result stringified
  const outputTokens = estimateTokens(JSON.stringify(result || {}));

  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;

  base44.entities.QueryLog.create({
    question,
    model,
    pipeline,
    database,
    estimated_input_tokens: inputTokens,
    estimated_output_tokens: outputTokens,
    estimated_cost_usd: parseFloat(cost.toFixed(6)),
    execution_time_ms: result?.execution_time_ms || 0,
    intent: result?.intent || "",
  }).catch(() => {}); // fire-and-forget, don't block UI
}

export { PRICING };