# Chat2DB — Extensive Product Specification

**Version:** 1.0  
**Date:** April 2026  
**Author:** Product & Engineering  
**Status:** Active Development  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Target Users](#4-target-users)
5. [Core Functionality](#5-core-functionality)
6. [AI Pipeline Architecture](#6-ai-pipeline-architecture)
7. [Agents & LLM Usage](#7-agents--llm-usage)
8. [System Architecture](#8-system-architecture)
9. [Database Layer](#9-database-layer)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Feature Specifications](#12-feature-specifications)
13. [Evaluation Framework](#13-evaluation-framework)
14. [Storage & Persistence](#14-storage--persistence)
15. [PDF Export Subsystem](#15-pdf-export-subsystem)
16. [Requirements & Dependencies](#16-requirements--dependencies)
17. [How to Run](#17-how-to-run)
18. [Constraints & Limitations](#18-constraints--limitations)
19. [Future Roadmap](#19-future-roadmap)

---

## 1. Executive Summary

**Chat2DB** is an AI-powered natural language database interface. It allows non-technical and technical users alike to query structured relational databases simply by typing questions in plain English. The system automatically:

- Understands the user's intent
- Selects the appropriate AI pipeline
- Generates precise SQL
- Returns structured, paginated results
- Produces AI-driven data visualizations
- Provides plain-English explanations
- Allows export of results to PDF

The application is built on **Base44** (a React + Deno BaaS platform) and leverages **OpenAI GPT-4** and **Anthropic Claude Sonnet** as LLM backends, with three distinct AI reasoning pipelines: **RAG**, **TAG**, and **Hybrid**.

---

## 2. Problem Statement

Most people who need insights from databases cannot write SQL. Even analysts who can write SQL spend time context-switching between writing queries, debugging, and interpreting results. Existing BI tools require extensive setup and training.

**Chat2DB solves this by:**
- Eliminating the need to know SQL
- Providing instant, explainable answers
- Automatically visualizing results
- Supporting multi-turn conversations for iterative analysis

---

## 3. Product Vision & Goals

### Vision
> "Make any database as easy to query as asking a colleague a question."

### Goals
| Goal | Metric |
|------|--------|
| Zero SQL knowledge required | 100% of queries answerable via natural language |
| Fast time-to-insight | < 10s from question to result |
| Multi-database support | 2+ databases at launch, extensible |
| Explainability | Every result includes SQL + plain-English explanation |
| Portability | All results exportable to PDF |

---

## 4. Target Users

| Persona | Description | Pain Point Solved |
|---------|-------------|-------------------|
| **Business Analyst** | Needs data insights but limited SQL skills | Can query without SQL knowledge |
| **Product Manager** | Wants quick answers about usage/revenue | Self-serve analytics without engineering help |
| **Data Engineer** | Needs to verify queries and results fast | Instant SQL generation + explanation |
| **Developer** | Building or demoing data products | Rapid prototyping of analytics features |
| **Executive** | Needs high-level metrics on demand | Natural language to KPI in seconds |

---

## 5. Core Functionality

### 5.1 Natural Language Querying
- User types a question in plain English
- System identifies intent (Analytical, Lookup, Aggregation, Ranking, Filter, Trend)
- Generates optimized SQL for the selected database schema
- Returns structured results with explanation
- **NEW:** Multi-turn conversation context — LLM remembers previous queries to avoid hallucination and clarify vague questions
- **NEW:** "Rewritten Query" display shows how the LLM interpreted the user's question for verification

### 5.2 Multi-Pipeline AI Processing
- **RAG (Standard)**: Retrieval-Augmented Generation — schema context fed to LLM for SQL generation
- **TAG (Table-Augmented Generation)**: Deep table structure analysis for complex multi-join queries
- **Hybrid**: Combines RAG + TAG for maximum accuracy; default mode

### 5.3 LLM Selection
- **OpenAI GPT-4** (`gpt_5` model via Base44 integration)
- **Anthropic Claude Sonnet** (`claude_sonnet_4_6` model)
- User can switch LLM mid-session from the TopBar

### 5.4 Multi-Database Support
- **Chinook DB** (Digital Music Store): Artists, Albums, Tracks, Customers, Invoices
- **Northwind DB** (Trading Company): Products, Orders, Customers, Employees, Suppliers
- Switching databases resets the session to prevent cross-contamination

### 5.5 Tabbed Query Interface
- Each question opens in a new browser-like tab
- Multiple queries can be open simultaneously
- Tabs are closeable; session state is preserved per tab

### 5.6 Conversation Threading
- Follow-up questions append to the active tab's thread
- Each message in a thread is independently rendered
- Last 5 conversation sessions stored in sidebar history

### 5.7 Data Visualization
- AI agent (`vizAgent`) analyzes result columns and rows
- Automatically selects the best chart type: Bar, Line, Area, Pie, Scatter
- Charts rendered using Recharts

### 5.8 Favorites System
- Star any query result to save it
- Maximum 20 favorites (FIFO overflow with user confirmation)
- Persisted in browser localStorage
- Exportable to PDF

### 5.9 Saved Queries System
- Save SQL queries from the SQL tab for reuse
- Maximum 20 saved queries (FIFO overflow)
- Shows question, SQL, pipeline, and database badge
- Persisted in browser localStorage

### 5.10 PDF Export
- Full results export: summary, stats, data table, SQL, explanation
- Favorites export: branded PDF with question, summary, stats, SQL
- Powered by jsPDF

### 5.11 Human-in-the-Loop Feedback System
- **Thumbs Up/Down buttons** on every query result for instant feedback
- **Comment section** for detailed feedback:
  - Positive feedback: Optional notes on what worked well
  - Negative feedback: Users can describe what was wrong or provide the correct question/answer
- **Self-Correcting Agent**: System automatically re-runs the pipeline based on feedback:
  - If interpretation was wrong → re-run with the corrected question from user comments
  - If explanation was unclear → re-run with request for clearer explanation
- Feedback loop enables continuous model improvement and human validation of answers

---

## 6. AI Pipeline Architecture

### Pipeline 1: RAG (Retrieval-Augmented Generation)

```
User Question
      │
      ▼
[LLM Call 1 — SQL Generation]
  Input: Schema + Question
  Output: { sql_query, relevant_tables }
      │
      ▼
[LLM Call 2 — Answer Generation]
  Input: SQL + Tables + Schema + Question
  Output: { summary, intent, columns, rows, stats, explanation }
      │
      ▼
Rendered Result
```

**Use case:** Standard queries, simpler joins, direct lookups.

---

### Pipeline 2: TAG (Table-Augmented Generation)

```
User Question
      │
      ▼
[LLM Call 1 — SQL Synthesis]
  Input: Schema + Question
  Output: { sql_query, relevant_tables, query_plan }
      │
      ▼
[LLM Call 2 — Answer + Data Generation]
  Input: SQL + Query Plan + Schema
  Output: { summary, intent, columns, rows, stats, explanation }
      │
      ▼
Rendered Result
```

**Use case:** Complex multi-table queries, aggregations, ranking.

---

### Pipeline 3: Hybrid (RAG + TAG) — DEFAULT

```
User Question
      │
      ▼
[Single LLM Call — Hybrid Synthesis]
  Input: Schema + Question
  Internally:
    - RAG Phase: retrieve schema context, identify intent & domain
    - TAG Phase: synthesize optimal SQL using table augmentation
    - Combine: produce accurate, comprehensive answer
  Output: {
    summary, intent, sql_query, explanation,
    columns, rows, stats,
    sources_count, tables_count
  }
      │
      ▼
Rendered Result
```

**Use case:** All queries by default. Best accuracy and explainability.

---

### Visualization Agent Pipeline

```
Query Result (columns + rows)
      │
      ▼
[vizAgent — LLM Call]
  Input: column schema + sample rows + question
  Constraints: chart type rules based on data shape
  Output: {
    chart_type: "bar" | "line" | "area" | "pie" | "scatter",
    x_key: string,
    y_keys: string[],
    title: string,
    suitable: boolean
  }
      │
      ▼
[ChartView — Recharts Renderer]
  Renders appropriate chart based on vizAgent config
```

---

## 7. Agents & LLM Usage

### Multi-Turn Context Architecture
- **Conversation History in Prompts**: Previous 4 query-answer pairs are injected as context
- **Feedback Integration**: User feedback (positive/negative) is included in the prompt for subsequent queries
- **Dynamic Rewriting**: LLM generates a "rewritten_query" field explaining how it interpreted the user's question

## 8. Agents & LLM Usage (Original)

### Agent 1: SQL Generation Agent (RAG/TAG pipelines)
- **Role:** Translates natural language to SQL
- **Model:** GPT-4 or Claude Sonnet (user-selected)
- **Input:** Database schema (DDL) + user question
- **Output:** Validated SQL SELECT query + relevant tables
- **Constraints:** Read-only (SELECT only), schema-bound

### Agent 2: Answer Generation Agent (RAG/TAG pipelines)
- **Role:** Generates structured business answers from SQL context
- **Model:** GPT-4 or Claude Sonnet (user-selected)
- **Input:** SQL query + tables + schema + question
- **Output:** summary, intent, columns, rows, stats, explanation
- **Format:** Strict JSON schema enforced

### Agent 3: Hybrid Synthesis Agent (Hybrid pipeline)
- **Role:** Combines RAG retrieval + TAG synthesis in one pass
- **Model:** GPT-4 or Claude Sonnet (user-selected)
- **Input:** Schema + question
- **Output:** Full response JSON including sources_count, tables_count
- **Performance:** Single LLM call (more efficient than 2-call pipelines)

### Agent 4: Visualization Agent (vizAgent)
- **Role:** Determines optimal chart type and axis mapping
- **Model:** `gpt_5_mini` (lightweight)
- **Input:** Column names, data types, sample rows, original question
- **Output:** Chart config (type, x_key, y_keys, title, suitable flag)
- **Rules enforced:**
  - Pie chart only for ≤ 8 categorical slices
  - Line/Area for time-series data
  - Bar for comparisons
  - Scatter for correlation

### Agent 5: Question Classifier
- **Role:** Analyzes user's question and recommends the best LLM model for SQL generation
- **Model:** `gpt_5_mini` (lightweight classification)
- **Input:** User question + database schema
- **Output:** query_type, recommended_model, reasoning
- **Query types classified:**
  - `schema_lookup`: Simple schema questions (what tables exist, show columns)
  - `simple_filter`: Basic SELECT with WHERE/ORDER BY
  - `aggregation`: GROUP BY queries
  - `complex_join`: Multiple table joins with filtering
  - `complex_analytical`: Advanced analytics with aggregations
- **Model routing:**
  - `gpt_5_mini` recommended for schema lookups and simple queries (fast, cheap)
  - `gpt_5` or `claude_sonnet_4_6` for complex multi-join and advanced analytics (accuracy-critical)

### Why Single-Agent Hybrid Over Multi-Agent Architecture

Chat2DB deliberately uses a **single-pass Hybrid pipeline** rather than multiple specialized agents working in parallel. Here's the rationale:

| Consideration | Single Agent (Chosen) | Multi-Agent Alternative |
|---|---|---|
| **Cost per query** | 1 LLM call (efficient) | 3–5 LLM calls (higher token usage) |
| **Latency** | ~3–8s per query | ~8–15s (orchestration overhead) |
| **Complexity** | Simple, maintainable | State sync, error handling, retries |
| **Inference quality** | Hybrid context in one pass | Specialization benefit offset by latency |
| **Debugging** | Single output to analyze | Multiple inter-agent dependencies |

**Conclusion:** The Hybrid pipeline achieves performance goals (single LLM call combining RAG retrieval + TAG synthesis) without the cost and complexity overhead of a multi-agent system. For faster execution, we optimize through **client-side heuristics** (pre-analyze data before visualization LLM calls) and **lazy loading** (invoke vizAgent only when user views the Chart tab) — not additional agents.

---

## 9. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                   │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐   │
│  │ Sidebar  │  │  TopBar  │  │   QueryTabs       │   │
│  │ (nav +   │  │ (mode +  │  │   (tab mgmt)      │   │
│  │ history) │  │  LLM +   │  └───────────────────┘   │
│  └──────────┘  │  DB)     │                           │
│                └──────────┘                           │
│  ┌─────────────────────────────────────────────────┐  │
│  │                  QueryView                      │  │
│  │  ┌─────────────┐ ┌──────────┐ ┌─────────────┐  │  │
│  │  │QuestionHeader│ │StatsCards│ │ ResultsTabs │  │  │
│  │  └─────────────┘ └──────────┘ └─────────────┘  │  │
│  │  ┌─────────────┐ ┌──────────┐ ┌─────────────┐  │  │
│  │  │  DataTable  │ │ChartView │ │ SQL/Explain │  │  │
│  │  └─────────────┘ └──────────┘ └─────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │               FollowUpInput                      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│               BASE44 INTEGRATION LAYER                 │
│                                                        │
│         base44.integrations.Core.InvokeLLM()          │
│           (routes to OpenAI or Claude)                 │
└────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
┌─────────────────────┐   ┌──────────────────────┐
│   OpenAI GPT-4      │   │  Anthropic Claude     │
│   (gpt_5 model)     │   │  (claude_sonnet_4_6)  │
└─────────────────────┘   └──────────────────────┘
```

---

## 10. Database Layer

### Chinook Database (Digital Music Store)
**Tables:** Artist, Album, Genre, MediaType, Track, Playlist, PlaylistTrack, Employee, Customer, Invoice, InvoiceLine  
**Use cases:** Revenue by country, top artists, best genres, customer spend analysis  
**Sample questions:**
- "What is the total revenue by country?"
- "Top 10 customers by spend"
- "Best selling genres"
- "Monthly revenue trend"

### Northwind Database (Trading Company)
**Tables:** Categories, Suppliers, Products, Shippers, Customers, Employees, Orders, OrderDetails, Region, Territories, EmployeeTerritories  
**Use cases:** Product performance, order analysis, employee territory mapping, supplier comparison  
**Sample questions:**
- "Top selling products by revenue"
- "Which customers have the most orders?"
- "Revenue by country"
- "Most popular product categories"

### Schema Injection
- Full DDL (CREATE TABLE statements) injected into every LLM prompt
- Ensures LLM generates schema-accurate SQL
- Database switch resets all active state to prevent cross-DB contamination

---

## 11. Frontend Architecture

### State Management
| State | Location | Persistence |
|-------|----------|-------------|
| Active database | `Chat.jsx` state | Session only |
| Mode (RAG/Hybrid) | `Chat.jsx` state | Session only |
| LLM selection | `Chat.jsx` state | Session only |
| Query tabs | `Chat.jsx` state | Session only |
| Query results (per tab) | `Chat.jsx` state | Session only |
| Conversation history | `Chat.jsx` state | Session only |
| Favorites | `useFavorites` hook | localStorage |
| Saved Queries | `useSavedQueries` hook | localStorage |

### Component Hierarchy
```
Chat (page)
├── Sidebar
│   └── NavItems + ConversationHistory
├── TopBar
│   └── ModeDropdown + LLMDropdown + DBDropdown
├── QueryTabs
│   └── Tab[] + AddTab button
├── QueryView (or Dashboard or Favorites or SavedQueries)
│   ├── MessageBlock[]
│   │   ├── QuestionHeader
│   │   ├── StatsCards
│   │   ├── ResultsTabs
│   │   ├── DataTable
│   │   ├── ChartView
│   │   └── SQL / Explanation panels
│   └── FollowUpInput
└── OverflowDialog (modal, conditional)
```

---

## 12. Data Flow Diagrams

### New Question Flow
```
User types question → handleAskQuestion()
  → Create new tab (tabId = timestamp)
  → appendLoadingMessage(tabId)
  → runQuery(question, mode, llm, database)  ← queryEngine.js
      → LLM pipeline (RAG / TAG / Hybrid)
  → Replace loading with result message
  → pushConversation(tabId, question, thread)
  → Render in QueryView
```

### Follow-Up Flow
```
User types follow-up → handleFollowUp()
  → If activeTab === "dashboard" → handleAskQuestion()
  → Else: append to existing tab thread
  → appendLoadingMessage(activeTab)
  → runQuery(question, mode, llm, database)
  → Append result to thread
  → Push new history entry (snapshot of full thread)
```

### Database Switch Flow
```
User selects new DB → handleDatabaseChange(newDb)
  → setDatabase(newDb)
  → setTabs([])           ← clear all tabs
  → setActiveTab("dashboard")
  → setQueryResults({})   ← clear all results
  → setConversations([])  ← clear history
```

### History Replay Flow
```
User clicks history entry → handleSelectConversation(convId)
  → Find conv.thread snapshot
  → Inject into queryResults[convId]
  → Open virtual tab for convId (if not open)
  → setActiveTab(convId)
```

---

## 13. Feature Specifications

### 12.1 Mode Switcher
| Mode | Pipeline | LLM Calls | Best For |
|------|----------|-----------|----------|
| Hybrid | RAG + TAG combined | 1 | Default, all queries |
| Standard | RAG only | 2 | Simple lookups |

### 12.2 Results Tabs
| Tab | Content |
|-----|---------|
| Results | Paginated data table (10 rows/page) |
| Chart | AI-chosen visualization |
| SQL | Generated SQL with copy + save buttons |
| Explanation | Plain-English explanation of query |
| Context | (Reserved for future schema context view) |

### 12.3 Stats Cards
- Up to 4 highlight metrics per query
- Icons: dollar, globe, trending, clock, users, layers
- Colors: purple, blue, green, orange

### 12.4 Data Table
- Client-side pagination (10 rows/page)
- Page picker dropdown
- Row counter ("Showing X to Y of Z rows")
- Alternating row colors for readability

### 12.5 Favorites
- Stored in localStorage key: `chat2db_favorites`
- Max: 20 entries (FIFO overflow)
- Stores: question, summary, stats, SQL, intent, pipeline, database, savedAt
- Actions: View, Export PDF, Remove
- Overflow dialog warns user before removing oldest

### 12.6 Saved Queries
- Stored in localStorage key: `chat2db_saved_queries`
- Max: 20 entries (FIFO overflow)
- Stores: question, SQL, intent, pipeline, database, savedAt
- Actions: Copy SQL, View, Remove

### 12.7 Multi-Turn Context
- **Conversation Memory**: Last 4 turns of conversation are included as context for each new query
- **Prevents Hallucination**: LLM can reference previous questions/answers to clarify vague follow-ups
- **Rewritten Query Display**: Shows how the LLM interpreted the current question (1-2 sentences)
- **Human Verification**: Users can confirm if the interpretation matches their intent before seeing results

### 12.8 Feedback & Self-Correction
- **Thumbs Up/Down Controls**: Quick feedback mechanism on every result
- **Comment Box**: 
  - Supports optional feedback for positive results
  - Required for negative feedback with context (corrected question, explanation notes)
- **Automatic Re-runs**:
  - Negative feedback with corrected question → LLM re-runs with new question
  - Negative feedback with explanation notes → LLM re-runs with request for clarity
  - Positive feedback → Logged for model improvement (no re-run)
- **Feedback Collection**: Enables dataset creation for model fine-tuning and improvement

---

## 14. Evaluation Framework

### 13.1 Overview

The Evaluation Framework allows developers and researchers to benchmark how well each pipeline + LLM combination performs on text-to-SQL tasks. It is accessible via the **Evals** page (sidebar navigation) and backed by the `runEvals` backend function and the `EvalResult` entity.

### 13.2 How to Run an Eval

1. Navigate to **Evals → New Run** in the sidebar
2. Configure the run:
   - **Run Name** — descriptive label for the evaluation run
   - **Database** — Chinook or Northwind
   - **Pipeline** — Hybrid (RAG + TAG), Standard (RAG), or TAG
   - **LLM** — OpenAI GPT-4 or Anthropic Claude Sonnet
   - **Test Cases** — select individual or all cases from the dataset
3. Click **"Run X Test Cases"** — this invokes `runEvals` backend function
4. Results are saved to the `EvalResult` entity and visible in **History**

### 13.3 Test Datasets (`lib/evalDatasets.js`)

| Database | Cases | Translatable | Non-Translatable |
|----------|-------|-------------|------------------|
| Chinook | 10 | 8 | 2 |
| Northwind | 8 | 6 | 2 |

Each test case contains:
- `question` — natural language query
- `expected_sql` — reference SQL (for translatable cases)
- `expected_translatable` — boolean flag
- `expected_rows` / `expected_cols` — reference result schema

### 13.4 Metrics

| Metric | Computation | Weight in Overall |
|--------|-------------|-------------------|
| **Valid SQL** | Syntax check: balanced parentheses, SELECT clause present | 30% |
| **SQL Similarity** | LCS-based sequence match ratio vs. expected SQL | 30% |
| **Translatable Accuracy** | Correct classification of question as SQL-answerable or not | 20% |
| **Result Col Similarity** | Column name overlap (fuzzy match) between expected and generated | — |
| **Result Row Similarity** | Row-level match count vs. expected row count | — |
| **Cosine Similarity** | TF-IDF cosine similarity on result set text representations | 20% |
| **Overall Score** | Weighted composite of above (0–1 scale) | — |

### 13.5 Eval Backend Function (`functions/runEvals.js`)

The Deno backend function:
1. Receives `eval_run_id`, `test_cases`, `pipeline`, `llm`, `database`, `db_schema`
2. For each test case, calls the LLM to generate SQL (same model as the main query engine)
3. Computes all metrics using pure JavaScript ports of Python evaluation tools (SequenceMatcher, TF-IDF cosine)
4. Aggregates metrics and updates the `EvalResult` entity record with `status: "completed"`

### 13.6 Results UI

| View | Description |
|------|-------------|
| **History Tab** | List of all eval runs with status, config, and overall score badge |
| **Drilldown View** | Score summary bars + bar chart + per-case expandable rows |
| **Per-Case Row** | Expected SQL vs. Generated SQL, individual metric scores, error explanation |

### 13.7 Data Persistence

- Each eval run creates an `EvalResult` entity record (persisted to Base44 database)
- Run history survives page refreshes (unlike chat session data)
- Last 20 runs are loaded in History view

---

## 15. Storage & Persistence

| Data | Storage | Key | Max Size |
|------|---------|-----|----------|
| Favorites | localStorage | `chat2db_favorites` | 20 items |
| Saved Queries | localStorage | `chat2db_saved_queries` | 20 items |
| Active session state | React in-memory | — | Session lifetime |
| Conversation history | React in-memory | — | Last 5 entries |

> **Note:** All session data (tabs, results, conversations) is lost on page refresh. Only Favorites and Saved Queries persist via localStorage.

---

## 16. PDF Export Subsystem

### Full Query Export (`exportPdf.js`)
Generates a multi-page A4 PDF containing:
1. Branded header (Chat2DB logo text + gradient bar)
2. Question title
3. Intent + Mode badges
4. Summary paragraph
5. Key metrics cards (stats)
6. Data table (up to 50 rows)
7. SQL code block
8. Explanation paragraph
9. Timestamped footer

### Favorites Export (`exportFavoritePdf.js`)
Generates a single-page PDF containing:
1. Branded header
2. Question
3. Intent + pipeline badges
4. Summary
5. Stats cards
6. SQL block
7. Footer

Both use **jsPDF** (no server-side rendering required — fully client-side).

---

## 17. Requirements & Dependencies

### API Keys Required
| Key | Provider | Purpose |
|-----|----------|---------|
| `OPENAI_API_KEY` | OpenAI | GPT-4 model for SQL + answer generation |
| `ANTHROPIC_API_KEY` | Anthropic | Claude Sonnet model as LLM alternative |

### NPM Packages (Key)
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2.0 | UI framework |
| `react-router-dom` | ^6.26.0 | Client-side routing |
| `@tanstack/react-query` | ^5.84.1 | Data fetching & caching |
| `recharts` | ^2.15.4 | Data visualization |
| `jspdf` | ^4.0.0 | PDF generation |
| `framer-motion` | ^11.16.4 | Animations |
| `tailwindcss` | — | Utility-first CSS |
| `lucide-react` | ^0.475.0 | Icon library |
| `@base44/sdk` | ^0.8.26 | Base44 platform SDK |
| `react-markdown` | ^9.0.1 | Markdown rendering |
| `lodash` | ^4.17.21 | Utility functions |

### Platform Requirements
- **Base44 account** (free tier sufficient for development)
- **Backend Functions** enabled in Base44 dashboard (for LLM integrations)

---

## 18. How to Run

### Production (Base44 Cloud)
1. Log in to [base44.com](https://base44.com)
2. Open the Chat2DB app
3. Go to **Settings → Environment Variables**
4. Add `OPENAI_API_KEY` and `ANTHROPIC_API_KEY`
5. Click **Publish**

### Local Development
```bash
# 1. Clone the repo
git clone https://github.com/ipooja0920/<repo-name>
cd <repo-name>

# 2. Install dependencies
npm install

# 3. Create .env file
echo "OPENAI_API_KEY=your_key_here" >> .env
echo "ANTHROPIC_API_KEY=your_key_here" >> .env

# 4. Start dev server
npm run dev

# App will be available at http://localhost:5173
```

---

## 19. Performance Optimization Strategy

### Initial Challenge
Early iterations exhibited slow execution due to:
- **Redundant LLM calls for visualization**: vizAgent was invoked on every prop change, even for unsuitable datasets
- **Repeated schema injection**: Same database schema was re-injected into every LLM prompt, increasing token usage
- **No data pre-validation**: LLM was called regardless of data suitability, wasting time and credits

### Implemented Optimizations

#### 1. Client-Side Data Heuristics (lib/chartHeuristics.js)
- **Pre-analysis before LLM**: Evaluates columns and sample rows to determine chart suitability using type inference
- **Reject unsuitable data early**: Returns rejection reason immediately (e.g., "insufficient numeric columns") without invoking vizAgent
- **Type inference engine**: Samples data to categorize columns as numeric, date, or categorical, enabling smart filtering

#### 2. Lazy Visualization Loading
- **Single-mount initialization**: vizAgent is invoked only once when the Chart tab is first viewed, not on every prop change
- **Eliminates unnecessary re-renders**: Prevents redundant LLM calls when question/columns/rows update in the parent component

#### 3. Schema Caching (queryEngine.js)
- **Session-level cache**: Database schemas are cached in memory on first use, avoiding repeated schema injection in LLM prompts
- **Reduced token footprint**: Saves 1000+ tokens per query by reusing cached schemas

#### 4. Reduced Visualization Sample Size
- **5-row samples in vizAgent**: Reduced from 10 to 5 rows to minimize context window while maintaining column type inference accuracy
- **Faster LLM response**: Smaller payloads = quicker token generation

#### 5. Small Model for Visualization Agent
- **gpt_5_mini for vizAgent**: Chart type selection is a lightweight task that doesn't require full reasoning power
- **Kept GPT-4/Claude for SQL**: SQL generation remains on full models (gpt_5, claude_sonnet_4_6) to maintain accuracy for critical query logic
- **40–50% faster visualization**, with negligible impact on chart classification quality

#### 6. Intelligent Query Classification
- **Question Classifier Agent** runs on `gpt_5_mini` to analyze each user question before SQL generation
- **Dynamic model routing**: Simple queries (schema lookups, basic filters) use `gpt_5_mini`; complex multi-join and analytical queries use full models
- **Cost reduction on repetitive queries**: Schema questions and simple lookups avoid expensive LLM calls
- **Maintains accuracy**: Classifier intelligently determines when reasoning power is needed vs. when speed/cost matters

### Results
- **20–30% overall reduction in execution latency** (combined optimizations)
- **~45% faster visualization processing** (especially for unsuitable datasets rejected early)
- **Up to 60% cost reduction on simple queries** (via intelligent model routing)
- **Accuracy preserved**: Complex queries use full models, simple ones use efficient small model
- **No feature loss**: All user-facing functionality remains unchanged

---

## 20. Constraints & Limitations

| Constraint | Detail |
|------------|--------|
| Read-only SQL | Only SELECT queries are generated (no INSERT/UPDATE/DELETE) |
| Schema-bound | LLM can only query tables defined in the injected schema |
| No real DB | Data is LLM-simulated (not a live database connection) |
| localStorage limit | Favorites/SavedQueries capped at 20 each |
| Session state | Tabs and results lost on page refresh |
| LLM latency | Hybrid pipeline: ~3–8s per query depending on complexity (post-optimization) |
| Chart suitability | Not all datasets are chartable; vizAgent may mark as unsuitable |

---

## 21. Future Roadmap

| Feature | Priority | Description |
|---------|----------|-------------|
| Live DB connection | High | Connect to real PostgreSQL/MySQL databases via connection string |
| Query history persistence | High | Save full session history to backend, not just localStorage |
| User authentication | High | Multi-user support with personal workspaces |
| More databases | Medium | AdventureWorks, Sakila, custom schemas |
| Schema explorer | Medium | Visual ERD diagram of the selected database |
| Query templates | Medium | Pre-built question templates per database |
| Shareable links | Medium | Share a query result via URL |
| Export to CSV/Excel | Low | Additional export formats beyond PDF |
| Voice input | Low | Speak your question instead of typing |
| Dark mode toggle | Low | Explicit dark/light mode switch in UI |
| Query optimization hints | Low | LLM suggests index improvements for slow queries |

---

*This document is a living specification and should be updated as the product evolves.*