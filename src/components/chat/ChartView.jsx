import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { runVizAgent } from "@/lib/vizAgent";
import { analyzeDataSuitability } from "@/lib/chartHeuristics";
import { Loader2, BarChart2, AlertCircle, CheckCircle2 } from "lucide-react";

const COLORS = [
  "hsl(252, 85%, 60%)",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(50, 80%, 55%)",
  "hsl(10, 75%, 55%)",
];

// Parse numeric strings like "$523.06", "1,234" to numbers
function parseNumeric(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[$,%]/g, "").replace(/,/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? val : num;
  }
  return val;
}

function normalizeData(rows, xKey, yKeys) {
  return rows.map((row) => {
    const normalized = { ...row };
    yKeys.forEach((k) => {
      normalized[k] = parseNumeric(row[k]);
    });
    return normalized;
  });
}

function renderChart(chartType, data, xKey, yKeys, title) {
  const normalized = normalizeData(data, xKey, yKeys);
  const tickFormatter = (v) => (typeof v === "string" && v.length > 12 ? v.slice(0, 12) + "…" : v);

  const commonProps = {
    data: normalized,
    margin: { top: 10, right: 20, left: 0, bottom: 60 },
  };

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={340}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickFormatter={tickFormatter} angle={-35} textAnchor="end" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => (typeof v === "number" ? v.toLocaleString() : v)} />
          <Legend wrapperStyle={{ paddingTop: 16 }} />
          {yKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={340}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickFormatter={tickFormatter} angle={-35} textAnchor="end" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ paddingTop: 16 }} />
          {yKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart {...commonProps}>
          <defs>
            {yKeys.map((key, i) => (
              <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickFormatter={tickFormatter} angle={-35} textAnchor="end" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ paddingTop: 16 }} />
          {yKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={`url(#grad-${i})`} strokeWidth={2} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "pie") {
    const pieData = normalized.map((row) => ({
      name: row[xKey],
      value: parseNumeric(row[yKeys[0]]),
    }));
    return (
      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => v.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} name={xKey} tick={{ fontSize: 11 }} />
          <YAxis dataKey={yKeys[0]} name={yKeys[0]} tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={normalized} fill={COLORS[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

export default function ChartView({ question, columns, rows }) {
  const [vizConfig, setVizConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only initialize once on mount (lazy load) — don't refetch on prop changes
    if (initialized) return;
    setInitialized(true);

    if (!rows || rows.length === 0) {
      return;
    }

    // Pre-check with client-side heuristics before calling LLM
    const suitability = analyzeDataSuitability(columns, rows);
    if (!suitability.suitable) {
      setVizConfig({ suitable: false, reason: suitability.reason });
      return;
    }

    // Only call LLM if heuristics pass
    setLoading(true);
    runVizAgent(question, columns, rows)
      .then(setVizConfig)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">Visualization agent is analyzing your data...</p>
      </div>
    );
  }

  if (!vizConfig?.suitable) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
          <BarChart2 className="w-6 h-6 opacity-40" />
        </div>
        <p className="text-sm font-medium">No visualization available</p>
        <p className="text-xs text-center max-w-xs opacity-70">{vizConfig?.reason}</p>
      </div>
    );
  }

  const chart = renderChart(vizConfig.chart_type, rows, vizConfig.x_key, vizConfig.y_keys || [], vizConfig.title);

  return (
    <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
      {/* Title + validation badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{vizConfig.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {vizConfig.chart_type} chart · {rows.length} data points
          </p>
        </div>
        <div className="flex items-start gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg max-w-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-700 leading-snug">{vizConfig.validation}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-secondary/30 rounded-xl border border-border p-4">
        {chart || (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Could not render chart
          </div>
        )}
      </div>
    </div>
  );
}