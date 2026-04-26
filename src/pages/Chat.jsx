import React, { useState, useCallback } from "react";
import Sidebar from "@/components/chat/Sidebar";
import TopBar from "@/components/chat/TopBar";
import QueryTabs from "@/components/chat/QueryTabs";
import QuestionHeader from "@/components/chat/QuestionHeader";
import StatsCards from "@/components/chat/StatsCards";
import ResultsTabs from "@/components/chat/ResultsTabs";
import DataTable from "@/components/chat/DataTable";
import FollowUpInput from "@/components/chat/FollowUpInput";
import { sampleConversations, sampleQueries } from "@/lib/sampleData";
import { Menu, X } from "lucide-react";

export default function Chat() {
  const [activeConversation, setActiveConversation] = useState("1");
  const [conversations] = useState(sampleConversations);
  const [tabs, setTabs] = useState([
    { id: "1", title: "What is the total revenue by country?" },
    { id: "2", title: "Filter that by 2024" },
    { id: "3", title: "Top 10 customers by spend" },
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [resultsTab, setResultsTab] = useState("Results");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isNewQuery = !sampleQueries[activeTab] && tabs.find((t) => t.id === activeTab)?.title === "New Query";
  const currentQuery = sampleQueries[activeTab];

  const handleSelectConversation = useCallback((id) => {
    setActiveConversation(id);
    if (sampleQueries[id]) {
      setActiveTab(id);
      if (!tabs.find((t) => t.id === id)) {
        const conv = conversations.find((c) => c.id === id);
        setTabs((prev) => [...prev, { id, title: conv?.title || "New Query" }]);
      }
    }
    setSidebarOpen(false);
  }, [tabs, conversations]);

  const handleCloseTab = useCallback((id) => {
    const closingTab = tabs.find((t) => t.id === id);
    const isNew = closingTab?.title === "New Query" && !sampleQueries[id];

    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeTab === id) {
        if (isNew || next.length === 0) {
          setActiveTab("dashboard");
        } else {
          setActiveTab(next[0].id);
        }
      }
      return next;
    });
  }, [activeTab, tabs]);

  const handleAddTab = useCallback(() => {
    const id = Date.now().toString();
    setTabs((prev) => [...prev, { id, title: "New Query" }]);
    setActiveTab(id);
  }, []);

  const handleFollowUp = useCallback((question) => {
    const id = Date.now().toString();
    setTabs((prev) => [...prev, { id, title: question }]);
    setActiveTab(id);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
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
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          onNewQuestion={handleAddTab}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2 px-4 pt-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-secondary rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <TopBar />

        {/* Query Tabs */}
        <QueryTabs
          tabs={tabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onCloseTab={handleCloseTab}
          onAddTab={handleAddTab}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card mx-5 mb-0 rounded-t-xl border border-b-0 border-border shadow-sm">
          {activeTab === "dashboard" || !currentQuery ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12m12-11.25V3m0 13.5v3.75m-12-3.75v3.75m0 0h12" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Chat2DB</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Ask a question about your database to get started, or select a conversation from the history.
                </p>
              </div>
              <FollowUpInput onSend={handleFollowUp} />
            </div>
          ) : (
            <>
              <QuestionHeader
                question={currentQuery.question}
                time={currentQuery.time}
                intent={currentQuery.intent}
                mode={currentQuery.mode}
                sources={currentQuery.sources}
              />
              <StatsCards stats={currentQuery.stats} />
              <ResultsTabs activeTab={resultsTab} onTabChange={setResultsTab} />
              {resultsTab === "Results" && currentQuery.data ? (
                <DataTable
                  columns={currentQuery.columns}
                  data={currentQuery.data}
                  totalLabel={currentQuery.totalLabel}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  {resultsTab} view coming soon
                </div>
              )}
              <FollowUpInput onSend={handleFollowUp} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}