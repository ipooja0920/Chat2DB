import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from "lucide-react";

export default function FeedbackSection({ messageId, onFeedback, loading }) {
  const [feedback, setFeedback] = useState(null); // "positive" | "negative" | null
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  const handleFeedback = (type) => {
    setFeedback(type);
    setShowComment(true);
  };

  const handleSubmit = () => {
    if (!comment.trim() && feedback) {
      onFeedback(messageId, feedback, "");
      setFeedback(null);
      setShowComment(false);
      setComment("");
      return;
    }
    if (comment.trim()) {
      onFeedback(messageId, feedback, comment.trim());
      setFeedback(null);
      setShowComment(false);
      setComment("");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Was this helpful?</span>
      </div>

      {!showComment ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFeedback("positive")}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              feedback === "positive"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            Yes
          </button>
          <button
            onClick={() => handleFeedback("negative")}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              feedback === "negative"
                ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            No
          </button>
        </div>
      ) : (
        <div className="space-y-3 bg-secondary/40 rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <label className="text-xs font-semibold text-muted-foreground">
              {feedback === "positive" ? "Any additional feedback?" : "What could be improved?"}
            </label>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              feedback === "positive"
                ? "Optional: Share what you liked about this answer..."
                : "Describe what was wrong or could be better. Include the correct question/answer if interpretation was off."
            }
            className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            rows="3"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setFeedback(null);
                setShowComment(false);
                setComment("");
              }}
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}