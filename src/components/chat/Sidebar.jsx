import React from "react";
import { Plus, LayoutDashboard, Database, BookmarkCheck, Star, Search, LogOut, MessageSquare, MoreHorizontal, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar({ conversations, activeConversation, onSelectConversation, onNewQuestion, activePage, onNavigate, favoritesCount, savedQueriesCount }) {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Database, label: "Explore Schema" },
    { icon: BookmarkCheck, label: "Saved Queries", badge: savedQueriesCount },
    { icon: Star, label: "Favorites", badge: favoritesCount },
    { icon: FlaskConical, label: "Evals" },
  ];
  return (
    <div className="w-[240px] min-w-[240px] h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">Chat2DB</h1>
          <p className="text-sidebar-foreground text-[11px] opacity-60">AI SQL Analyst</p>
        </div>
      </div>

      {/* New Question Button */}
      <div className="px-4 mb-4">
        <button
          onClick={onNewQuestion}
          className="w-full flex items-center justify-center gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground rounded-lg py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Question
        </button>
      </div>

      {/* Nav Links */}
      <nav className="px-3 space-y-0.5 mb-6">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate?.(item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors",
              activePage === item.label
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="w-4 h-4 opacity-70 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge > 0 && (
              <span className="text-[10px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full leading-none">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Conversation History */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Conversation History
          </span>
          <Search className="w-3.5 h-3.5 text-sidebar-foreground/40 cursor-pointer hover:text-sidebar-foreground/70" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg transition-colors group",
                activeConversation === conv.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <div className="flex items-start justify-between">
                <p className="text-[13px] font-medium leading-tight line-clamp-2 pr-2">
                  {conv.title}
                </p>
                <MoreHorizontal className={cn(
                  "w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity mt-0.5",
                  activeConversation === conv.id && "opacity-60"
                )} />
              </div>
              <p className={cn(
                "text-[11px] mt-1 opacity-50",
                activeConversation === conv.id ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
              )}>
                {conv.time}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-[13px] transition-colors">
          <LogOut className="w-4 h-4 opacity-70" />
          Logout
        </button>
      </div>
    </div>
  );
}