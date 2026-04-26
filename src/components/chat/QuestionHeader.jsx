import React from "react";
import { Bot, Star, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuestionHeader({ question, time, intent, mode, sources, isFavorite, onToggleFavorite }) {
  return (
    <div className="px-6 py-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-5 h-5 text-accent-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-foreground leading-snug">
            {question}
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{time}</span>
            <button
              onClick={onToggleFavorite}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-4 h-4 transition-colors ${
                  isFavorite
                    ? "text-amber-400 fill-amber-400"
                    : "text-muted-foreground/40 hover:text-amber-400"
                }`}
              />
            </button>
            <MoreVertical className="w-4 h-4 text-muted-foreground/40 cursor-pointer hover:text-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {intent && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[11px] font-medium px-2.5 py-0.5">
              Intent: {intent}
            </Badge>
          )}
          {mode && (
            <Badge variant="outline" className="text-primary border-primary/20 bg-accent text-[11px] font-medium px-2.5 py-0.5">
              Mode: {mode}
            </Badge>
          )}
          {sources && (
            <Badge variant="outline" className="text-muted-foreground border-border bg-secondary text-[11px] font-medium px-2.5 py-0.5">
              {sources}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}