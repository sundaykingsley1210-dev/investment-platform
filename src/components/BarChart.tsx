"use client";

interface BarChartProps {
  labels: string[];
  values: number[];
  colors?: string[];
  height?: number;
}

export default function BarChart({ labels, values, colors, height = 200 }: BarChartProps) {
  if (!values.length) return null;

  const max = Math.max(...values.map(Math.abs));
  const defaultColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];
  const barColors = colors || defaultColors;

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end gap-2 h-full px-2">
        {values.map((val, i) => {
          const pct = (Math.abs(val) / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-xs text-gray-500 mb-1">
                {val >= 0 ? "+" : ""}{val.toFixed(1)}%
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${pct}%`,
                  backgroundColor: val >= 0 ? barColors[i % barColors.length] : "#ef4444",
                  minHeight: "4px",
                }}
              />
              <span className="text-xs text-gray-600 mt-2 text-center leading-tight">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
