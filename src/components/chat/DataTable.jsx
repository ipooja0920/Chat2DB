import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DataTable({ columns, data, totalLabel }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPagePickerOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalPages = Math.ceil(data.length / perPage);
  const paginatedData = useMemo(
    () => data.slice((currentPage - 1) * perPage, currentPage * perPage),
    [data, currentPage, perPage]
  );

  const startRow = (currentPage - 1) * perPage + 1;
  const endRow = Math.min(currentPage * perPage, data.length);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto px-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-12">#</th>
              {columns.map((col) => (
                <th key={col.key} className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  "border-b border-border/50 hover:bg-secondary/50 transition-colors",
                  idx % 2 === 0 && "bg-secondary/20"
                )}
              >
                <td className="text-sm text-muted-foreground py-3 px-4">
                  {startRow + idx}
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="text-sm text-foreground py-3 px-4 font-medium">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {startRow} to {endRow} of {data.length} {totalLabel || "rows"}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                currentPage === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-secondary"
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {/* Page picker */}
          <div className="relative ml-2" ref={pickerRef}>
            <button
              onClick={() => setPagePickerOpen((o) => !o)}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:bg-secondary transition-colors"
            >
              {totalPages} {totalPages === 1 ? "page" : "pages"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {pagePickerOpen && (
              <div className="absolute bottom-full mb-1 right-0 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[80px]">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setCurrentPage(p); setPagePickerOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors",
                      currentPage === p && "bg-accent text-accent-foreground font-semibold"
                    )}
                  >
                    Page {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}