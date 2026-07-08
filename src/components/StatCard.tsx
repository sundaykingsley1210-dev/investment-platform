"use client";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changePercent?: number;
  icon?: string;
  subtitle?: string;
}

export default function StatCard({ title, value, change, changePercent, subtitle }: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {(change !== undefined || changePercent !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          <span className={`inline-flex items-center text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
            <svg className={`w-4 h-4 mr-0.5 ${isPositive ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {isPositive ? "+" : ""}{change !== undefined ? `$${Math.abs(change).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
            {changePercent !== undefined && (
              <span className="ml-1">({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)</span>
            )}
          </span>
        </div>
      )}
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
