import React from "react";
import { Info, Moon, Database, ChevronDown } from "lucide-react";

export default function TopBar() {
  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Mode:</span>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full border border-border">
          <span className="text-xs font-semibold text-foreground">Hybrid (RAG + TAG)</span>
        </div>
        <Info className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground font-medium">Connected</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg border border-border hover:bg-muted transition-colors">
          <Database className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Chinook DB</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <Moon className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          P
        </div>
      </div>
    </div>
  );
}