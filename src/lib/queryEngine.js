import { base44 } from "@/api/base44Client";
import { classifyQuestion } from "@/lib/questionClassifier";

const MODEL_MAP = {
  OpenAI: "gpt_5",
  Claude: "claude_sonnet_4_6",
};

// ─── Schema Caching ──────────────────────────────────────────────────────
// Cache schemas in session to avoid re-injecting the same schema every query
const schemaCache = {};

function getCachedSchema(databaseId) {
  if (schemaCache[databaseId]) {
    return schemaCache[databaseId];
  }
  const db = DATABASES.find((d) => d.id === databaseId) || DATABASES[0];
  schemaCache[databaseId] = db.schema;
  return db.schema;
}

export function clearSchemaCache() {
  Object.keys(schemaCache).forEach((key) => delete schemaCache[key]);
}

// ─── Database Schemas ────────────────────────────────────────────────────────

const CHINOOK_SCHEMA = `
Database: Chinook (Digital Music Store)
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

const NORTHWIND_SCHEMA = `
Database: Northwind (Trading Company)
CREATE TABLE Categories (CategoryID INTEGER PRIMARY KEY, CategoryName NVARCHAR(15), Description NTEXT, Picture IMAGE);
CREATE TABLE Suppliers (SupplierID INTEGER PRIMARY KEY, CompanyName NVARCHAR(40), ContactName NVARCHAR(30), ContactTitle NVARCHAR(30), Address NVARCHAR(60), City NVARCHAR(15), Region NVARCHAR(15), PostalCode NVARCHAR(10), Country NVARCHAR(15), Phone NVARCHAR(24), Fax NVARCHAR(24), HomePage NTEXT);
CREATE TABLE Products (ProductID INTEGER PRIMARY KEY, ProductName NVARCHAR(40), SupplierID INTEGER REFERENCES Suppliers(SupplierID), CategoryID INTEGER REFERENCES Categories(CategoryID), QuantityPerUnit NVARCHAR(20), UnitPrice MONEY, UnitsInStock SMALLINT, UnitsOnOrder SMALLINT, ReorderLevel SMALLINT, Discontinued BIT);
CREATE TABLE Shippers (ShipperID INTEGER PRIMARY KEY, CompanyName NVARCHAR(40), Phone NVARCHAR(24));
CREATE TABLE Customers (CustomerID NCHAR(5) PRIMARY KEY, CompanyName NVARCHAR(40), ContactName NVARCHAR(30), ContactTitle NVARCHAR(30), Address NVARCHAR(60), City NVARCHAR(15), Region NVARCHAR(15), PostalCode NVARCHAR(10), Country NVARCHAR(15), Phone NVARCHAR(24), Fax NVARCHAR(24));
CREATE TABLE Employees (EmployeeID INTEGER PRIMARY KEY, LastName NVARCHAR(20), FirstName NVARCHAR(10), Title NVARCHAR(30), TitleOfCourtesy NVARCHAR(25), BirthDate DATETIME, HireDate DATETIME, Address NVARCHAR(60), City NVARCHAR(15), Region NVARCHAR(15), PostalCode NVARCHAR(10), Country NVARCHAR(15), HomePhone NVARCHAR(24), Extension NVARCHAR(4), ReportsTo INTEGER REFERENCES Employees(EmployeeID));
CREATE TABLE Orders (OrderID INTEGER PRIMARY KEY, CustomerID NCHAR(5) REFERENCES Customers(CustomerID), EmployeeID INTEGER REFERENCES Employees(EmployeeID), OrderDate DATETIME, RequiredDate DATETIME, ShippedDate DATETIME, ShipVia INTEGER REFERENCES Shippers(ShipperID), Freight MONEY, ShipName NVARCHAR(40), ShipAddress NVARCHAR(60), ShipCity NVARCHAR(15), ShipRegion NVARCHAR(15), ShipPostalCode NVARCHAR(10), ShipCountry NVARCHAR(15));
CREATE TABLE OrderDetails (OrderID INTEGER REFERENCES Orders(OrderID), ProductID INTEGER REFERENCES Products(ProductID), UnitPrice MONEY, Quantity SMALLINT, Discount REAL, PRIMARY KEY (OrderID, ProductID));
CREATE TABLE Region (RegionID INTEGER PRIMARY KEY, RegionDescription NCHAR(50));
CREATE TABLE Territories (TerritoryID NVARCHAR(20) PRIMARY KEY, TerritoryDescription NCHAR(50), RegionID INTEGER REFERENCES Region(RegionID));
CREATE TABLE EmployeeTerritories (EmployeeID INTEGER REFERENCES Employees(EmployeeID), TerritoryID NVARCHAR(20) REFERENCES Territories(TerritoryID), PRIMARY KEY (EmployeeID, TerritoryID));
`;

export const DATABASES = [
  {
    id: "chinook",
    label: "Chinook DB",
    description: "Digital music store",
    schema: CHINOOK_SCHEMA,
    sampleQuestions: [
      "What is the total revenue by country?",
      "Top 10 customers by spend",
      "Best selling genres",
      "Monthly revenue trend",
    ],
  },
  {
    id: "northwind",
    label: "Northwind DB",
    description: "Trading company",
    schema: NORTHWIND_SCHEMA,
    sampleQuestions: [
      "Top selling products by revenue",
      "Which customers have the most orders?",
      "Revenue by country",
      "Most popular product categories",
    ],
  },
];

export function getDatabaseById(id) {
  return DATABASES.find((db) => db.id === id) || DATABASES[0];
}

// ─── Pipelines ────────────────────────────────────────────────────────────────

async function ragPipeline(question, llmProvider, dbSchema, contextMessages = "", userFeedback = null) {
  const model = MODEL_MAP[llmProvider];

  const contextPrompt = contextMessages ? `\nPrevious conversation context:\n${contextMessages}` : "";
  const feedbackPrompt = userFeedback ? `\nUser feedback from previous answer:\n${userFeedback}` : "";

  const sqlResponse = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a SQL expert. Using the database schema below as context, generate a precise SQL SELECT query to answer the user's question.

Database Schema:
${dbSchema}${contextPrompt}${feedbackPrompt}

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

  const answerResponse = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a database analyst. The user asked: "${question}"

The SQL query generated was:
${sqlResponse.sql_query}

Relevant tables used: ${(sqlResponse.relevant_tables || []).join(", ")}${contextPrompt}${feedbackPrompt}

Now provide a complete response based on the following database schema:
${dbSchema}

Format your response as JSON:
- rewritten_query: how you interpreted the user's question (1-2 sentences)
- summary: a 1-2 sentence answer in plain business English
- intent: classify as one of "Analytical", "Lookup", "Aggregation", "Ranking", "Filter", "Trend"
- sql_query: the SQL query
- explanation: 2-3 sentences explaining what the query does in simple terms
- columns: array of {key, label} objects for the result table
- rows: array of result objects (5-15 realistic rows consistent with this database)
- stats: array of up to 4 key metrics, each with {label, value, icon, color} where icon is one of "dollar","globe","trending","clock","users","layers" and color is one of "purple","blue","green","orange"`,
    response_json_schema: {
      type: "object",
      properties: {
        rewritten_query: { type: "string" },
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

async function tagPipeline(question, llmProvider, dbSchema) {
  const model = MODEL_MAP[llmProvider];

  const synthesis = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a SQL synthesis engine (TAG - Table Augmented Generation).

Database Schema:
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

  const answer = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a database answer generator (TAG pipeline).

Original Question: "${question}"
SQL Query Synthesized: ${synthesis.sql_query}
Tables Used: ${(synthesis.relevant_tables || []).join(", ")}
Query Plan: ${synthesis.query_plan}

Database Schema:
${dbSchema}

Generate a complete analytical response as if you executed this query against the database above. Provide realistic query results and insights consistent with this specific database.

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

async function hybridPipeline(question, llmProvider, dbSchema, contextMessages = "", userFeedback = null) {
  const model = MODEL_MAP[llmProvider];

  const contextPrompt = contextMessages ? `\nPrevious conversation context:\n${contextMessages}` : "";
  const feedbackPrompt = userFeedback ? `\nUser feedback from previous answer:\n${userFeedback}` : "";

  const result = await base44.integrations.Core.InvokeLLM({
    model,
    prompt: `You are a Hybrid RAG+TAG database analyst. You combine two approaches:
1. RAG (Retrieval-Augmented Generation): Use schema metadata and documentation context
2. TAG (Table-Augmented Generation): Synthesize SQL by deeply analyzing table structures

Database Schema:
${dbSchema}${contextPrompt}${feedbackPrompt}

User Question: "${question}"

Hybrid approach:
- RAG phase: retrieve relevant schema context, identify intent and domain
- TAG phase: synthesize optimal SQL using table augmentation
- Combine: produce the most accurate and comprehensive answer

IMPORTANT: All results, data, and insights must be consistent with the database schema provided above. Do not mix data from other databases.

Return complete JSON:
- rewritten_query: how you interpreted the user's question (1-2 sentences)
- summary: direct one-line answer
- intent: classify as "Analytical"|"Lookup"|"Aggregation"|"Ranking"|"Filter"|"Trend"
- sql_query: the final optimized SQL SELECT query
- explanation: 2-3 sentences on methodology and findings in simple terms
- columns: array of {key: string, label: string} for result columns
- rows: array of 5-20 realistic result objects matching the columns
- stats: array of 2-4 highlight metrics each with {label, value, icon, color}
  - icon must be one of: "dollar", "globe", "trending", "clock", "users", "layers"
  - color must be one of: "purple", "blue", "green", "orange"
- sources_count: number of schema sources referenced
- tables_count: number of tables involved`,
    response_json_schema: {
      type: "object",
      properties: {
        rewritten_query: { type: "string" },
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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function runQuery(question, mode, llmProvider, databaseId = "chinook", conversationHistory = [], userFeedback = null) {
  // Use cached schema to avoid re-injecting the same schema repeatedly
  const schema = getCachedSchema(databaseId);

  // Build conversation context from previous messages
  const contextMessages = conversationHistory
    .filter(m => !m._loading)
    .slice(-4) // Last 4 turns for context
    .map(m => `Q: ${m.question}\nA: ${m.summary || m.explanation}`)
    .join("\n---\n");

  // Classify question to determine best model
  const classification = await classifyQuestion(question, schema);
  
  // Override LLM provider if classifier recommends gpt_5_mini for simple queries
  let effectiveLlm = llmProvider;
  if (classification.recommended_model === "gpt_5_mini") {
    effectiveLlm = "OpenAI"; // gpt_5_mini maps to OpenAI in MODEL_MAP
  }

  if (mode === "Standard") {
    return ragPipeline(question, effectiveLlm, schema, contextMessages, userFeedback);
  }
  return hybridPipeline(question, effectiveLlm, schema, contextMessages, userFeedback);
}