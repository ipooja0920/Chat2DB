import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, Zap, Clock, TrendingUp, RefreshCw, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const MODEL_COLORS = {
  gpt_5_mini: "#10b981",
  gpt_5: "#6366f1",
  claude_sonnet_4_6: "#f59e0b",
};

function StatCard({ icon: Icon, label, value, sub, color = "purple" }) {
  const colors = {
    purple: "bg-primary/10 text-primary",
    green: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    blue: "bg-blue-500/10 text-blue-500",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function CostDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await base44.entities.QueryLog.list("-created_date", 200);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  // ── Aggregations ──────────────────────────────────────────────────────────
  const totalCost = logs.reduce((s, l) => s + (l.estimated_cost_usd || 0), 0);
  const totalQueries = logs.length;
  const avgCost = totalQueries > 0 ? totalCost / totalQueries : 0;
  const avgLatency = totalQueries > 0
    ? logs.reduce((s, l) => s + (l.execution_time_ms || 0), 0) / totalQueries
    : 0;

  // Cost by model
  const byModel = Object.entries(
    logs.reduce((acc, l) => {
      const m = l.model || "unknown";
      acc[m] = (acc[m] || 0) + (l.estimated_cost_usd || 0);
      return acc;
    }, {})
  ).map(([model, cost]) => ({ model, cost: parseFloat(cost.toFixed(4)) }));

  // Cost by pipeline
  const byPipeline = Object.entries(
    logs.reduce((acc, l) => {
      const p = l.pipeline || "Unknown";
      acc[p] = (acc[p] || 0) + (l.estimated_cost_usd || 0);
      return acc;
    }, {})
  ).map(([pipeline, cost]) => ({ pipeline, cost: parseFloat(cost.toFixed(4)) }));

  // Cost over time (last 20 queries, newest last)
  const timelineData = [...logs].reverse().slice(-20).map((l, i) => ({
    idx: i + 1,
    cost: parseFloat((l.estimated_cost_usd || 0).toFixed(5)),
    question: l.question?.slice(0, 30) + "...",
  }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Cost Dashboard</h1>
            <p className="text-xs text-muted-foreground">Estimated LLM usage costs across all queries</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-muted border border-border rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Total Estimated Cost" value={`$${totalCost.toFixed(4)}`} sub="All time" color="purple" />
            <StatCard icon={Zap} label="Total Queries" value={totalQueries} sub="Logged queries" color="blue" />
            <StatCard icon={TrendingUp} label="Avg Cost / Query" value={`$${avgCost.toFixed(5)}`} sub="Per question" color="green" />
            <StatCard icon={Clock} label="Avg Latency" value={`${Math.round(avgLatency)}ms`} sub="End-to-end" color="amber" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost by Model */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Cost by Model</h3>
              {byModel.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={byModel} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="model" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v) => [`$${v}`, "Cost"]} />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Cost by Pipeline */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Cost by Pipeline</h3>
              {byPipeline.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={byPipeline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="pipeline" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v) => [`$${v}`, "Cost"]} />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Cost over time */}
          {timelineData.length > 1 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Cost per Query (last 20)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={timelineData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="idx" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(v) => [`$${v}`, "Est. Cost"]}
                    labelFormatter={(i) => timelineData[i - 1]?.question || `Query ${i}`}
                  />
                  <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Query Log Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Recent Query Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/60 border-b border-border">
                    {["Question", "Model", "Pipeline", "DB", "Input Tokens", "Output Tokens", "Est. Cost", "Latency"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 50).map((log, idx) => (
                    <tr key={log.id || idx} className={`border-b border-border/40 hover:bg-secondary/20 transition-colors ${idx % 2 === 0 ? "" : "bg-secondary/10"}`}>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-xs text-foreground truncate" title={log.question}>{log.question}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ background: (MODEL_COLORS[log.model] || "#6366f1") + "20", color: MODEL_COLORS[log.model] || "#6366f1" }}>
                          {log.model || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-muted-foreground">{log.pipeline || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Database className="w-3 h-3" />{log.database || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground text-right">{(log.estimated_input_tokens || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground text-right">{(log.estimated_output_tokens || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-foreground">${(log.estimated_cost_usd || 0).toFixed(5)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.execution_time_ms ? `${log.execution_time_ms}ms` : "—"}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No queries logged yet. Ask a question to start tracking costs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}