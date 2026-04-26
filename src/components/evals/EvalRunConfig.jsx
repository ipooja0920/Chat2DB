import React, { useState } from "react";
import { EVAL_DATASETS, PIPELINES, LLMS } from "@/lib/evalDatasets";
import { DATABASES } from "@/lib/queryEngine";
import { FlaskConical, Loader2, CheckSquare, Square, ChevronDown, Database, Cpu, GitFork } from "lucide-react";

export default function EvalRunConfig({ onRun, runningId }) {
  const [runName, setRunName] = useState(`Eval Run ${new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`);
  const [database, setDatabase] = useState("chinook");
  const [pipeline, setPipeline] = useState("Hybrid");
  const [llm, setLlm] = useState("OpenAI");
  const [selectedIdxs, setSelectedIdxs] = useState(() => {
    const all = EVAL_DATASETS["chinook"];
    return all.map((_, i) => i);
  });

  const cases = EVAL_DATASETS[database] || [];

  const handleDbChange = (db) => {
    setDatabase(db);
    const all = EVAL_DATASETS[db] || [];
    setSelectedIdxs(all.map((_, i) => i));
  };

  const toggleCase = (idx) => {
    setSelectedIdxs((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleAll = () => {
    if (selectedIdxs.length === cases.length) setSelectedIdxs([]);
    else setSelectedIdxs(cases.map((_, i) => i));
  };

  const handleRun = () => {
    const selectedCases = selectedIdxs.map((i) => cases[i]);
    onRun({ runName, database, pipeline, llm, selectedCases });
  };

  const isRunning = !!runningId;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Config */}
      <div className="w-80 flex-shrink-0 border-r border-border p-6 flex flex-col gap-5 overflow-y-auto">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Run Name</label>
          <input
            value={runName}
            onChange={(e) => setRunName(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
          />
        </div>

        {/* Database */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <Database className="w-3 h-3" /> Database
          </label>
          <div className="flex gap-2">
            {DATABASES.map((db) => (
              <button
                key={db.id}
                onClick={() => handleDbChange(db.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${database === db.id ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
              >
                {db.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <GitFork className="w-3 h-3" /> Pipeline
          </label>
          <div className="flex flex-col gap-1.5">
            {PIPELINES.map((p) => (
              <button
                key={p}
                onClick={() => setPipeline(p)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors text-left ${pipeline === p ? "bg-primary/10 border-primary/40 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
              >
                {p === "Hybrid" ? "Hybrid (RAG + TAG)" : p === "RAG" ? "Standard (RAG)" : "TAG only"}
              </button>
            ))}
          </div>
        </div>

        {/* LLM */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <Cpu className="w-3 h-3" /> LLM Provider
          </label>
          <div className="flex gap-2">
            {LLMS.map((l) => (
              <button
                key={l}
                onClick={() => setLlm(l)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${llm === l ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div className="bg-secondary/60 border border-border rounded-xl px-4 py-3 mb-4 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground mb-2">Metrics evaluated:</div>
            <div>✓ SQL Validity (parse check)</div>
            <div>✓ SQL Similarity (sequence match)</div>
            <div>✓ Translatable Accuracy</div>
            <div>✓ Result Set Similarity</div>
            <div>✓ Cosine Similarity</div>
            <div>✓ Overall Score</div>
          </div>
          <button
            onClick={handleRun}
            disabled={isRunning || selectedIdxs.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            {isRunning ? "Running Evals..." : `Run ${selectedIdxs.length} Test Cases`}
          </button>
        </div>
      </div>

      {/* Right: Test cases */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-foreground">Test Cases</h2>
            <p className="text-xs text-muted-foreground">{selectedIdxs.length} of {cases.length} selected</p>
          </div>
          <button onClick={toggleAll} className="text-xs text-primary font-medium hover:underline">
            {selectedIdxs.length === cases.length ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {cases.map((tc, idx) => {
            const isSelected = selectedIdxs.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => toggleCase(idx)}
                className={`w-full flex items-start gap-3 px-6 py-4 text-left hover:bg-secondary/40 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
              >
                {isSelected
                  ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">{tc.question}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${tc.expected_translatable ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-secondary text-muted-foreground border-border"}`}>
                      {tc.expected_translatable ? "Translatable" : "Non-translatable"}
                    </span>
                    {tc.expected_sql && (
                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[300px]">{tc.expected_sql.slice(0, 60)}...</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}