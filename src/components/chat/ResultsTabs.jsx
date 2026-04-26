import React from "react";
import { Download, Maximize2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = ["Results", "Chart", "SQL", "Explanation", "Context"];

export default function ResultsTabs({ activeTab, onTabChange }) {
  return (
    <div className="px-6 flex items-center justify-between border-b border-border">
      <div className="flex items-center gap-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
          <Download className="w-3.5 h-3.5" />
          Download
          <ChevronDown className="w-3 h-3" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}