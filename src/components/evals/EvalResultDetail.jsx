import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function MetricBar({ label, value, color = "bg-primary" }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-xs font-bold text-foreground">{pct}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CaseRow({ result, idx }) {
  const [expanded, setExpanded] = useState(false);
  const overall = (result.sql_similarity + (result.is_valid_sql ? 1 : 0) + (result.translatable_correct ? 1 : 0)) / 3;
  const statusColor = result.is_valid_sql && result.translatable_correct
    ? "text-emerald-400" : result.translatable_correct
    ? "text-amber-400" : "text-rose-400";

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <span className="text-xs font-mono text-muted-foreground w-5 flex-shrink-0">#{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug truncate">{result.question}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-[10px] font-semibold flex items-center gap-1 ${result.is_valid_sql ? "text-emerald-400" : "text-rose-400"}`}>
              {result.is_valid_sql ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {result.is_valid_sql ? "Valid SQL" : "Invalid SQL"}
            </span>
            <span className={`text-[10px] font-semibold flex items-center gap-1 ${result.translatable_correct ? "text-emerald-400" : "text-rose-400"}`}>
              {result.translatable_correct ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              Translatable {result.translatable_correct ? "✓" : "✗"}
            </span>
            <span className="text-[10px] text-muted-foreground">SQL Sim: {Math.round(result.sql_similarity * 100)}%</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-6 pb-5 space-y-4 bg-secondary/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Expected SQL</div>
              <pre className="bg-secondary rounded-lg px-3 py-2.5 text-[11px] font-mono text-foreground whitespace-pre-wrap border border-border/50">
                {result.expected_sql || "(none — non-translatable)"}
              </pre>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Generated SQL</div>
              <pre className="bg-secondary rounded-lg px-3 py-2.5 text-[11px] font-mono text-foreground whitespace-pre-wrap border border-border/50">
                {result.generated_sql || "(no SQL generated)"}
              </pre>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "SQL Similarity", value: result.sql_similarity },
              { label: "Result Col Sim", value: result.result_col_sim },
              { label: "Result Row Sim", value: result.result_row_sim },
              { label: "Cosine Sim", value: result.cosine_sim },
            ].map((m) => (
              <div key={m.label} className="bg-card border border-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-muted-foreground">{m.label}</div>
                <div className="text-sm font-bold text-foreground">{Math.round((m.value || 0) * 100)}%</div>
              </div>
            ))}
          </div>
          {result.explanation && result.explanation !== "OK" && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-amber-300">{result.explanation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EvalResultDetail({ run, onBack }) {
  const results = run.results || [];

  const chartData = [
    { name: "Valid SQL", value: Math.round((run.valid_sql_count / run.total_cases) * 100), fill: "#10b981" },
    { name: "Translatable", value: Math.round((run.translatable_accuracy || 0) * 100), fill: "#6366f1" },
    { name: "SQL Similarity", value: Math.round((run.avg_sql_similarity || 0) * 100), fill: "#f59e0b" },
    { name: "Cosine Sim", value: Math.round((run.avg_cosine_similarity || 0) * 100), fill: "#8b5cf6" },
    { name: "Overall", value: Math.round((run.overall_score || 0) * 100), fill: "#3b82f6" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Back bar */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-semibold text-foreground">{run.run_name}</span>
        <span className="text-xs text-muted-foreground ml-auto">{run.total_cases} cases · {run.database} · {run.pipeline} · {run.llm}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: summary */}
        <div className="w-72 flex-shrink-0 border-r border-border p-5 flex flex-col gap-5 overflow-y-auto">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Score Summary</div>
            <div className="flex flex-col gap-3">
              <MetricBar label="Valid SQL" value={run.valid_sql_count / run.total_cases} color="bg-emerald-500" />
              <MetricBar label="Translatable Accuracy" value={run.translatable_accuracy} color="bg-primary" />
              <MetricBar label="Avg SQL Similarity" value={run.avg_sql_similarity} color="bg-amber-500" />
              <MetricBar label="Avg Cosine Similarity" value={run.avg_cosine_similarity} color="bg-purple-500" />
              <div className="border-t border-border pt-3">
                <MetricBar label="Overall Score" value={run.overall_score} color="bg-blue-500" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Metrics Chart</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total Cases", value: run.total_cases },
              { label: "Valid SQL", value: run.valid_sql_count },
              { label: "Passed Classify", value: Math.round((run.translatable_accuracy || 0) * run.total_cases) },
              { label: "Overall", value: `${Math.round((run.overall_score || 0) * 100)}%` },
            ].map((s) => (
              <div key={s.label} className="bg-secondary/60 rounded-xl px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
                <div className="text-sm font-bold text-foreground">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: per-case results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b border-border flex-shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Per-Case Results</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {results.map((r, idx) => (
              <CaseRow key={idx} result={r} idx={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}