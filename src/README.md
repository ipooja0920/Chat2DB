# Chat2DB — AI-Powered SQL Analyst

> Ask questions in plain English. Get SQL, results, charts, and insights instantly.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Variables / Secrets](#environment-variables--secrets)
- [How to Run](#how-to-run)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)

---

## Overview

Chat2DB is a natural language database interface powered by AI. Users type questions in plain English, and the system automatically generates SQL, executes it against a selected database schema, returns structured results, generates charts, and provides plain-English explanations — all in a modern chat-like UI.

---

## Prerequisites

Before running this app, make sure you have:

- A [Base44](https://base44.com) account (the platform this app is built on)
- An **OpenAI API Key** (for GPT-based pipelines)
- An **Anthropic API Key** (for Claude-based pipelines)
- Node.js 18+ (if running locally via Base44 CLI)
- npm or yarn

---

## Environment Variables / Secrets

Set the following secrets in your Base44 dashboard under **Settings → Environment Variables**:

| Secret Name         | Description                              | Required |
|---------------------|------------------------------------------|----------|
| `OPENAI_API_KEY`    | OpenAI API key for GPT-4 model access    | ✅ Yes   |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude model access | ✅ Yes  |

---

## How to Run

### On Base44 Platform (Recommended)

1. Go to [base44.com](https://base44.com) and open your app
2. The app runs directly in the Base44 cloud environment
3. Set the required secrets in **Dashboard → Settings → Environment Variables**
4. Hit **Publish** to deploy

### Local Development (via Base44 CLI)

```bash
# Install Base44 CLI
npm install -g @base44/cli

# Clone the synced GitHub repo
git clone https://github.com/ipooja0920/<your-repo-name>
cd <your-repo-name>

# Install dependencies
npm install

# Set environment variables in a .env file
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Start the dev server
npm run dev
```

---

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | React 18, Tailwind CSS, shadcn/ui       |
| Routing      | React Router DOM v6                     |
| State        | React hooks, TanStack React Query       |
| Charts       | Recharts                                |
| PDF Export   | jsPDF                                   |
| AI / LLM     | OpenAI GPT-4, Anthropic Claude Sonnet   |
| Backend      | Base44 (BaaS — serverless Deno functions) |
| Animations   | Framer Motion                           |
| Icons        | Lucide React                            |

---

## Project Structure

```
/
├── pages/
│   ├── Chat.jsx              # Main chat page (app shell)
│   ├── Favorites.jsx         # Saved favorite queries
│   └── SavedQueries.jsx      # Saved SQL queries
├── components/
│   └── chat/
│       ├── Sidebar.jsx       # Navigation & conversation history
│       ├── TopBar.jsx        # Mode, LLM, DB switchers
│       ├── QueryTabs.jsx     # Browser-like query tabs
│       ├── QueryView.jsx     # Result display (multi-message thread)
│       ├── FollowUpInput.jsx # Chat input box
│       ├── QuestionHeader.jsx
│       ├── StatsCards.jsx
│       ├── ResultsTabs.jsx
│       ├── DataTable.jsx
│       ├── ChartView.jsx
│       └── OverflowDialog.jsx
├── lib/
│   ├── queryEngine.js        # Core AI pipeline logic (RAG, TAG, Hybrid)
│   ├── vizAgent.js           # Chart type recommendation agent
│   ├── exportPdf.js          # PDF export for full query results
│   └── exportFavoritePdf.js  # PDF export for favorites
├── hooks/
│   ├── useFavorites.js       # Favorites state + localStorage
│   └── useSavedQueries.js    # Saved queries state + localStorage
└── README.md
```

---

## Features

- 🧠 **Natural Language to SQL** — Ask in plain English, get SQL back
- ⚡ **Multiple AI Pipelines** — RAG, TAG, and Hybrid modes
- 🤖 **LLM Choice** — Switch between OpenAI GPT-4 and Claude Sonnet
- 🗄️ **Multi-Database** — Chinook (music store) and Northwind (trading company)
- 📊 **Auto Charts** — AI picks the best chart type for your data
- 📋 **Tabbed Interface** — Multiple queries open in parallel tabs
- ⭐ **Favorites** — Star and revisit your best queries
- 🔖 **Saved Queries** — Save SQL queries for reuse
- 📄 **PDF Export** — Export results and favorites as PDFs
- 💬 **Follow-up Questions** — Full conversation threading per tab
- 📜 **Conversation History** — Last 5 sessions in the sidebar