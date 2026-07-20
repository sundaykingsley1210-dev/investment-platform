"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getHoldings, sellStock, getCashBalance } from "@/lib/store";
import BarChart from "@/components/BarChart";
import { mockMarketData } from "@/lib/data";

export default function PortfolioPage() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<ReturnType<typeof getHoldings>>([]);
  const [sellModal, setSellModal] = useState<{ symbol: string; name: string; shares: number; price: number } | null>(null);
  const [sellShares, setSellShares] = useState(1);
  const [sellError, setSellError] = useState("");
  const [sellSuccess, setSellSuccess] = useState("");

  const reload = () => {
    if (user) setHoldings(getHoldings(user.id));
  };

  useEffect(() => { reload(); }, [user]);

  const totalValue = useMemo(() => holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0), [holdings]);
  const totalCost = useMemo(() => holdings.reduce((s, h) => s + h.shares * h.avgCost, 0), [holdings]);
  const totalGain = totalValue - totalCost;

  const openSell = (h: typeof holdings[0]) => {
    setSellModal({ symbol: h.symbol, name: h.name, shares: h.shares, price: h.currentPrice });
    setSellShares(1);
    setSellError("");
    setSellSuccess("");
  };

  const handleSell = () => {
    if (!sellModal || !user) return;
    if (sellShares > sellModal.shares) { setSellError("Not enough shares"); return; }
    const ok = sellStock(user.id, sellModal.symbol, sellShares, sellModal.price);
    if (ok) {
      reload();
      setSellSuccess(`Sold ₦{sellShares} share₦{sellShares > 1 ? "s" : ""} of ₦{sellModal.symbol}`);
      setSellError("");
    } else {
      setSellError("Transaction failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <p className="text-gray-500 mt-1">All your investment holdings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">₦{totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900">₦{totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Gain/Loss</p>
          <p className={`text-2xl font-bold ₦{totalGain >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {totalGain >= 0 ? "+" : ""}₦{totalGain.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {holdings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Holdings by Value</h3>
          <BarChart
            labels={holdings.map((h) => h.symbol)}
            values={holdings.map((h) => (h.shares * h.currentPrice / totalValue) * 100)}
            height={250}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {holdings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No holdings yet. Buy your first stock from the Market page.</p>
            <a href="/dashboard/market" className="text-emerald-600 font-medium hover:text-emerald-700">Go to Market</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Symbol</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Sector</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Shares</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Avg Cost</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Current</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Gain/Loss</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Value</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const gain = (h.currentPrice - h.avgCost) * h.shares;
                  const gainPct = ((h.currentPrice - h.avgCost) / h.avgCost) * 100;
                  return (
                    <tr key={h.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{h.symbol}</span>
                        <span className="text-gray-400 ml-2 text-xs hidden sm:inline">{h.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">{h.sector}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{h.shares}</td>
                      <td className="px-6 py-4 text-right text-gray-900">₦{h.avgCost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-gray-900">₦{h.currentPrice.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-right font-medium ₦{gain >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {gain >= 0 ? "+" : ""}₦{gain.toFixed(2)}
                        <span className="text-xs ml-1">({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        ₦{(h.shares * h.currentPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openSell(h)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sell {sellModal.symbol}</h3>
              <button onClick={() => setSellModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">{sellModal.name}</p>
                <p className="text-2xl font-bold text-gray-900">₦{sellModal.price.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shares to Sell (you own {sellModal.shares})</label>
                <input
                  type="number" min={1} max={sellModal.shares}
                  value={sellShares}
                  onChange={(e) => { setSellShares(Math.max(1, Math.min(sellModal.shares, parseInt(e.target.value) || 1))); setSellError(""); setSellSuccess(""); }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg"
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-gray-600">You&apos;ll Receive</span>
                <span className="text-xl font-bold text-emerald-600">₦{(sellShares * sellModal.price).toFixed(2)}</span>
              </div>
              {sellError && <p className="text-sm text-red-600">{sellError}</p>}
              {sellSuccess && <p className="text-sm text-emerald-600 font-medium">{sellSuccess}</p>}
              <button onClick={handleSell} className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors">
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
