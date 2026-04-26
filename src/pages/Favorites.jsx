import React from "react";
import { Star, FileText, Trash2, AlertCircle, BookmarkX } from "lucide-react";
import { exportFavoriteToPdf } from "@/lib/exportFavoritePdf";

const MAX_FAVORITES = 20;

export default function Favorites({ favorites, onRemove, onSelectFavorite }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="px-8 pt-8 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Favorites</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium bg-secondary px-2.5 py-1 rounded-full">
            {favorites.length} / {MAX_FAVORITES}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Saved queries and insights for quick reference.</p>
      </div>

      {/* Warning note */}
      <div className="px-8 pt-4 pb-0">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">You can only store {MAX_FAVORITES} favorites.</span> Please download the PDF of any favorites you'd like to keep before adding new ones — the oldest entry will be removed when the limit is reached.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {favorites.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-12">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <BookmarkX className="w-7 h-7 opacity-40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No favorites yet</p>
            <p className="text-xs mt-1 opacity-70">Click the ☆ star on any query to save it here.</p>
          </div>
        </div>
      )}

      {/* Favorites list */}
      <div className="flex-1 overflow-y-auto px-8 py-5 space-y-4">
        {favorites.map((fav, idx) => (
          <FavoriteCard
            key={fav.id}
            fav={fav}
            index={idx + 1}
            total={favorites.length}
            onRemove={() => onRemove(fav.id)}
            onSelect={() => onSelectFavorite?.(fav)}
          />
        ))}
      </div>
    </div>
  );
}

function FavoriteCard({ fav, index, total, onRemove, onSelect }) {
  const savedDate = fav.savedAt
    ? new Date(fav.savedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={onSelect}
            className="text-left text-sm font-semibold text-foreground hover:text-primary transition-colors leading-snug line-clamp-2"
          >
            {fav.question}
          </button>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {fav.intent && (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full font-medium">
                {fav.intent}
              </span>
            )}
            {fav.pipeline && (
              <span className="text-[10px] px-2 py-0.5 bg-accent text-accent-foreground border border-primary/20 rounded-full font-medium">
                {fav.pipeline}
              </span>
            )}
            {savedDate && (
              <span className="text-[10px] text-muted-foreground ml-auto">Saved {savedDate}</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary snippet */}
      {fav.summary && (
        <div className="px-5 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic bg-secondary/50 rounded-lg px-3 py-2">
            {fav.summary}
          </p>
        </div>
      )}

      {/* Stats row */}
      {fav.stats?.length > 0 && (
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto">
          {fav.stats.slice(0, 4).map((s, i) => (
            <div key={i} className="flex-shrink-0 bg-secondary/60 rounded-lg px-3 py-1.5 text-center min-w-[80px]">
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-xs font-bold text-foreground mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action footer */}
      <div className="px-5 py-3 border-t border-border bg-secondary/20 flex items-center justify-between gap-3">
        <span className="text-[10px] text-muted-foreground font-medium">#{index} of {total}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFavoriteToPdf(fav)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-primary border border-primary/30 bg-accent hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
          >
            <FileText className="w-3 h-3" />
            Export PDF
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