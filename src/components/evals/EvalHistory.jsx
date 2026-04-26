import React from "react";
import { RefreshCw, Loader2, CheckCircle2, XCircle, FlaskConical, Database, Cpu } from "lucide-react";

function ScoreBadge({ score, label }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : pct >= 60 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-rose-400 bg-rose-500/10 border-rose-500/20";
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg border ${color}`}>
      <span className="text-lg font-bold">{pct}%</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function EvalHistory({ runs, onSelectRun, onRefresh, runningId }) {
  if (runs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-12">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
          <FlaskConical className="w-7 h-7 opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">No eval runs yet</p>
          <p className="text-xs mt-1 opacity-70">Configure and run your first evaluation from "New Run".</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-8 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <p className="text-sm text-muted-foreground">{runs.length} evaluation run{runs.length !== 1 ? "s" : ""}</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-5 space-y-4">
        {runs.map((run) => {
          const isRunning = run.id === runningId || run.status === "running";
          const date = run.created_date
            ? new Date(run.created_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
            : "";
          return (
            <div
              key={run.id}
              onClick={() => !isRunning && run.status === "completed" && onSelectRun(run)}
              className={`bg-card border border-border rounded-2xl overflow-hidden transition-shadow ${run.status === "completed" ? "hover:shadow-md cursor-pointer" : ""}`}
            >
              {/* Header */}
              <div className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isRunning
                      ? <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                      : run.status === "completed"
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                    <h3 className="text-sm font-bold text-foreground truncate">{run.run_name}</h3>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Database className="w-3 h-3" /> {run.database}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> {run.llm}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{run.pipeline}</span>
                    <span className="text-[11px] text-muted-foreground">{run.total_cases} cases</span>
                    {date && <span className="text-[11px] text-muted-foreground ml-auto">{date}</span>}
                  </div>
                </div>
                {run.status === "completed" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ScoreBadge score={run.overall_score} label="Overall" />
                  </div>
                )}
                {isRunning && (
                  <span className="text-xs text-primary font-medium flex-shrink-0 animate-pulse">Running...</span>
                )}
              </div>

              {/* Metrics row */}
              {run.status === "completed" && (
                <div className="px-5 pb-4 grid grid-cols-4 gap-3">
                  {[
                    { label: "Valid SQL", value: `${run.valid_sql_count}/${run.total_cases}`, sub: `${Math.round((run.valid_sql_count / run.total_cases) * 100)}%` },
                    { label: "Translatable Acc.", value: `${Math.round((run.translatable_accuracy || 0) * 100)}%` },
                    { label: "SQL Similarity", value: `${Math.round((run.avg_sql_similarity || 0) * 100)}%` },
                    { label: "Cosine Sim.", value: `${Math.round((run.avg_cosine_similarity || 0) * 100)}%` },
                  ].map((m) => (
                    <div key={m.label} className="bg-secondary/50 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{m.label}</div>
                      <div className="text-sm font-bold text-foreground mt-0.5">{m.value}</div>
                      {m.sub && <div className="text-[10px] text-muted-foreground">{m.sub}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}