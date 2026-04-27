import React, { useState, useRef, useEffect } from "react";
import { Download, Maximize2, Minimize2, ChevronDown, FileText, Table2, BarChart3, Code2, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = ["Results", "Chart", "SQL", "Explanation", "Context", "Anomalies"];

export default function ResultsTabs({ activeTab, onTabChange, onExportPdf, onToggleExpand, expanded }) {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDownloadOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
        {/* Download dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDownloadOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
            <ChevronDown className="w-3 h-3" />
          </button>
          {downloadOpen && (
            <div className="absolute top-full mt-1 right-0 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[160px]">
              <button
                onClick={() => { onExportPdf?.(); setDownloadOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-secondary transition-colors text-left"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                Export as PDF
              </button>
            </div>
          )}
        </div>

        {/* Expand / collapse */}
        <button
          onClick={onToggleExpand}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}