"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getTransactions } from "@/lib/store";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "buy" | "sell" | "dividend" | "deposit" | "withdrawal">("all");
  const [txs, setTxs] = useState<ReturnType<typeof getTransactions>>([]);

  useEffect(() => {
    if (user) setTxs(getTransactions(user.id));
  }, [user]);

  const filtered = filter === "all" ? txs : txs.filter((t) => t.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">Your recent investment activity</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "buy", "sell", "dividend", "deposit", "withdrawal"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No transactions yet. Buy your first stock from the Market page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Symbol</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Shares</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.type === "buy"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.type === "sell"
                            ? "bg-red-100 text-red-700"
                            : t.type === "deposit"
                            ? "bg-blue-100 text-blue-700"
                            : t.type === "withdrawal"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {t.type === "buy" ? "BUY" : t.type === "sell" ? "SELL" : t.type === "deposit" ? "DEP" : t.type === "withdrawal" ? "W/D" : "DIV"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{t.symbol}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{t.shares}</td>
                    <td className="px-6 py-4 text-right text-gray-900">₦{t.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">₦{t.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
