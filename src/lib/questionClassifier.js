import { base44 } from "@/api/base44Client";

/**
 * Question Classifier Agent
 * Analyzes a user's question and recommends the best LLM model to use
 * Runs on gpt_5_mini for speed (classification is lightweight)
 */
export async function classifyQuestion(question, dbSchema) {
  const result = await base44.integrations.Core.InvokeLLM({
    model: "gpt_5_mini",
    prompt: `You are a query type classifier. Analyze the user's question and determine:
1. The query complexity type
2. The recommended LLM model to use

Database Schema:
${dbSchema}

User Question: "${question}"

Query complexity types:
- "schema_lookup": Simple schema questions (e.g., "what tables exist?", "show me columns", "what fields in Product?")
- "simple_filter": Basic SELECT with simple WHERE/ORDER BY (e.g., "show all customers from USA")
- "aggregation": GROUP BY / aggregation queries (e.g., "total revenue by country")
- "complex_join": Multiple table joins with filtering (e.g., "top customers who bought X product")
- "complex_analytical": Advanced analytics with multiple aggregations/windows (e.g., "revenue trend by region with growth rate")

Recommended models:
- "gpt_5_mini": For schema lookups and simple queries (fastest, cheapest)
- "gpt_5": For complex multi-join or advanced analytics (balanced)

Return JSON:
- query_type: one of the types above
- recommended_model: "gpt_5_mini" or "gpt_5"
- reasoning: brief explanation of your classification`,
    response_json_schema: {
      type: "object",
      properties: {
        query_type: { type: "string" },
        recommended_model: { type: "string" },
        reasoning: { type: "string" },
      },
    },
  });

  return result;
}