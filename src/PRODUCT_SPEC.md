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
13. [Storage & Persistence](#13-storage--persistence)
14. [PDF Export Subsystem](#14-pdf-export-subsystem)
15. [Requirements & Dependencies](#15-requirements--dependencies)
16. [How to Run](#16-how-to-run)
17. [Constraints & Limitations](#17-constraints--limitations)
18. [Future Roadmap](#18-future-roadmap)

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
- **Model:** Base44 default LLM (lightweight)
- **Input:** Column names, data types, sample rows, original question
- **Output:** Chart config (type, x_key, y_keys, title, suitable flag)
- **Rules enforced:**
  - Pie chart only for ≤ 8 categorical slices
  - Line/Area for time-series data
  - Bar for comparisons
  - Scatter for correlation

---

## 8. System Architecture

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

## 9. Database Layer

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

## 10. Frontend Architecture

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

## 11. Data Flow Diagrams

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

## 12. Feature Specifications

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

---

## 13. Storage & Persistence

| Data | Storage | Key | Max Size |
|------|---------|-----|----------|
| Favorites | localStorage | `chat2db_favorites` | 20 items |
| Saved Queries | localStorage | `chat2db_saved_queries` | 20 items |
| Active session state | React in-memory | — | Session lifetime |
| Conversation history | React in-memory | — | Last 5 entries |

> **Note:** All session data (tabs, results, conversations) is lost on page refresh. Only Favorites and Saved Queries persist via localStorage.

---

## 14. PDF Export Subsystem

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

## 15. Requirements & Dependencies

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

## 16. How to Run

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

## 17. Constraints & Limitations

| Constraint | Detail |
|------------|--------|
| Read-only SQL | Only SELECT queries are generated (no INSERT/UPDATE/DELETE) |
| Schema-bound | LLM can only query tables defined in the injected schema |
| No real DB | Data is LLM-simulated (not a live database connection) |
| localStorage limit | Favorites/SavedQueries capped at 20 each |
| Session state | Tabs and results lost on page refresh |
| LLM latency | Hybrid pipeline: ~3–8s per query depending on complexity |
| Chart suitability | Not all datasets are chartable; vizAgent may mark as unsuitable |

---

## 18. Future Roadmap

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