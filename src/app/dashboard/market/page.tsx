"use client";

import { useState, useEffect, useCallback } from "react";
import { mockMarketData } from "@/lib/data";
import { buyStock, getCashBalance } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import type { MarketData } from "@/lib/types";

export default function MarketPage() {
  const { user } = useAuth();
  const [data, setData] = useState<MarketData[]>(mockMarketData);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"symbol" | "price" | "changePercent" | "volume">("symbol");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [buyModal, setBuyModal] = useState<MarketData | null>(null);
  const [buyShares, setBuyShares] = useState(1);
  const [buyError, setBuyError] = useState("");
  const [buySuccess, setBuySuccess] = useState("");
  const [cash, setCash] = useState(0);

  useEffect(() => {
    if (user) setCash(getCashBalance(user.id));
  }, [user]);

  const simulateUpdate = useCallback(() => {
    setData((prev) =>
      prev.map((item) => {
        const delta = (Math.random() - 0.5) * 2;
        const newChange = item.change + delta;
        const newPrice = item.price + delta;
        return {
          ...item,
          price: Math.round(newPrice * 100) / 100,
          change: Math.round(newChange * 100) / 100,
          changePercent: Math.round((newChange / (newPrice - newChange)) * 10000) / 100,
        };
      })
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(simulateUpdate, 3000);
    return () => clearInterval(interval);
  }, [simulateUpdate]);

  const filtered = data
    .filter((m) => m.symbol.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "symbol") return mul * a.symbol.localeCompare(b.symbol);
      if (sortKey === "price") return mul * (a.price - b.price);
      if (sortKey === "changePercent") return mul * (a.changePercent - b.changePercent);
      return mul * (a.volume.localeCompare(b.volume));
    });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const openBuy = (stock: MarketData) => {
    setBuyModal(stock);
    const minShares = Math.ceil(5000 / stock.price);
    setBuyShares(minShares);
    setBuyError("");
    setBuySuccess("");
  };

  const handleBuy = () => {
    if (!buyModal || !user) return;
    const total = buyShares * buyModal.price;
    if (total < 5000) {
      setBuyError("Minimum purchase is ₦5,000");
      return;
    }
    if (total > cash) {
      setBuyError("Insufficient funds");
      return;
    }
    const sectorMap: Record<string, string> = {
      AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology", AMZN: "Consumer Cyclical",
      NVDA: "Technology", TSLA: "Consumer Cyclical", META: "Technology", JPM: "Financial Services",
      V: "Financial Services", JNJ: "Healthcare", WMT: "Consumer Defensive", PG: "Consumer Defensive",
    };
    const ok = buyStock(user.id, buyModal.symbol, buyModal.name, sectorMap[buyModal.symbol] || "Other", buyShares, buyModal.price);
    if (ok) {
      setCash(getCashBalance(user.id));
      setBuySuccess(`Successfully bought ${buyShares} share${buyShares > 1 ? "s" : ""} of ${buyModal.symbol}!`);
      setBuyError("");
    } else {
      setBuyError("Transaction failed");
    }
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: string }) => (
    <svg className={`w-3 h-3 ml-1 inline ${active ? "text-emerald-600" : "text-gray-400"} ${active && dir === "desc" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Data</h1>
          <p className="text-gray-500 mt-1">Real-time stock prices (simulated)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 px-4 py-2 rounded-lg">
            <p className="text-xs text-emerald-600">Cash Balance</p>
            <p className="text-lg font-bold text-emerald-700">₦{cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stocks..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 px-3 py-2 rounded-lg">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">Live</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => toggleSort("symbol")}>
                  Symbol <SortIcon active={sortKey === "symbol"} dir={sortDir} />
                </th>
                <th className="text-right px-6 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => toggleSort("price")}>
                  Price <SortIcon active={sortKey === "price"} dir={sortDir} />
                </th>
                <th className="text-right px-6 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => toggleSort("changePercent")}>
                  Change <SortIcon active={sortKey === "changePercent"} dir={sortDir} />
                </th>
                <th className="text-right px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Volume</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Market Cap</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.symbol} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{m.symbol}</span>
                    <span className="text-gray-400 ml-2 text-xs">{m.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">₦{m.price.toFixed(2)}</td>
                  <td className={`px-6 py-4 text-right font-medium ${m.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {m.changePercent >= 0 ? "+" : ""}{m.changePercent.toFixed(2)}%
                    <span className="text-xs ml-1">
                      ({m.change >= 0 ? "+" : ""}₦{Math.abs(m.change).toFixed(2)})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell">{m.volume}</td>
                  <td className="px-6 py-4 text-right text-gray-500 hidden md:table-cell">{m.marketCap}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openBuy(m)}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Buy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {buyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Buy {buyModal.symbol}</h3>
              <button onClick={() => setBuyModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">{buyModal.name}</p>
                <p className="text-2xl font-bold text-gray-900">₦{buyModal.price.toFixed(2)}</p>
                <p className={`text-sm font-medium ${buyModal.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {buyModal.changePercent >= 0 ? "+" : ""}{buyModal.changePercent.toFixed(2)}%
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Shares (min ₦5,000)</label>
                <input
                  type="number"
                  min={1}
                  value={buyShares}
                  onChange={(e) => { setBuyShares(Math.max(1, parseInt(e.target.value) || 1)); setBuyError(""); setBuySuccess(""); }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-gray-600">Total Cost</span>
                <span className="text-xl font-bold text-gray-900">₦{(buyShares * buyModal.price).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>Your Balance</span>
                <span>₦{cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>

              {buyError && <p className="text-sm text-red-600">{buyError}</p>}
              {buySuccess && <p className="text-sm text-emerald-600 font-medium">{buySuccess}</p>}

              <button
                onClick={handleBuy}
                disabled={buyShares < 1}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
