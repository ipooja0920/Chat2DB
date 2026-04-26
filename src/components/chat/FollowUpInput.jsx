import React, { useState } from "react";
import { Sparkles, SendHorizontal } from "lucide-react";

export default function FollowUpInput({ onSend }) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="px-6 py-4 border-t border-border bg-card">
      <div className="flex items-center gap-3 bg-secondary/60 rounded-xl px-4 py-3 border border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <Sparkles className="w-5 h-5 text-primary/60 flex-shrink-0" />
        <input
          type="text"
          placeholder="Ask a follow-up question..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
        />
        <button
          onClick={handleSubmit}
          className="w-9 h-9 rounded-lg bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground transition-colors flex-shrink-0"
        >
          <SendHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}