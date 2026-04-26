import React from "react";
import { DollarSign, Globe, TrendingUp, Clock, Users, Layers } from "lucide-react";

const iconMap = {
  dollar: DollarSign,
  globe: Globe,
  trending: TrendingUp,
  clock: Clock,
  users: Users,
  layers: Layers,
};

const colorMap = {
  purple: "bg-primary/10 text-primary",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
};

export default function StatsCards({ stats }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="px-6 pb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = iconMap[stat.icon] || DollarSign;
          const color = colorMap[stat.color] || colorMap.purple;
          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-sm font-bold text-foreground leading-tight mt-0.5">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}