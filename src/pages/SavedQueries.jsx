import React, { useState } from "react";
import { Bookmark, Trash2, AlertCircle, BookmarkX, Code2, Database } from "lucide-react";
import { getDatabaseById } from "@/lib/queryEngine";

const MAX_SAVED = 20;

export default function SavedQueries({ savedQueries, onRemove, onSelectQuery }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="px-8 pt-8 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bookmark className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Saved Queries</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium bg-secondary px-2.5 py-1 rounded-full">
            {savedQueries.length} / {MAX_SAVED}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Questions and their SQL queries saved for reuse.</p>
      </div>

      {/* Warning note */}
      <div className="px-8 pt-4 pb-0">
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-primary/80 leading-relaxed">
            <span className="font-semibold">You can only store {MAX_SAVED} saved queries.</span> The oldest entry will be removed when the limit is reached. Copy the SQL before removing if you need it.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {savedQueries.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-12">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <BookmarkX className="w-7 h-7 opacity-40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No saved queries yet</p>
            <p className="text-xs mt-1 opacity-70">Go to the SQL tab on any query and click "Save Query".</p>
          </div>
        </div>
      )}

      {/* Saved queries list */}
      <div className="flex-1 overflow-y-auto px-8 py-5 space-y-4">
        {savedQueries.map((item, idx) => (
          <SavedQueryCard
            key={item.id}
            item={item}
            index={idx + 1}
            total={savedQueries.length}
            onRemove={() => onRemove(item.id)}
            onSelect={() => onSelectQuery?.(item)}
          />
        ))}
      </div>
    </div>
  );
}

function SavedQueryCard({ item, index, total, onRemove, onSelect }) {
  const [copied, setCopied] = React.useState(false);

  const savedDate = item.savedAt
    ? new Date(item.savedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(item.sql_query || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bookmark className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={onSelect}
            className="text-left text-sm font-semibold text-foreground hover:text-primary transition-colors leading-snug line-clamp-2"
          >
            {item.question}
          </button>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.intent && (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full font-medium">
                {item.intent}
              </span>
            )}
            {item.pipeline && (
              <span className="text-[10px] px-2 py-0.5 bg-accent text-accent-foreground border border-primary/20 rounded-full font-medium">
                {item.pipeline}
              </span>
            )}
            {item.database && (
              <span className="text-[10px] px-2 py-0.5 bg-secondary text-muted-foreground border border-border rounded-full font-medium flex items-center gap-1">
                <Database className="w-2.5 h-2.5" />
                {getDatabaseById(item.database).label}
              </span>
            )}
            {savedDate && (
              <span className="text-[10px] text-muted-foreground ml-auto">Saved {savedDate}</span>
            )}
          </div>
        </div>
      </div>

      {/* SQL preview */}
      {item.sql_query && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Code2 className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">SQL</span>
          </div>
          <pre className="bg-secondary/60 rounded-lg px-3 py-2 text-[11px] font-mono text-foreground whitespace-pre-wrap border border-border/50 max-h-40 overflow-y-auto">
            {item.sql_query}
          </pre>
        </div>
      )}

      {/* Action footer */}
      <div className="px-5 py-3 border-t border-border bg-secondary/20 flex items-center justify-between gap-3">
        <span className="text-[10px] text-muted-foreground font-medium">#{index} of {total}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-foreground border border-border bg-secondary hover:bg-muted rounded-lg transition-colors"
          >
            {copied ? "Copied!" : "Copy SQL"}
          </button>
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}