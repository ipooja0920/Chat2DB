import React from "react";
import { Info, Database, ChevronDown, Cpu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DATABASES } from "@/lib/queryEngine";

const MODES = ["Hybrid", "Standard"];
const LLMS = ["OpenAI", "Claude"];

const MODE_LABELS = {
  Hybrid: "Hybrid (RAG + TAG)",
  Standard: "Standard (RAG)",
};

export default function TopBar({ mode, onModeChange, llm, onLlmChange, database, onDatabaseChange }) {
  const activeDb = DATABASES.find((d) => d.id === database) || DATABASES[0];

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Mode:</span>

        {/* Mode Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full border border-border hover:bg-muted transition-colors">
              <span className="text-xs font-semibold text-foreground">{MODE_LABELS[mode]}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {MODES.map((m) => (
              <DropdownMenuItem
                key={m}
                onClick={() => onModeChange(m)}
                className={cn("text-xs", mode === m && "bg-accent text-accent-foreground font-semibold")}
              >
                <div>
                  <div className="font-medium">{MODE_LABELS[m]}</div>
                  <div className="text-muted-foreground text-[10px]">
                    {m === "Hybrid" ? "RAG retrieval + TAG synthesis" : "RAG retrieval only"}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Info className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />

        {/* LLM Switcher */}
        <span className="text-sm text-muted-foreground font-medium ml-2">LLM:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full border border-border hover:bg-muted transition-colors">
              <Cpu className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-foreground">{llm}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {LLMS.map((l) => (
              <DropdownMenuItem
                key={l}
                onClick={() => onLlmChange(l)}
                className={cn("text-xs", llm === l && "bg-accent text-accent-foreground font-semibold")}
              >
                <div>
                  <div className="font-medium">{l}</div>
                  <div className="text-muted-foreground text-[10px]">
                    {l === "OpenAI" ? "GPT-4 model" : "Claude Sonnet"}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground font-medium">Connected</span>
        </div>

        {/* Database Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg border border-border hover:bg-muted transition-colors">
              <Database className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">{activeDb.label}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {DATABASES.map((db) => (
              <DropdownMenuItem
                key={db.id}
                onClick={() => onDatabaseChange(db.id)}
                className={cn("text-xs", database === db.id && "bg-accent text-accent-foreground font-semibold")}
              >
                <div className="flex items-start gap-2.5">
                  <Database className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{db.label}</div>
                    <div className="text-muted-foreground text-[10px]">{db.description}</div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          P
        </div>
      </div>
    </div>
  );
}