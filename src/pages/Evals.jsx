import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

import { runEvals } from "@/lib/evalRunner";
import EvalRunConfig from "@/components/evals/EvalRunConfig";
import EvalHistory from "@/components/evals/EvalHistory";
import EvalResultDetail from "@/components/evals/EvalResultDetail";
import { FlaskConical, History, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function Evals() {
  const navigate = useNavigate();
  const [view, setView] = useState("config");
  const [evalHistory, setEvalHistory] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [runningId, setRunningId] = useState(null);
  const [runProgress, setRunProgress] = useState(null);
  // { completed: number, total: number, latest: result | null }

  const abortRef = useRef(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const runs = await base44.entities.EvalResult.list("-created_date", 20);
    setEvalHistory(runs);
  };

  const handleStartRun = async ({ runName, database, pipeline, llm, selectedCases }) => {
    abortRef.current = false;

    // Create a pending record in base44
    const record = await base44.entities.EvalResult.create({
      run_name: runName,
      database,
      pipeline,
      llm,
      total_cases: selectedCases.length,
      status: "running",
    });

    setRunningId(record.id);
    setRunProgress({ completed: 0, total: selectedCases.length, latest: null });
    setView("history");
    await loadHistory();

    try {
      const evalResults = await runEvals({
        testCases: selectedCases,
        pipeline,
        llm,
        databaseId: database,
        abortRef,
        onProgress: (completed, total, latest) => {
          setRunProgress({ completed, total, latest });
        },
      });

      const wasAborted = abortRef.current;
      await base44.entities.EvalResult.update(record.id, {
        status: wasAborted ? "failed" : "completed",
        results: evalResults.results,
        valid_sql_count: evalResults.valid_sql_count ?? 0,
        translatable_accuracy: evalResults.translatable_accuracy ?? 0,
        avg_sql_similarity: evalResults.avg_sql_similarity ?? 0,
        avg_cosine_similarity: evalResults.avg_cosine_similarity ?? 0,
        overall_score: evalResults.overall_score ?? 0,
      });
    } catch (err) {
      console.error("[Evals] run failed:", err);
      await base44.entities.EvalResult.update(record.id, { status: "failed" });
    } finally {
      setRunningId(null);
      setRunProgress(null);
      await loadHistory();
    }
  };

  const handleTerminate = async (runId) => {
    abortRef.current = true;
    await base44.entities.EvalResult.update(runId, { status: "failed" });
    setRunningId(null);
    setRunProgress(null);
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
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Evaluation Framework</h1>
              <p className="text-xs text-muted-foreground">
                Benchmark pipeline quality: SQL validity, similarity, translatable accuracy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("config")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                view === "config"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              New Run
            </button>
            <button
              onClick={() => { setView("history"); loadHistory(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                view === "history" || view === "detail"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="w-4 h-4" />
              History ({evalHistory.length})
            </button>
          </div>
        </div>
      </div>

      {/* Live progress banner — shown while a run is active */}
      {runProgress && (
        <div className="mx-5 mt-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary">
              Running eval — {runProgress.completed} / {runProgress.total} cases
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round((runProgress.completed / runProgress.total) * 100)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(runProgress.completed / runProgress.total) * 100}%` }}
            />
          </div>

          {/* Latest completed case */}
          {runProgress.latest && (
            <div className="flex items-center gap-2">
              {runProgress.latest.is_valid_sql ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              )}
              <span className="text-xs text-muted-foreground truncate">
                {runProgress.latest.question}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground ml-auto flex-shrink-0">
                SQL sim {Math.round((runProgress.latest.sql_similarity || 0) * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-card mx-5 mb-0 mt-3 rounded-t-xl border border-b-0 border-border shadow-sm flex flex-col">
        {view === "config" && (
          <EvalRunConfig onRun={handleStartRun} runningId={runningId} />
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
          <EvalResultDetail run={selectedRun} onBack={() => setView("history")} />
        )}
      </div>
    </div>
  );
}
