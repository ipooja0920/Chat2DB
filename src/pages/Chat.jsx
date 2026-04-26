import React, { useState, useCallback, useRef } from "react";
import Sidebar from "@/components/chat/Sidebar";
import TopBar from "@/components/chat/TopBar";
import QueryTabs from "@/components/chat/QueryTabs";
import QueryView from "@/components/chat/QueryView";
import FollowUpInput from "@/components/chat/FollowUpInput";
import OverflowDialog from "@/components/chat/OverflowDialog";
import Favorites from "@/pages/Favorites";
import SavedQueries from "@/pages/SavedQueries";
// sampleConversations removed — using real history only
import { runQuery } from "@/lib/queryEngine";
import { useFavorites } from "@/hooks/useFavorites";
import { useSavedQueries } from "@/hooks/useSavedQueries";
import { Menu } from "lucide-react";

export default function Chat() {
  const [mode, setMode] = useState("Hybrid");
  const [llm, setLlm] = useState("OpenAI");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [overflowState, setOverflowState] = useState(null); // { queryData, oldest }

  const { favorites, isFavorite, addFavorite, confirmAdd, removeFavorite } = useFavorites();
  const { savedQueries, isSaved, addSavedQuery, confirmAddSavedQuery, removeSavedQuery } = useSavedQueries();
  const [savedOverflowState, setSavedOverflowState] = useState(null);

  // tabs: [{id, title}]
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  // queryResults: { [tabId]: { question, ...llmResponse } | "loading" }
  const [queryResults, setQueryResults] = useState({});

  // conversation history for sidebar — last 5, deduplicated
  const [conversations, setConversations] = useState([]);

  // Add/move-to-top a conversation entry, capped at 5
  const pushConversation = useCallback((id, title) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      return [{ id, title, time: "just now" }, ...filtered].slice(0, 5);
    });
  }, []);

  const runQueryInTab = useCallback(async (question, tabId) => {
    setQueryResults((prev) => ({ ...prev, [tabId]: "loading" }));
    try {
      const result = await runQuery(question, mode, llm);
      setQueryResults((prev) => ({
        ...prev,
        [tabId]: { id: tabId, question, ...result },
      }));
    } catch (err) {
      setQueryResults((prev) => ({
        ...prev,
        [tabId]: {
          id: tabId,
          question,
          intent: "Error",
          pipeline: mode === "Hybrid" ? "Hybrid (RAG + TAG)" : "Standard (RAG)",
          sql_query: "",
          explanation: `Error: ${err.message}`,
          columns: [],
          rows: [],
          stats: [],
        },
      }));
    }
  }, [mode, llm]);

  // New question — always opens a new tab
  const handleAskQuestion = useCallback(async (question) => {
    const id = Date.now().toString();
    setTabs((prev) => [...prev, { id, title: question }]);
    setActiveTab(id);
    pushConversation(id, question);
    await runQueryInTab(question, id);
  }, [runQueryInTab, pushConversation]);

  // Follow-up — updates the current tab in place
  const handleFollowUp = useCallback(async (question) => {
    if (activeTab === "dashboard") {
      await handleAskQuestion(question);
      return;
    }
    setTabs((prev) => prev.map((t) => t.id === activeTab ? { ...t, title: question } : t));
    pushConversation(activeTab, question);
    await runQueryInTab(question, activeTab);
  }, [activeTab, runQueryInTab, handleAskQuestion, pushConversation]);

  const handleCloseTab = useCallback((id) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeTab === id) {
        setActiveTab(next.length > 0 ? next[next.length - 1].id : "dashboard");
      }
      return next;
    });
    setQueryResults((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, [activeTab]);

  const handleAddTab = useCallback(() => {
    setActiveTab("dashboard");
  }, []);

  const handleToggleFavorite = useCallback((queryData) => {
    if (isFavorite(queryData.id)) {
      removeFavorite(queryData.id);
      return;
    }
    const result = addFavorite(queryData);
    if (result?.needsConfirm) {
      setOverflowState({ queryData, oldest: result.oldest });
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  const handleSelectConversation = useCallback((convId) => {
    const result = queryResults[convId];
    if (!result) { setSidebarOpen(false); return; }

    // Open tab if not already open
    if (!tabs.find((t) => t.id === convId)) {
      const conv = conversations.find((c) => c.id === convId);
      setTabs((prev) => [...prev, { id: convId, title: conv?.title || "Query" }]);
    }
    setActiveTab(convId);
    setActivePage("Dashboard");

    // Move to top of history (dedup)
    const conv = conversations.find((c) => c.id === convId);
    if (conv) pushConversation(convId, conv.title);

    setSidebarOpen(false);
  }, [queryResults, tabs, conversations, pushConversation]);

  const handleToggleSavedQuery = useCallback((queryData) => {
    if (isSaved(queryData.id)) {
      removeSavedQuery(queryData.id);
      return;
    }
    const result = addSavedQuery(queryData);
    if (result?.needsConfirm) {
      setSavedOverflowState({ queryData, oldest: result.oldest });
    }
  }, [isSaved, addSavedQuery, removeSavedQuery]);

  const currentResult = queryResults[activeTab];
  const isLoading = currentResult === "loading";
  const isDashboard = activeTab === "dashboard" || !currentResult;
  const isFavoritesPage = activePage === "Favorites";
  const isSavedQueriesPage = activePage === "Saved Queries";

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar
          conversations={conversations}
          activeConversation={activeTab}
          onSelectConversation={handleSelectConversation}
          onNewQuestion={() => { setActivePage("Dashboard"); handleAddTab(); }}
          activePage={activePage}
          onNavigate={(page) => { setActivePage(page); setSidebarOpen(false); }}
          favoritesCount={favorites.length}
          savedQueriesCount={savedQueries.length}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center gap-2 px-4 pt-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-secondary rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <TopBar
          mode={mode}
          onModeChange={setMode}
          llm={llm}
          onLlmChange={setLlm}
        />

        <QueryTabs
          tabs={tabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onCloseTab={handleCloseTab}
          onAddTab={handleAddTab}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card mx-5 mb-0 rounded-t-xl border border-b-0 border-border shadow-sm">
          {isFavoritesPage ? (
            <Favorites
              favorites={favorites}
              onRemove={removeFavorite}
              onSelectFavorite={(fav) => {
                setActivePage("Dashboard");
                handleSelectConversation(fav.id);
              }}
            />
          ) : isSavedQueriesPage ? (
            <SavedQueries
              savedQueries={savedQueries}
              onRemove={removeSavedQuery}
              onSelectQuery={(item) => {
                setActivePage("Dashboard");
                handleSelectConversation(item.id);
              }}
            />
          ) : isDashboard ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12m12-11.25V3m0 13.5v3.75m-12-3.75v3.75m0 0h12" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Chat2DB</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Ask a question in natural language and the AI will generate SQL, run it, and explain the results using <strong>{mode}</strong> mode with <strong>{llm}</strong>.
                </p>
              </div>
              <div className="w-full max-w-lg">
                <FollowUpInput onSend={handleAskQuestion} placeholder="e.g. What is the total revenue by country?" />
              </div>
              {/* Example questions */}
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {[
                  "What is the total revenue by country?",
                  "Top 10 customers by spend",
                  "Best selling genres",
                  "Monthly revenue trend",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleAskQuestion(q)}
                    className="text-xs px-3 py-1.5 bg-secondary hover:bg-accent hover:text-accent-foreground rounded-full border border-border transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <QueryView
              queryData={isLoading ? null : currentResult}
              loading={isLoading}
              onFollowUp={handleFollowUp}
              mode={mode}
              llm={llm}
              isFavorite={!isLoading && currentResult ? isFavorite(currentResult.id) : false}
              onToggleFavorite={() => !isLoading && currentResult && handleToggleFavorite(currentResult)}
              isSaved={!isLoading && currentResult ? isSaved(currentResult.id) : false}
              onSaveQuery={() => !isLoading && currentResult && handleToggleSavedQuery(currentResult)}
            />
          )}
        </div>
      </div>

      {/* Favorites overflow dialog */}
      {overflowState && (
        <OverflowDialog
          oldest={overflowState.oldest}
          onConfirm={() => { confirmAdd(overflowState.queryData); setOverflowState(null); }}
          onCancel={() => setOverflowState(null)}
        />
      )}

      {/* Saved Queries overflow dialog */}
      {savedOverflowState && (
        <OverflowDialog
          oldest={savedOverflowState.oldest}
          onConfirm={() => { confirmAddSavedQuery(savedOverflowState.queryData); setSavedOverflowState(null); }}
          onCancel={() => setSavedOverflowState(null)}
        />
      )}
    </div>
  );
}