import React from "react";
import { Table2, GitFork, Sparkles, Clock } from "lucide-react";

export default function ContextView({ queryData }) {
  if (!queryData) return null;

  const executionTime = queryData.execution_time_ms ? `${queryData.execution_time_ms}ms` : "—";
  const tablesCount = queryData.tables_count || 0;
  const sourcesCount = queryData.sources_count || 0;

  // Extract table names from SQL query
  const extractTablesFromSQL = (sql) => {
    if (!sql) return [];
    const tables = new Set();
    
    // Extract FROM table
    const fromMatch = sql.match(/FROM\s+([A-Za-z0-9_]+)/i);
    if (fromMatch) tables.add(fromMatch[1]);
    
    // Extract JOIN tables
    const joinMatches = sql.matchAll(/(?:INNER|LEFT|RIGHT|FULL)?\s*JOIN\s+([A-Za-z0-9_]+)/gi);
    for (const match of joinMatches) {
      if (match[1]) tables.add(match[1]);
    }
    
    return Array.from(tables).slice(0, 10);
  };

  const tables = extractTablesFromSQL(queryData.sql_query) || [];

  // Parse relationships from SQL (simplified)
  const extractRelationships = (sql) => {
    if (!sql) return [];
    const joinMatches = sql.match(/(?:INNER|LEFT|RIGHT|FULL)?\s*JOIN\s+([A-Za-z0-9_]+)\s+ON\s+([A-Za-z0-9_\.]+)\s*=\s*([A-Za-z0-9_\.]+)/gi);
    if (!joinMatches) return [];
    return joinMatches.slice(0, 3).map((m) => {
      const parts = m.match(/JOIN\s+([A-Za-z0-9_]+)\s+ON\s+(.+?)\s*=\s*(.+?)$/i);
      return parts ? { table: parts[1], from: parts[2], to: parts[3] } : null;
    }).filter(Boolean);
  };

  const relationships = extractRelationships(queryData.sql_query) || [];

  // Mock RAG context (in real app, this would come from LLM response)
  const ragContext = queryData.rag_context || [
    { source: "Revenue is calculated as SUM(Total) from invoice table", similarity: 0.92 },
    { source: "Customer country is in Customer.BillingCountry", similarity: 0.91 },
    { source: "Invoice table contains billing and totals information", similarity: 0.89 },
  ];

  return (
    <div className="flex-1 p-6 overflow-auto space-y-6">
      {/* Tables Used */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Table2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Tables Used ({tables.length})</h3>
        </div>
        {tables.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tables.map((table) => (
              <span key={table} className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground">
                {table}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No tables detected</p>
        )}
      </div>

      {/* Relationships */}
      {relationships.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitFork className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-foreground">Relationships</h3>
          </div>
          <div className="space-y-2">
            {relationships.map((rel, idx) => (
              <div key={idx} className="px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-xs text-muted-foreground">
                <span className="text-foreground font-medium">{rel.from}</span>
                <span className="mx-2">→</span>
                <span className="text-foreground font-medium">{rel.table}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RAG Context */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">RAG Context (Top Sources)</h3>
        </div>
        <div className="space-y-2">
          {ragContext.slice(0, 3).map((item, idx) => (
            <div key={idx} className="px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg">
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{item.source}</p>
                <div className="flex items-center gap-1.5 flex-shrink-0 bg-emerald-500/10 px-2 py-1 rounded">
                  <span className="text-[10px] font-bold text-emerald-600">{(item.similarity * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {ragContext.length > 3 && (
          <button className="mt-3 text-xs text-primary font-medium hover:text-primary/80 transition-colors">
            Show all sources ({ragContext.length})
          </button>
        )}
      </div>

      {/* Query Metadata */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-foreground">Query Metadata</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="px-3 py-2 bg-secondary/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Execution Time</p>
            <p className="text-sm font-semibold text-foreground">{executionTime}</p>
          </div>
          <div className="px-3 py-2 bg-secondary/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Tables Involved</p>
            <p className="text-sm font-semibold text-foreground">{tablesCount || tables.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}