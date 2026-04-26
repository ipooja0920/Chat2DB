import React from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QueryTabs({ tabs, activeTab, onSelectTab, onCloseTab, onAddTab }) {
  return (
    <div className="flex items-center gap-1 px-5 pt-3 pb-0 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-medium cursor-pointer transition-all border border-b-0 max-w-[250px]",
            activeTab === tab.id
              ? "bg-card border-border text-foreground shadow-sm"
              : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <span className="truncate">{tab.title}</span>
          <X
            className="w-3 h-3 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
          />
        </div>
      ))}
      <button
        onClick={onAddTab}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}