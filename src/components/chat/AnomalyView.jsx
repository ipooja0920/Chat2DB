import React, { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, Info, Loader2, ShieldCheck } from "lucide-react";
import { detectAnomalies } from "@/lib/anomalyAgent";

const SEVERITY_CONFIG = {
  high: {
    icon: AlertCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    titleColor: "text-red-700",
    badge: "bg-red-100 text-red-600 border-red-200",
    label: "High",
  },
  medium: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    titleColor: "text-amber-700",
    badge: "bg-amber-100 text-amber-600 border-amber-200",
    label: "Medium",
  },
  low: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    titleColor: "text-blue-700",
    badge: "bg-blue-100 text-blue-600 border-blue-200",
    label: "Low",
  },
};

export default function AnomalyView({ question, columns, rows }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (ran) return;
    setRan(true);
    setLoading(true);
    detectAnomalies(question, columns, rows)
      .then(setResult)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">Running anomaly detection...</p>
      </div>
    );
  }

  if (!result || !result.suitable || result.anomalies?.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No anomalies detected</p>
          <p className="text-xs mt-1 opacity-70">The data looks normal — no unusual patterns found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">
          {result.anomalies.length} Anomali{result.anomalies.length !== 1 ? "es" : "y"} Detected
        </h3>
      </div>

      {result.anomalies.map((anomaly, idx) => {
        const severity = anomaly.severity?.toLowerCase() || "medium";
        const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
        const Icon = config.icon;

        return (
          <div
            key={idx}
            className={`rounded-xl border ${config.border} ${config.bg} px-4 py-4`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-sm font-semibold ${config.titleColor}`}>
                    {anomaly.title}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
                    {config.label}
                  </span>
                  {anomaly.type && (
                    <span className="text-[10px] text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-full">
                      {anomaly.type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {anomaly.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}