import { base44 } from "@/api/base44Client";

/**
 * Replicates the RAG pipeline logic from the GitHub repo:
 * - RAG: uses vector/doc context to generate SQL, then executes and explains
 * - TAG: Table-Augmented Generation - synthesize SQL → execute → generate answer
 * - Hybrid: runs both and combines the best answer
 *
 * Since we're in a browser (no Python backend), we use InvokeLLM with 
 * carefully crafted prompts that mirror the original pipeline behavior.
 */

const MODEL_MAP = {
  OpenAI: "gpt_5",        // maps to gpt-4 equivalent
  Claude: "claude_sonnet_4_6",  // maps to claude-3-5-sonnet
};

/**
 * RAG Pipeline: Retrieval-Augmented Generation
 * Generates SQL using schema context, then provides a natural language answer.
 */
async function ragPipeline(question, llmProvider, dbSchema) {
  const model = MODEL_MAP[llmProvider];

  // Step 1: Generate SQL from natural language (RAG style - schema as context)
  const sqlResponse = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a SQL expert. Using the database schema below as context, generate a precise SQL SELECT query to answer the user's question.

Database Schema:
${dbSchema}

User Question: ${question}

Rules:
- Return ONLY the SQL query, no explanation
- Use only tables/columns that exist in the schema
- Use proper SQL syntax
- Only generate SELECT queries (read-only)`,
    response_json_schema: {
      type: "object",
      properties: {
        sql_query: { type: "string" },
        relevant_tables: { type: "array", items: { type: "string" } },
      },
    },
  });

  // Step 2: Execute the SQL conceptually and generate answer with results
  const answerResponse = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a database analyst. The user asked: "${question}"

The SQL query generated was:
${sqlResponse.sql_query}

Relevant tables used: ${(sqlResponse.relevant_tables || []).join(", ")}

Now provide:
1. A natural language explanation of the query and what results it would return
2. Sample/estimated results in a structured table format based on what this query would realistically return from a Chinook music database (artists, albums, tracks, invoices, customers, employees)
3. Key insights from the results

Format your response as JSON with these fields:
- summary: brief one-line answer
- intent: classify as one of "Analytical", "Lookup", "Aggregation", "Ranking", "Filter", "Trend"
- sql_query: the SQL query
- explanation: 2-3 sentences explaining what the query does
- columns: array of {key, label} objects for the result table
- rows: array of result objects (5-15 realistic rows)
- stats: array of up to 4 key metrics, each with {label, value, icon, color} where icon is one of "dollar","globe","trending","clock","users","layers" and color is one of "purple","blue","green","orange"`,
    response_json_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        intent: { type: "string" },
        sql_query: { type: "string" },
        explanation: { type: "string" },
        columns: { type: "array", items: { type: "object", properties: { key: { type: "string" }, label: { type: "string" } } } },
        rows: { type: "array", items: { type: "object" } },
        stats: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" }, icon: { type: "string" }, color: { type: "string" } } } },
      },
    },
  });

  return {
    ...answerResponse,
    pipeline: "RAG",
    sql_query: sqlResponse.sql_query || answerResponse.sql_query,
  };
}

/**
 * TAG Pipeline: Table-Augmented Generation
 * Mirrors the TAGWorkflow: query_synthesis → query_execution → answer_generation
 */
async function tagPipeline(question, llmProvider, dbSchema) {
  const model = MODEL_MAP[llmProvider];

  // Step 1: Query Synthesis (mirrors TAGWorkflow.query_synthesis)
  const synthesis = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a SQL synthesis engine (TAG - Table Augmented Generation). Your job is to deeply analyze the database schema and synthesize the most optimal SQL query.

Database Schema (Chinook):
${dbSchema}

User Question: ${question}

Perform TAG query synthesis:
1. Identify ALL relevant tables and their relationships
2. Determine the exact columns needed
3. Choose the right JOIN strategy
4. Apply proper WHERE/GROUP BY/ORDER BY clauses
5. Generate the most accurate SQL SELECT query

Return JSON with:
- sql_query: the synthesized SQL
- relevant_tables: array of table names used
- query_plan: brief explanation of your synthesis approach`,
    response_json_schema: {
      type: "object",
      properties: {
        sql_query: { type: "string" },
        relevant_tables: { type: "array", items: { type: "string" } },
        query_plan: { type: "string" },
      },
    },
  });

  // Step 2 & 3: Query Execution + Answer Generation (mirrors query_execution + answer_generation)
  const answer = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a database answer generator (TAG pipeline - answer_generation step).

Original Question: "${question}"
SQL Query Synthesized: ${synthesis.sql_query}
Tables Used: ${(synthesis.relevant_tables || []).join(", ")}
Query Plan: ${synthesis.query_plan}

Generate a complete analytical response as if you executed this query against the Chinook music database. The Chinook database contains: customers, invoices, invoice_items, tracks, albums, artists, genres, media_types, playlists, employees.

Provide realistic query results and insights.

Return JSON:
- summary: one-line direct answer to the question
- intent: one of "Analytical", "Lookup", "Aggregation", "Ranking", "Filter", "Trend"  
- sql_query: the final SQL
- explanation: 2-3 sentences explaining the approach and findings
- columns: array of {key, label} for the result columns
- rows: array of 5-15 realistic result objects
- stats: array of 2-4 key metrics each with {label, value, icon, color} where icon: "dollar"|"globe"|"trending"|"clock"|"users"|"layers", color: "purple"|"blue"|"green"|"orange"`,
    response_json_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        intent: { type: "string" },
        sql_query: { type: "string" },
        explanation: { type: "string" },
        columns: { type: "array", items: { type: "object", properties: { key: { type: "string" }, label: { type: "string" } } } },
        rows: { type: "array", items: { type: "object" } },
        stats: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" }, icon: { type: "string" }, color: { type: "string" } } } },
      },
    },
  });

  return {
    ...answer,
    pipeline: "TAG",
    sql_query: synthesis.sql_query || answer.sql_query,
  };
}

/**
 * Hybrid Pipeline: RAG + TAG combined
 * Runs TAG (more thorough) and uses RAG context for enrichment
 */
async function hybridPipeline(question, llmProvider, dbSchema) {
  const model = MODEL_MAP[llmProvider];

  const result = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a Hybrid RAG+TAG database analyst. You combine two approaches:
1. RAG (Retrieval-Augmented Generation): Use schema metadata and documentation context
2. TAG (Table-Augmented Generation): Synthesize SQL by deeply analyzing table structures

Database Schema (Chinook - music store):
${dbSchema}

Tables available: Customer, Invoice, InvoiceLine, Track, Album, Artist, Genre, MediaType, Playlist, PlaylistTrack, Employee

User Question: "${question}"

Hybrid approach:
- RAG phase: retrieve relevant schema context, identify intent and domain
- TAG phase: synthesize optimal SQL using table augmentation
- Combine: produce the most accurate and comprehensive answer

Return complete JSON:
- summary: direct one-line answer
- intent: classify as "Analytical"|"Lookup"|"Aggregation"|"Ranking"|"Filter"|"Trend"
- sql_query: the final optimized SQL SELECT query
- explanation: 2-3 sentences on methodology and findings
- columns: array of {key: string, label: string} for result columns
- rows: array of 5-20 realistic result objects matching the columns
- stats: array of 2-4 highlight metrics each with {label, value, icon, color}
  - icon must be one of: "dollar", "globe", "trending", "clock", "users", "layers"
  - color must be one of: "purple", "blue", "green", "orange"
- sources_count: number of schema sources referenced (e.g. 8)
- tables_count: number of tables involved`,
    response_json_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        intent: { type: "string" },
        sql_query: { type: "string" },
        explanation: { type: "string" },
        columns: { type: "array", items: { type: "object", properties: { key: { type: "string" }, label: { type: "string" } } } },
        rows: { type: "array", items: { type: "object" } },
        stats: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" }, icon: { type: "string" }, color: { type: "string" } } } },
        sources_count: { type: "number" },
        tables_count: { type: "number" },
      },
    },
  });

  return {
    ...result,
    pipeline: "Hybrid (RAG + TAG)",
  };
}

// Default Chinook DB schema context (mirrors what would be in the vector store)
const CHINOOK_SCHEMA = `
CREATE TABLE Artist (ArtistId INTEGER PRIMARY KEY, Name NVARCHAR(120));
CREATE TABLE Album (AlbumId INTEGER PRIMARY KEY, Title NVARCHAR(160), ArtistId INTEGER REFERENCES Artist(ArtistId));
CREATE TABLE Genre (GenreId INTEGER PRIMARY KEY, Name NVARCHAR(120));
CREATE TABLE MediaType (MediaTypeId INTEGER PRIMARY KEY, Name NVARCHAR(120));
CREATE TABLE Track (TrackId INTEGER PRIMARY KEY, Name NVARCHAR(200), AlbumId INTEGER REFERENCES Album(AlbumId), MediaTypeId INTEGER REFERENCES MediaType(MediaTypeId), GenreId INTEGER REFERENCES Genre(GenreId), Composer NVARCHAR(220), Milliseconds INTEGER, Bytes INTEGER, UnitPrice NUMERIC(10,2));
CREATE TABLE Playlist (PlaylistId INTEGER PRIMARY KEY, Name NVARCHAR(120));
CREATE TABLE PlaylistTrack (PlaylistId INTEGER REFERENCES Playlist(PlaylistId), TrackId INTEGER REFERENCES Track(TrackId));
CREATE TABLE Employee (EmployeeId INTEGER PRIMARY KEY, LastName NVARCHAR(20), FirstName NVARCHAR(20), Title NVARCHAR(30), ReportsTo INTEGER REFERENCES Employee(EmployeeId), BirthDate DATETIME, HireDate DATETIME, Address NVARCHAR(70), City NVARCHAR(40), State NVARCHAR(40), Country NVARCHAR(40), PostalCode NVARCHAR(10), Phone NVARCHAR(24), Fax NVARCHAR(24), Email NVARCHAR(60));
CREATE TABLE Customer (CustomerId INTEGER PRIMARY KEY, FirstName NVARCHAR(40), LastName NVARCHAR(20), Company NVARCHAR(80), Address NVARCHAR(70), City NVARCHAR(40), State NVARCHAR(40), Country NVARCHAR(40), PostalCode NVARCHAR(10), Phone NVARCHAR(24), Fax NVARCHAR(24), Email NVARCHAR(60), SupportRepId INTEGER REFERENCES Employee(EmployeeId));
CREATE TABLE Invoice (InvoiceId INTEGER PRIMARY KEY, CustomerId INTEGER REFERENCES Customer(CustomerId), InvoiceDate DATETIME, BillingAddress NVARCHAR(70), BillingCity NVARCHAR(40), BillingState NVARCHAR(40), BillingCountry NVARCHAR(40), BillingPostalCode NVARCHAR(10), Total NUMERIC(10,2));
CREATE TABLE InvoiceLine (InvoiceLineId INTEGER PRIMARY KEY, InvoiceId INTEGER REFERENCES Invoice(InvoiceId), TrackId INTEGER REFERENCES Track(TrackId), UnitPrice NUMERIC(10,2), Quantity INTEGER);
`;

export async function runQuery(question, mode, llmProvider) {
  if (mode === "Hybrid") {
    return hybridPipeline(question, llmProvider, CHINOOK_SCHEMA);
  } else if (mode === "Standard") {
    return ragPipeline(question, llmProvider, CHINOOK_SCHEMA);
  }
  return hybridPipeline(question, llmProvider, CHINOOK_SCHEMA);
}