import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── SQL Utility Functions (port of evaltools.py) ─────────────────────────────

function cleanSql(sql) {
  if (!sql) return "";
  // remove SQL comments
  let result = sql.replace(/--.*?(\n|$)/g, "");
  // normalize whitespace
  result = result.replace(/[\r\n\s]+/g, " ").trim();
  return result;
}

function flattenSql(sql) {
  return sql.replace(/[\s;]+/g, "").toLowerCase();
}

function isSql(sql) {
  const s = sql.trim().toUpperCase();
  return s.startsWith("SELECT") || s.startsWith("WITH") || s.startsWith("CREATE TABLE");
}

// sequence matcher ratio (port of Python's SequenceMatcher)
function sequenceSimilarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const aFlat = flattenSql(a);
  const bFlat = flattenSql(b);
  // LCS-based similarity
  const la = aFlat.length, lb = bFlat.length;
  if (la === 0 && lb === 0) return 1;
  if (la === 0 || lb === 0) return 0;

  // build LCS length matrix
  const dp = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  let lcs = 0;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      if (aFlat[i - 1] === bFlat[j - 1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
        if (dp[i][j] > lcs) lcs = dp[i][j];
      }
    }
  }
  return (2 * lcs) / (la + lb);
}

// Simple SQL parse validity check
function checkSqlValidity(sql) {
  if (!sql || !isSql(sql)) return { isValid: false, errMessage: "Not a SELECT/WITH query" };
  // Check basic syntax: balanced parentheses
  let depth = 0;
  for (const ch of sql) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth < 0) return { isValid: false, errMessage: "Unbalanced parentheses" };
  }
  if (depth !== 0) return { isValid: false, errMessage: "Unbalanced parentheses" };
  // Check for required clauses
  const upper = sql.toUpperCase();
  if (!upper.includes("SELECT") && !upper.includes("WITH")) {
    return { isValid: false, errMessage: "Missing SELECT clause" };
  }
  return { isValid: true, errMessage: "" };
}

// Column/row similarity (port of qr_compare)
function resultSetSimilarity(expectedRows, generatedRows, expectedCols, generatedCols) {
  if (!expectedCols || expectedCols.length === 0) return { cols_sim: 0, rows_sim: 0, total_sim: 0 };
  
  const commonCols = expectedCols.filter(ec => generatedCols.some(gc => 
    gc.toLowerCase().includes(ec.toLowerCase()) || ec.toLowerCase().includes(gc.toLowerCase())
  ));
  
  const colsSim = commonCols.length / expectedCols.length;
  
  let rowsSim = 0;
  const eLen = expectedRows.length;
  const gLen = generatedRows.length;
  
  if (eLen === 0 && gLen === 0) {
    rowsSim = 1;
  } else if (eLen === 0) {
    rowsSim = 0;
  } else {
    // Count matching rows
    let matchCount = 0;
    const lenDiff = Math.abs(eLen - gLen);
    const lenDiffScore = eLen > 0 ? lenDiff / Math.max(eLen, gLen) : 1;
    
    for (let i = 0; i < Math.min(eLen, gLen); i++) {
      // Check if values roughly match (relaxed comparison)
      const eVals = Object.values(expectedRows[i] || {}).map(v => String(v).toLowerCase());
      const gVals = Object.values(generatedRows[i] || {}).map(v => String(v).toLowerCase());
      const overlap = eVals.filter(v => gVals.includes(v)).length;
      if (overlap > 0) matchCount++;
    }
    rowsSim = eLen > 0 ? matchCount / eLen : 0;
    const totalSim = Math.max(0, colsSim * 0.5 + rowsSim * 0.5 - lenDiffScore * 0.1);
    return { cols_sim: colsSim, rows_sim: rowsSim, total_sim: totalSim };
  }
  
  return { cols_sim: colsSim, rows_sim: rowsSim, total_sim: colsSim * 0.5 + rowsSim * 0.5 };
}

// TF-IDF cosine similarity (simplified port)
function cosineSimilarity(rows1, rows2) {
  if (!rows1 || !rows2 || rows1.length === 0 || rows2.length === 0) return 0;
  
  // Represent each row set as a bag of words
  const toText = (rows) => rows.map(r => Object.values(r).join(" ")).join(" ").toLowerCase();
  const text1 = toText(rows1);
  const text2 = toText(rows2);
  
  // Build vocabulary
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  const vocab = [...new Set([...words1, ...words2])];
  
  // TF vectors
  const tf = (words, vocab) => vocab.map(w => words.filter(x => x === w).length / words.length);
  const v1 = tf(words1, vocab);
  const v2 = tf(words2, vocab);
  
  // Cosine
  const dot = v1.reduce((s, a, i) => s + a * v2[i], 0);
  const mag1 = Math.sqrt(v1.reduce((s, a) => s + a * a, 0));
  const mag2 = Math.sqrt(v2.reduce((s, a) => s + a * a, 0));
  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (mag1 * mag2);
}

// ─── LLM SQL Generation ───────────────────────────────────────────────────────

async function generateSql(base44, question, pipeline, llm, dbSchema) {
  // Use mini model for evals — much faster, SQL generation doesn't need full reasoning power
  const modelMap = { OpenAI: "gpt_5_mini", Claude: "gpt_5_mini" };
  const model = modelMap[llm] || "gpt_5_mini";

  const prompt = `You are a SQL expert. Using the database schema below, generate a precise SQL SELECT query to answer the user's question.

Database Schema:
${dbSchema}

User Question: ${question}

Rules:
- Return ONLY the SQL query, no explanation, no markdown
- Use only tables/columns that exist in the schema
- Only generate SELECT queries`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    model,
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        sql_query: { type: "string" },
        is_translatable: { type: "boolean", description: "Whether the question can be answered with SQL" }
      }
    }
  });

  return {
    sql: cleanSql(result.sql_query || ""),
    is_translatable: result.is_translatable !== false
  };
}

// ─── Batch helper — run N tasks concurrently ──────────────────────────────────

async function runInBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// ─── Background worker ────────────────────────────────────────────────────────

async function runEvalWork(base44, eval_run_id, test_cases, pipeline, llm, db_schema) {
  // Run test cases in batches of 3 to avoid rate-limit queuing
  const results = await runInBatches(test_cases, 3, async (tc) => {
    const { question, expected_sql, expected_translatable = true, expected_rows = [], expected_cols = [] } = tc;

    const { sql: generatedSql, is_translatable } = await generateSql(base44, question, pipeline, llm, db_schema);

    const sqlValidity = checkSqlValidity(generatedSql);
    const translatableCorrect = is_translatable === expected_translatable;
    const sqlSim = sequenceSimilarity(expected_sql, generatedSql);

    const generatedCols = generatedSql
      ? (generatedSql.match(/SELECT\s+(.*?)\s+FROM/i)?.[1] || "")
          .split(",")
          .map(c => c.trim().split(/\s+as\s+/i).pop().trim().replace(/["`]/g, ""))
          .filter(Boolean)
      : [];

    const rsSim = resultSetSimilarity(expected_rows, [], expected_cols, generatedCols);
    const cosSim = cosineSimilarity(expected_rows, expected_cols.length > 0 ? expected_rows : []);

    return {
      question,
      expected_sql,
      generated_sql: generatedSql,
      is_valid_sql: sqlValidity.isValid,
      is_translatable,
      expected_translatable,
      translatable_correct: translatableCorrect,
      sql_similarity: Math.round(sqlSim * 1000) / 1000,
      result_col_sim: Math.round(rsSim.cols_sim * 1000) / 1000,
      result_row_sim: Math.round(rsSim.rows_sim * 1000) / 1000,
      result_total_sim: Math.round(rsSim.total_sim * 1000) / 1000,
      cosine_sim: Math.round(cosSim * 1000) / 1000,
      explanation: sqlValidity.errMessage || "OK"
    };
  });

  const validSqlCount = results.filter(r => r.is_valid_sql).length;
  const translatableCorrect = results.filter(r => r.translatable_correct).length;
  const avgSqlSim = results.reduce((s, r) => s + r.sql_similarity, 0) / results.length;
  const avgCosSim = results.reduce((s, r) => s + r.cosine_sim, 0) / results.length;
  const overallScore = (
    (validSqlCount / results.length) * 0.3 +
    (translatableCorrect / results.length) * 0.2 +
    avgSqlSim * 0.3 +
    avgCosSim * 0.2
  );

  await base44.asServiceRole.entities.EvalResult.update(eval_run_id, {
    results,
    total_cases: results.length,
    valid_sql_count: validSqlCount,
    translatable_accuracy: Math.round((translatableCorrect / results.length) * 1000) / 1000,
    avg_sql_similarity: Math.round(avgSqlSim * 1000) / 1000,
    avg_cosine_similarity: Math.round(avgCosSim * 1000) / 1000,
    overall_score: Math.round(overallScore * 1000) / 1000,
    status: "completed"
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { eval_run_id, test_cases, pipeline, llm, database, db_schema, run_name } = await req.json();

    if (!test_cases || !Array.isArray(test_cases) || test_cases.length === 0) {
      return Response.json({ error: "No test cases provided" }, { status: 400 });
    }

    // Use EdgeRuntime.waitUntil to run eval in background — return 200 immediately
    // so the HTTP request doesn't time out while waiting for all LLM calls
    const work = runEvalWork(base44, eval_run_id, test_cases, pipeline, llm, db_schema)
      .catch(async () => {
        await base44.asServiceRole.entities.EvalResult.update(eval_run_id, { status: "failed" });
      });

    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(work);
    } else {
      await work; // fallback for local dev
    }

    return Response.json({ success: true, message: "Eval started in background" });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});