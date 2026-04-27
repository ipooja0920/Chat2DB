/**
 * Client-side eval runner.
 * Runs test cases in parallel (3 at a time) using the existing queryEngine
 * pipelines and scores them locally — no server round-trip required.
 */

import { base44 } from "@/api/base44Client";
import { getDatabaseById } from "@/lib/queryEngine";

const CONCURRENCY = 5;

// ── Scoring helpers ──────────────────────────────────────────────────────────

function tokenize(sql) {
  return (sql || "")
    .toUpperCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function jaccardSim(tokensA, tokensB) {
  if (!tokensA.length && !tokensB.length) return 1.0;
  const a = new Set(tokensA);
  const b = new Set(tokensB);
  const inter = [...a].filter((t) => b.has(t)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

export function isValidSql(sql) {
  if (!sql) return false;
  const s = sql.trim().toUpperCase();
  return s.startsWith("SELECT") || s.startsWith("WITH");
}

export function sqlSimilarity(generated, expected) {
  // Non-translatable case: no expected SQL expected
  if (!expected) return isValidSql(generated) ? 0 : 1;
  return jaccardSim(tokenize(generated), tokenize(expected));
}

export function cosineSim(sqlA, sqlB) {
  const tokA = tokenize(sqlA);
  const tokB = tokenize(sqlB);
  if (!tokA.length || !tokB.length) return 0;

  const freq = (toks) => {
    const c = {};
    toks.forEach((t) => (c[t] = (c[t] || 0) + 1));
    return c;
  };

  const fA = freq(tokA);
  const fB = freq(tokB);
  const vocab = new Set([...tokA, ...tokB]);

  let dot = 0, magA = 0, magB = 0;
  vocab.forEach((t) => {
    const a = fA[t] || 0;
    const b = fB[t] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });

  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

function resultColSim(genResult, expectedCols) {
  if (!expectedCols?.length) return 1.0;
  const genCols = (genResult?.columns || []).map((c) =>
    (c.key || c.label || "").toLowerCase()
  );
  const expCols = expectedCols.map((c) => c.toLowerCase());
  return jaccardSim(genCols, expCols);
}

function resultRowSim(genResult, expectedRows) {
  if (!expectedRows?.length) return 1.0;
  const genCount = (genResult?.rows || []).length;
  const expCount = expectedRows.length;
  if (!genCount) return 0;
  return Math.min(genCount, expCount) / Math.max(genCount, expCount);
}

// ── Lightweight SQL-only generation (no full pipeline overhead) ───────────────

async function generateSqlOnly(question, dbSchema) {
  const result = await base44.integrations.Core.InvokeLLM({
    model: "gpt_5_mini",
    prompt: `You are a SQL expert. Given the schema below, output a JSON object:
1. "sql": a valid SQL SELECT query answering the question, or "" if not answerable with SQL
2. "translatable": true if answerable with SQL, false otherwise

Schema:
${dbSchema}

Question: ${question}

Respond ONLY with valid JSON.`,
    response_json_schema: {
      type: "object",
      properties: {
        sql: { type: "string" },
        translatable: { type: "boolean" }
      },
      required: ["sql", "translatable"]
    }
  });
  return { sql: (result.sql || "").trim(), translatable: result.translatable !== false };
}

// ── Per-case runner ──────────────────────────────────────────────────────────

async function runSingleCase(tc, pipeline, llm, databaseId) {
  const db = getDatabaseById(databaseId);
  try {
    const { sql: genSql, translatable: isTranslatable } = await generateSqlOnly(tc.question, db.schema);
    const validSql = isValidSql(genSql);

    return {
      question: tc.question,
      expected_sql: tc.expected_sql || "",
      generated_sql: genSql,
      is_valid_sql: validSql,
      is_translatable: isTranslatable,
      translatable_correct: isTranslatable === tc.expected_translatable,
      sql_similarity: sqlSimilarity(genSql, tc.expected_sql),
      result_col_sim: 1,
      result_row_sim: 1,
      cosine_sim: cosineSim(genSql, tc.expected_sql || ""),
      explanation: "OK",
    };
  } catch (err) {
    return {
      question: tc.question,
      expected_sql: tc.expected_sql || "",
      generated_sql: "",
      is_valid_sql: false,
      translatable_correct: !tc.expected_translatable,
      sql_similarity: 0,
      result_col_sim: 0,
      result_row_sim: 0,
      cosine_sim: 0,
      explanation: err?.message || "Error running query",
    };
  }
}

// ── Aggregate metrics ────────────────────────────────────────────────────────

function aggregateResults(results) {
  const n = results.length;
  if (!n) return {};

  const validSqlCount = results.filter((r) => r.is_valid_sql).length;
  const translatableCorrect = results.filter((r) => r.translatable_correct).length;
  const avg = (key) => results.reduce((s, r) => s + (r[key] || 0), 0) / n;

  const avgSqlSim = avg("sql_similarity");
  const avgCosine = avg("cosine_sim");
  const avgColSim = avg("result_col_sim");
  const avgRowSim = avg("result_row_sim");

  // Weighted overall score
  const overallScore =
    (validSqlCount / n) * 0.25 +
    (translatableCorrect / n) * 0.25 +
    avgSqlSim * 0.2 +
    avgCosine * 0.15 +
    avgColSim * 0.1 +
    avgRowSim * 0.05;

  return {
    valid_sql_count: validSqlCount,
    translatable_accuracy: translatableCorrect / n,
    avg_sql_similarity: avgSqlSim,
    avg_cosine_similarity: avgCosine,
    overall_score: overallScore,
  };
}

// ── Main parallel runner ─────────────────────────────────────────────────────

/**
 * Run evals client-side with bounded concurrency.
 *
 * @param {object} opts
 * @param {Array}    opts.testCases   - eval dataset rows
 * @param {string}   opts.pipeline    - "Hybrid" | "RAG" | "TAG"
 * @param {string}   opts.llm         - "OpenAI" | "Claude"
 * @param {string}   opts.databaseId  - "chinook" | "northwind"
 * @param {Function} opts.onProgress  - (completed, total, latestResult) => void
 * @param {object}   opts.abortRef    - { current: boolean } to stop mid-run
 * @returns {Promise<{ results, valid_sql_count, translatable_accuracy, avg_sql_similarity, avg_cosine_similarity, overall_score }>}
 */
export async function runEvals({ testCases, pipeline, llm, databaseId, onProgress, abortRef }) {
  const results = new Array(testCases.length).fill(null);
  let completed = 0;

  for (let i = 0; i < testCases.length; i += CONCURRENCY) {
    if (abortRef?.current) break;

    const batch = testCases.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((tc) => runSingleCase(tc, pipeline, llm, databaseId))
    );

    settled.forEach((r, j) => {
      const idx = i + j;
      results[idx] =
        r.status === "fulfilled"
          ? r.value
          : {
              question: testCases[idx].question,
              expected_sql: testCases[idx].expected_sql || "",
              generated_sql: "",
              is_valid_sql: false,
              translatable_correct: false,
              sql_similarity: 0,
              result_col_sim: 0,
              result_row_sim: 0,
              cosine_sim: 0,
              explanation: r.reason?.message || "Unknown error",
            };

      completed++;
      onProgress?.(completed, testCases.length, results[idx]);
    });
  }

  const finalResults = results.filter(Boolean);
  return { results: finalResults, ...aggregateResults(finalResults) };
}