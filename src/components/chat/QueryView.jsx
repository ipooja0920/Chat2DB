import React, { useState } from "react";
import QuestionHeader from "./QuestionHeader";
import StatsCards from "./StatsCards";
import ResultsTabs from "./ResultsTabs";
import DataTable from "./DataTable";
import FollowUpInput from "./FollowUpInput";
import { Loader2 } from "lucide-react";

export default function QueryView({ queryData, loading, onFollowUp, mode, llm }) {
  const [resultsTab, setResultsTab] = useState("Results");

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
      />
      <StatsCards stats={queryData.stats} />
      <ResultsTabs activeTab={resultsTab} onTabChange={setResultsTab} />
      {resultsTab === "Results" && queryData.rows?.length > 0 ? (
        <DataTable
          columns={queryData.columns || []}
          data={queryData.rows || []}
          totalLabel="rows"
        />
      ) : resultsTab === "SQL" ? (
        <div className="flex-1 p-6 overflow-auto">
          <pre className="bg-secondary rounded-xl p-4 text-sm font-mono text-foreground whitespace-pre-wrap border border-border">
            {queryData.sql_query || "No SQL generated"}
          </pre>
        </div>
      ) : resultsTab === "Explanation" ? (
        <div className="flex-1 p-6 overflow-auto">
          <p className="text-sm text-foreground leading-relaxed">{queryData.explanation}</p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {resultsTab} view not available
        </div>
      )}
      <FollowUpInput onSend={onFollowUp} />
    </>
  );
}