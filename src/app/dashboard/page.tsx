"use client";

import { useMemo, useState, useEffect } from "react";
import StatCard from "@/components/StatCard";
import LineChart from "@/components/LineChart";
import BarChart from "@/components/BarChart";
import { useAuth } from "@/lib/auth-context";
import { mockMarketData } from "@/lib/data";
import { getHoldings, getPortfolioSummary, generateChartData } from "@/lib/store";

export default function DashboardPage() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<ReturnType<typeof getHoldings>>([]);
  const [summary, setSummary] = useState({ totalValue: 0, totalGain: 0, totalGainPercent: 0, dayChange: 0, dayChangePercent: 0, cashBalance: 10000 });
  const [chartData, setChartData] = useState<ReturnType<typeof generateChartData>>([]);

  useEffect(() => {
    if (user) {
      const h = getHoldings(user.id);
      setHoldings(h);
      setSummary(getPortfolioSummary(user.id));
      setChartData(generateChartData(user.id));
    }
  }, [user]);

  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {};
    holdings.forEach((h) => {
      const val = h.shares * h.currentPrice;
      sectors[h.sector] = (sectors[h.sector] || 0) + val;
    });
    return sectors;
  }, [holdings]);

  const topMovers = useMemo(
    () => [...mockMarketData].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6),
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Portfolio Value" value={`₦${summary.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} change={summary.totalGain} changePercent={summary.totalGainPercent} />
        <StatCard title="Day Change" value={`₦${Math.abs(summary.dayChange).toLocaleString("en-US", { minimumFractionDigits: 2 })}`} change={summary.dayChange} changePercent={summary.dayChangePercent} />
        <StatCard title="Cash Balance" value={`₦${summary.cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} subtitle="Available to invest" />
        <StatCard title="Total Holdings" value={holdings.length.toString()} subtitle="Active positions" />
      </div>

      {holdings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Holdings Yet</h3>
          <p className="text-gray-500 mb-4">Start investing by buying your first stock from the Market page.</p>
          <a href="/dashboard/market" className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            Browse Market
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance (30 days)</h3>
              <LineChart data={chartData} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sector Allocation</h3>
              {Object.keys(sectorData).length > 0 ? (
                <BarChart
                  labels={Object.keys(sectorData)}
                  values={Object.values(sectorData).map((v) => (v / summary.totalValue) * 100)}
                />
              ) : (
                <p className="text-gray-400 text-sm">No data yet</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Holdings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-500">Symbol</th>
                      <th className="text-right py-3 font-medium text-gray-500">Price</th>
                      <th className="text-right py-3 font-medium text-gray-500">Change</th>
                      <th className="text-right py-3 font-medium text-gray-500">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.slice(0, 5).map((h) => (
                      <tr key={h.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3">
                          <span className="font-medium text-gray-900">{h.symbol}</span>
                          <span className="text-gray-400 ml-2">{h.name}</span>
                        </td>
                        <td className="py-3 text-right text-gray-900">₦{h.currentPrice.toFixed(2)}</td>
                        <td className={`py-3 text-right font-medium ${h.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {h.changePercent >= 0 ? "+" : ""}{h.changePercent.toFixed(2)}%
                        </td>
                        <td className="py-3 text-right text-gray-900">₦{(h.shares * h.currentPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Movers</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-500">Symbol</th>
                      <th className="text-right py-3 font-medium text-gray-500">Price</th>
                      <th className="text-right py-3 font-medium text-gray-500">Change</th>
                      <th className="text-right py-3 font-medium text-gray-500">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMovers.map((m) => (
                      <tr key={m.symbol} className="border-b border-gray-100 last:border-0">
                        <td className="py-3">
                          <span className="font-medium text-gray-900">{m.symbol}</span>
                          <span className="text-gray-400 ml-2">{m.name}</span>
                        </td>
                        <td className="py-3 text-right text-gray-900">₦{m.price.toFixed(2)}</td>
                        <td className={`py-3 text-right font-medium ${m.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {m.changePercent >= 0 ? "+" : ""}{m.changePercent.toFixed(2)}%
                        </td>
                        <td className="py-3 text-right text-gray-500">{m.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
