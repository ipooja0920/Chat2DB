import React, { useState } from "react";
import QuestionHeader from "./QuestionHeader";
import StatsCards from "./StatsCards";
import ResultsTabs from "./ResultsTabs";
import DataTable from "./DataTable";
import FollowUpInput from "./FollowUpInput";
import ChartView from "./ChartView";
import { Loader2, Copy, Check, BookmarkPlus } from "lucide-react";
import { exportQueryToPdf } from "@/lib/exportPdf";

export default function QueryView({ queryData, loading, onFollowUp, mode, llm, isFavorite, onToggleFavorite, isSaved, onSaveQuery }) {
  const [resultsTab, setResultsTab] = useState("Results");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    if (!queryData?.sql_query) return;
    navigator.clipboard.writeText(queryData.sql_query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Processing your question...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Running {mode} pipeline with {llm}
          </p>
        </div>
        <FollowUpInput onSend={onFollowUp} disabled />
      </div>
    );
  }

  if (!queryData) return null;

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const tabContent = (
    <>
      {resultsTab === "Results" && queryData.rows?.length > 0 ? (
        <DataTable
          columns={queryData.columns || []}
          data={queryData.rows || []}
          totalLabel="rows"
        />
      ) : resultsTab === "Chart" ? (
        <ChartView
          question={queryData.question}
          columns={queryData.columns || []}
          rows={queryData.rows || []}
        />
      ) : resultsTab === "SQL" ? (
        <div className="flex-1 p-6 overflow-auto">
          <pre className="bg-secondary rounded-xl p-4 text-sm font-mono text-foreground whitespace-pre-wrap border border-border">
            {queryData.sql_query || "No SQL generated"}
          </pre>
          {/* SQL Action Buttons */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleCopySql}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary hover:bg-muted border border-border rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              {copied ? "Copied!" : "Copy SQL"}
            </button>
            <button
              onClick={onSaveQuery}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                isSaved
                  ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                  : "bg-secondary hover:bg-muted border-border text-foreground"
              }`}
            >
              <BookmarkPlus className="w-4 h-4" />
              {isSaved ? "Saved" : "Save Query"}
            </button>
          </div>
        </div>
      ) : resultsTab === "Explanation" ? (
        <div className="flex-1 p-6 overflow-auto">
          <p className="text-sm text-foreground leading-relaxed">{queryData.explanation}</p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {resultsTab} view coming soon
        </div>
      )}
    </>
  );

  // Expanded: full-screen overlay
  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <ResultsTabs
          activeTab={resultsTab}
          onTabChange={setResultsTab}
          onExportPdf={() => exportQueryToPdf(queryData)}
          onToggleExpand={() => setExpanded(false)}
          expanded={true}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {tabContent}
        </div>
      </div>
    );
  }

  return (
    <>
      <QuestionHeader
        question={queryData.question}
        time={time}
        intent={queryData.intent}
        mode={queryData.pipeline}
        sources={
          queryData.sources_count
            ? `Sources: ${queryData.sources_count} docs, ${queryData.tables_count || 0} tables`
            : null
        }
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
      <StatsCards stats={queryData.stats} />

      {/* Written answer summary */}
      {queryData.summary && (
        <div className="px-6 pb-4">
          <p className="text-sm text-foreground leading-relaxed bg-accent/40 border border-accent rounded-xl px-4 py-3">
            {queryData.summary}
          </p>
        </div>
      )}

      <ResultsTabs
        activeTab={resultsTab}
        onTabChange={setResultsTab}
        onExportPdf={() => exportQueryToPdf(queryData)}
        onToggleExpand={() => setExpanded(true)}
        expanded={false}
      />
      {tabContent}
      <FollowUpInput onSend={onFollowUp} />
    </>
  );
}