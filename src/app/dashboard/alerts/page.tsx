"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAlerts, createAlert, deleteAlert, toggleAlert } from "@/lib/store";
import { mockMarketData } from "@/lib/data";
import type { PriceAlert } from "@/lib/types";

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reload = () => {
    if (user) setAlerts(getAlerts(user.id));
  };

  useEffect(() => { reload(); }, [user]);

  const handleCreate = () => {
    if (!symbol) { setError("Select a stock"); return; }
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) { setError("Enter a valid target price"); return; }
    const stock = mockMarketData.find((m) => m.symbol === symbol);
    if (!stock) { setError("Invalid stock"); return; }

    createAlert(user!.id, symbol, stock.name, price, direction);
    setSuccess(`Alert created for ${symbol}`);
    setError("");
    setShowCreate(false);
    setSymbol("");
    setTargetPrice("");
    reload();
  };

  const handleDelete = (id: string) => {
    deleteAlert(user!.id, id);
    reload();
  };

  const handleToggle = (id: string) => {
    toggleAlert(user!.id, id);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Alerts</h1>
          <p className="text-gray-500 mt-1">Get notified when stocks hit your target price</p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); setError(""); setSuccess(""); }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Alert
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Create Price Alert</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="">Select a stock</option>
              {mockMarketData.map((m) => (
                <option key={m.symbol} value={m.symbol}>{m.symbol} - {m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Price (₦)</label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Enter target price"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alert When</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDirection("above")}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${direction === "above" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                Price goes Above
              </button>
              <button
                onClick={() => setDirection("below")}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${direction === "below" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                Price goes Below
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}
          <button onClick={handleCreate} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            Create Alert
          </button>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts Yet</h3>
          <p className="text-gray-500">Create your first price alert to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const stock = mockMarketData.find((m) => m.symbol === alert.symbol);
            const currentPrice = stock?.price || 0;
            const isTriggered = alert.direction === "above" ? currentPrice >= alert.targetPrice : currentPrice <= alert.targetPrice;

            return (
              <div key={alert.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between ${isTriggered && alert.active ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${alert.direction === "above" ? "bg-emerald-100" : "bg-red-100"}`}>
                    <svg className={`w-6 h-6 ${alert.direction === "above" ? "text-emerald-600" : "text-red-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={alert.direction === "above" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{alert.symbol} <span className="text-gray-400 font-normal">{alert.name}</span></p>
                    <p className="text-sm text-gray-500">
                      {alert.direction === "above" ? "Above" : "Below"} ₦{alert.targetPrice.toLocaleString()}
                      {isTriggered && alert.active && <span className="ml-2 text-amber-600 font-medium">TRIGGERED</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(alert.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${alert.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {alert.active ? "Active" : "Paused"}
                  </button>
                  <button onClick={() => handleDelete(alert.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
