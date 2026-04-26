import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function OverflowDialog({ oldest, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">Favorites limit reached</h3>
            <p className="text-xs text-muted-foreground mt-0.5">You already have 20 saved favorites</p>
          </div>
          <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-5">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Adding this favorite will <span className="font-medium text-foreground">remove the oldest entry</span>:
          </p>
          <div className="bg-secondary/60 border border-border rounded-xl px-4 py-3 mb-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Will be removed</p>
            <p className="text-sm font-medium text-foreground line-clamp-2">{oldest?.question}</p>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            We recommend downloading the PDF of that favorite before removing it. Would you like to continue?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Yes, continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}