import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | null;
  hint?: string;
}

export default function StatCard({ 
  label, 
  value, 
  icon, 
  trend, 
  hint 
}: StatCardProps) {
  return (
    <div className="rounded-[18px] bg-[hsl(var(--bg-snow))] dark:bg-gray-800 shadow-[var(--shadow)] border border-black/5 dark:border-white/10 p-6 hover:shadow-lg active:scale-[1.03] transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-sm text-black/60 dark:text-white/70 mb-2">
            {label}
          </div>
          <div className="text-2xl font-semibold text-[#101030] dark:text-white flex items-baseline gap-2">
            {value}
            {trend && (
              <span className={`text-sm font-medium ${
                trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}>
                {trend === "up" ? "↗" : "↘"}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="text-xl text-black/40 dark:text-white/50">
            {icon}
          </div>
        )}
      </div>
      
      {hint && (
        <div className="mt-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#F0D070] dark:bg-[#F0D070]/80 text-[#101030]">
            {hint}
          </span>
        </div>
      )}
    </div>
  );
}