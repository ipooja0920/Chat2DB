import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { EVAL_DATASETS, PIPELINES, LLMS } from "@/lib/evalDatasets";
import { getDatabaseById, DATABASES } from "@/lib/queryEngine";
import EvalRunConfig from "@/components/evals/EvalRunConfig";
import EvalHistory from "@/components/evals/EvalHistory";
import EvalResultDetail from "@/components/evals/EvalResultDetail";
import { FlaskConical, History, ArrowLeft } from "lucide-react";

export default function Evals() {
  const navigate = useNavigate();
  const [view, setView] = useState("config"); // "config" | "history" | "detail"
  const [evalHistory, setEvalHistory] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [runningId, setRunningId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const runs = await base44.entities.EvalResult.list("-created_date", 20);
    setEvalHistory(runs);
  };

  const handleStartRun = async ({ runName, database, pipeline, llm, selectedCases }) => {
    const dbSchema = getDatabaseById(database).schema;
    const testCases = selectedCases;

    // Create a pending record
    const record = await base44.entities.EvalResult.create({
      run_name: runName,
      database,
      pipeline,
      llm,
      total_cases: testCases.length,
      status: "running"
    });
    setRunningId(record.id);
    setView("history");
    await loadHistory();

    // Fire-and-forget: don't await — poll for completion instead
    base44.functions.invoke("runEvals", {
      eval_run_id: record.id,
      test_cases: testCases,
      pipeline,
      llm,
      database,
      db_schema: dbSchema,
      run_name: runName
    }).then(async () => {
      setRunningId(null);
      await loadHistory();
    }).catch(async () => {
      // Mark as failed only if still "running" (not manually terminated)
      try {
        const current = await base44.entities.EvalResult.filter({ id: record.id });
        if (current?.[0]?.status === "running") {
          await base44.entities.EvalResult.update(record.id, { status: "failed" });
        }
      } catch {}
      setRunningId(null);
      await loadHistory();
    });

    // Poll every 5s to refresh history while running
    const pollInterval = setInterval(async () => {
      const runs = await base44.entities.EvalResult.list("-created_date", 20);
      setEvalHistory(runs);
      const thisRun = runs.find(r => r.id === record.id);
      if (thisRun && thisRun.status !== "running") {
        clearInterval(pollInterval);
        setRunningId(null);
      }
    }, 5000);
  };

  const handleTerminate = async (runId) => {
    await base44.entities.EvalResult.update(runId, { status: "failed" });
    setRunningId(null);
    await loadHistory();
  };

  const handleSelectRun = (run) => {
    setSelectedRun(run);
    setView("detail");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Evaluation Framework</h1>
              <p className="text-xs text-muted-foreground">Benchmark pipeline quality: SQL validity, similarity, translatable accuracy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("config")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${view === "config" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
            >
              <FlaskConical className="w-4 h-4" />
              New Run
            </button>
            <button
              onClick={() => { setView("history"); loadHistory(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${view === "history" || view === "detail" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
            >
              <History className="w-4 h-4" />
              History ({evalHistory.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-card mx-5 mb-0 rounded-t-xl border border-b-0 border-border shadow-sm flex flex-col">
        {view === "config" && (
          <EvalRunConfig
            onRun={handleStartRun}
            runningId={runningId}
          />
        )}
        {view === "history" && (
          <EvalHistory
            runs={evalHistory}
            onSelectRun={handleSelectRun}
            onRefresh={loadHistory}
            runningId={runningId}
            onTerminate={handleTerminate}
          />
        )}
        {view === "detail" && selectedRun && (
          <EvalResultDetail
            run={selectedRun}
            onBack={() => setView("history")}
          />
        )}
      </div>
    </div>
  );
}