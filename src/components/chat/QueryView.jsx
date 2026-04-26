import React, { useState, useRef, useEffect } from "react";
import QuestionHeader from "./QuestionHeader";
import StatsCards from "./StatsCards";
import ResultsTabs from "./ResultsTabs";
import DataTable from "./DataTable";
import FollowUpInput from "./FollowUpInput";
import ChartView from "./ChartView";
import ContextView from "./ContextView";
import FeedbackSection from "./FeedbackSection";
import { Loader2, Copy, Check, BookmarkPlus } from "lucide-react";
import { exportQueryToPdf } from "@/lib/exportPdf";

function MessageBlock({ queryData, isFavorite, onToggleFavorite, isSaved, onSaveQuery, isLast, onFeedback }) {
  const [resultsTab, setResultsTab] = useState("Results");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    if (!queryData?.sql_query) return;
    navigator.clipboard.writeText(queryData.sql_query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const tabContent = (
    <>
      {resultsTab === "Results" && queryData.rows?.length > 0 ? (
        <DataTable columns={queryData.columns || []} data={queryData.rows || []} totalLabel="rows" />
      ) : resultsTab === "Chart" ? (
        <ChartView question={queryData.question} columns={queryData.columns || []} rows={queryData.rows || []} />
      ) : resultsTab === "SQL" ? (
        <div className="flex-1 p-6 overflow-auto">
          <pre className="bg-secondary rounded-xl p-4 text-sm font-mono text-foreground whitespace-pre-wrap border border-border">
            {queryData.sql_query || "No SQL generated"}
          </pre>
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
        <div className="flex-1 p-6 overflow-auto space-y-4">
          {queryData.rewritten_query && (
            <div className="bg-accent/40 border border-accent rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">How we interpreted your question</p>
              <p className="text-sm text-foreground italic">{queryData.rewritten_query}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Explanation</p>
            <p className="text-sm text-foreground leading-relaxed">{queryData.explanation}</p>
          </div>
          {isLast && onFeedback && (
            <FeedbackSection
              messageId={queryData.id}
              onFeedback={onFeedback}
              loading={false}
            />
          )}
        </div>
      ) : resultsTab === "Context" ? (
        <ContextView queryData={queryData} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {resultsTab} view coming soon
        </div>
      )}
    </>
  );

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
        <div className="flex-1 flex flex-col overflow-hidden">{tabContent}</div>
      </div>
    );
  }

  return (
    <div className={`${!isLast ? "border-b border-border pb-2 mb-2" : ""}`}>
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
    </div>
  );
}

export default function QueryView({ thread, loading, onFollowUp, mode, llm, isFavorite, onToggleFavorite, isSaved, onSaveQuery, onFeedback }) {
  const bottomRef = useRef(null);
  const completedMessages = thread.filter((m) => !m._loading);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  if (thread.length === 0 && !loading) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {completedMessages.map((msg, idx) => {
          const isLast = idx === completedMessages.length - 1;
          return (
            <MessageBlock
              key={msg.id || idx}
              queryData={msg}
              isFavorite={isLast ? isFavorite : false}
              onToggleFavorite={isLast ? onToggleFavorite : undefined}
              isSaved={isLast ? isSaved : false}
              onSaveQuery={isLast ? onSaveQuery : undefined}
              isLast={isLast && !loading}
              onFeedback={isLast ? onFeedback : undefined}
            />
          );
        })}

        {/* Loading indicator for follow-up */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Processing your question...</p>
              <p className="text-xs text-muted-foreground mt-1">Running {mode} pipeline with {llm}</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <FollowUpInput onSend={onFollowUp} disabled={loading} />
    </div>
  );
}