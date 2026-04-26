import React, { useState, useCallback, useRef } from "react";
import Sidebar from "@/components/chat/Sidebar";
import TopBar from "@/components/chat/TopBar";
import QueryTabs from "@/components/chat/QueryTabs";
import QueryView from "@/components/chat/QueryView";
import FollowUpInput from "@/components/chat/FollowUpInput";
import OverflowDialog from "@/components/chat/OverflowDialog";
import Favorites from "@/pages/Favorites";
import SavedQueries from "@/pages/SavedQueries";
import ExploreSchema from "@/pages/ExploreSchema";
import { runQuery, getDatabaseById, DATABASES } from "@/lib/queryEngine";
import { useFavorites } from "@/hooks/useFavorites";
import { useSavedQueries } from "@/hooks/useSavedQueries";
import { Menu } from "lucide-react";

export default function Chat() {
  const [mode, setMode] = useState("Hybrid");
  const [llm, setLlm] = useState("OpenAI");
  const [database, setDatabase] = useState("chinook");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [overflowState, setOverflowState] = useState(null);

  const { favorites, isFavorite, addFavorite, confirmAdd, removeFavorite } = useFavorites();
  const { savedQueries, isSaved, addSavedQuery, confirmAddSavedQuery, removeSavedQuery } = useSavedQueries();
  const [savedOverflowState, setSavedOverflowState] = useState(null);

  // tabs: [{ id, title }]
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  // queryResults: { [tabId]: Message[] }
  // Each Message: { id, question, ...llmResponse } | { _loading: true, question }
  const [queryResults, setQueryResults] = useState({});

  // conversations: last 5 entries, each owns a thread snapshot
  // { id, title, time, thread: Message[] }
  const [conversations, setConversations] = useState([]);

  // Push a conversation entry with the current thread snapshot (up to this message)
  // id is unique per entry so follow-ups get their own entry
  const pushConversation = useCallback((id, title, threadSnapshot) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      return [{ id, title, time: "just now", thread: threadSnapshot }, ...filtered].slice(0, 5);
    });
  }, []);

  // Append a loading placeholder for a new message in a tab's thread
  const appendLoadingMessage = useCallback((tabId, question) => {
    setQueryResults((prev) => {
      const existing = Array.isArray(prev[tabId]) ? prev[tabId] : [];
      return { ...prev, [tabId]: [...existing, { _loading: true, question }] };
    });
  }, []);

  // When the user switches DB: clear all tabs, results, and conversations
  const handleDatabaseChange = useCallback((newDb) => {
    setDatabase(newDb);
    setTabs([]);
    setActiveTab("dashboard");
    setQueryResults({});
    setConversations([]);
  }, []);

  const runQueryInTab = useCallback(async (question, tabId, onComplete) => {
    appendLoadingMessage(tabId, question);
    try {
      const result = await runQuery(question, mode, llm, database);
      const message = { id: `${tabId}-${Date.now()}`, question, database, ...result };
      setQueryResults((prev) => {
        const existing = Array.isArray(prev[tabId]) ? prev[tabId] : [];
        const without = existing.filter((m) => !m._loading);
        const newThread = [...without, message];
        // Notify caller with final thread so they can snapshot it
        onComplete?.(newThread, message);
        return { ...prev, [tabId]: newThread };
      });
    } catch (err) {
      const message = {
        id: `${tabId}-${Date.now()}`,
        question,
        intent: "Error",
        pipeline: mode === "Hybrid" ? "Hybrid (RAG + TAG)" : "Standard (RAG)",
        sql_query: "",
        explanation: `Error: ${err.message}`,
        columns: [],
        rows: [],
        stats: [],
      };
      setQueryResults((prev) => {
        const existing = Array.isArray(prev[tabId]) ? prev[tabId] : [];
        const without = existing.filter((m) => !m._loading);
        const newThread = [...without, message];
        onComplete?.(newThread, message);
        return { ...prev, [tabId]: newThread };
      });
    }
  }, [mode, llm, appendLoadingMessage]);

  // New question — always opens a new tab; history entry gets snapshot after answer arrives
  const handleAskQuestion = useCallback(async (question) => {
    const tabId = Date.now().toString();
    setTabs((prev) => [...prev, { id: tabId, title: question }]);
    setActiveTab(tabId);
    await runQueryInTab(question, tabId, (newThread) => {
      // Snapshot = just this first message
      pushConversation(tabId, question, newThread.slice(0, 1));
    });
  }, [runQueryInTab, pushConversation]);

  // Follow-up — appends to current tab's thread; each follow-up gets its own history entry
  const handleFollowUp = useCallback(async (question) => {
    if (activeTab === "dashboard") {
      await handleAskQuestion(question);
      return;
    }
    const convId = `${activeTab}-fu-${Date.now()}`;
    await runQueryInTab(question, activeTab, (newThread) => {
      // Snapshot = everything up to and including this answer
      pushConversation(convId, question, [...newThread]);
    });
  }, [activeTab, runQueryInTab, handleAskQuestion, pushConversation]);

  const handleCloseTab = useCallback((id) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeTab === id) {
        setActiveTab(next.length > 0 ? next[next.length - 1].id : "dashboard");
      }
      return next;
    });
    // Don't delete queryResults[id] — history entries may still reference snapshots
    // But we do clean up tabs that are purely "virtual" (from history) when closed
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

  // Clicking a conversation history entry: load its snapshot into a virtual tab
  const handleSelectConversation = useCallback((convId) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv || !conv.thread?.length) { setSidebarOpen(false); return; }

    // Use the conv's own unique id as the virtual tab id
    const virtualTabId = convId;

    // Inject thread snapshot into queryResults so QueryView can render it
    setQueryResults((prev) => ({ ...prev, [virtualTabId]: conv.thread }));

    // Open a tab for it if not already open
    if (!tabs.find((t) => t.id === virtualTabId)) {
      setTabs((prev) => [...prev, { id: virtualTabId, title: conv.title }]);
    }

    setActiveTab(virtualTabId);
    setActivePage("Dashboard");
    setSidebarOpen(false);
  }, [conversations, tabs]);

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

  const currentThread = Array.isArray(queryResults[activeTab]) ? queryResults[activeTab] : [];
  const isThreadLoading = currentThread.length > 0 && currentThread[currentThread.length - 1]?._loading;
  const lastResult = currentThread.filter((m) => !m._loading).slice(-1)[0] || null;
  const isDashboard = activeTab === "dashboard" || currentThread.length === 0;
  const isFavoritesPage = activePage === "Favorites";
  const isSavedQueriesPage = activePage === "Saved Queries";
  const isExploreSchemaPage = activePage === "Explore Schema";

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
          database={database}
          onDatabaseChange={handleDatabaseChange}
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
          {isExploreSchemaPage ? (
            <ExploreSchema database={database} />
          ) : isFavoritesPage ? (
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
                  Ask a question in natural language and the AI will generate SQL, run it, and explain the results using <strong>{mode === "Hybrid" ? "Hybrid" : "Standard"}</strong> or <strong>{mode === "Hybrid" ? "Standard" : "Hybrid"}</strong> mode with <strong>OpenAI</strong> or <strong>Claude</strong>.
                </p>
              </div>
              <div className="w-full max-w-lg">
                <FollowUpInput onSend={handleAskQuestion} placeholder={`Ask a question about ${getDatabaseById(database).label}...`} />
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {getDatabaseById(database).sampleQuestions.map((q) => (
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
              thread={currentThread}
              loading={isThreadLoading}
              onFollowUp={handleFollowUp}
              mode={mode}
              llm={llm}
              isFavorite={lastResult ? isFavorite(lastResult.id) : false}
              onToggleFavorite={() => lastResult && handleToggleFavorite(lastResult)}
              isSaved={lastResult ? isSaved(lastResult.id) : false}
              onSaveQuery={() => lastResult && handleToggleSavedQuery(lastResult)}
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