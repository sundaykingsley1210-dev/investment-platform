"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCashBalance, depositFunds, withdrawFunds, getTransactions } from "@/lib/store";

export default function DepositPage() {
  const { user } = useAuth();
  const [cash, setCash] = useState(0);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  const reload = () => {
    if (user) setCash(getCashBalance(user.id));
  };

  useEffect(() => { reload(); }, [user]);

  const handleDeposit = () => {
    const val = parseFloat(amount);
    if (!val || val < 5000) { setError("Minimum deposit is ₦5,000"); return; }
    const ok = depositFunds(user!.id, val);
    if (ok) {
      reload();
      setSuccess(`Deposited ₦${val.toLocaleString()} successfully!`);
      setAmount("");
      setError("");
    } else {
      setError("Deposit failed");
    }
  };

  const handleWithdraw = () => {
    const val = parseFloat(amount);
    if (!val || val < 5000) { setError("Minimum withdrawal is ₦5,000"); return; }
    if (val > cash) { setError("Insufficient balance"); return; }
    const ok = withdrawFunds(user!.id, val);
    if (ok) {
      reload();
      setSuccess(`Withdrew ₦${val.toLocaleString()} successfully!`);
      setAmount("");
      setError("");
    } else {
      setError("Withdrawal failed");
    }
  };

  const txs = user ? getTransactions(user.id).filter((t) => t.type === "deposit" || t.type === "withdrawal") : [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deposit & Withdraw</h1>
        <p className="text-gray-500 mt-1">Manage your funds</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">Available Balance</p>
          <p className="text-4xl font-bold text-emerald-600">₦{cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setTab("deposit"); setError(""); setSuccess(""); }}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${tab === "deposit" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Deposit
          </button>
          <button
            onClick={() => { setTab("withdraw"); setError(""); setSuccess(""); }}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${tab === "withdraw" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Withdraw
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
            <input
              type="number"
              min={5000}
              step={1000}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); setSuccess(""); }}
              placeholder="Enter amount (min ₦5,000)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg"
            />
          </div>

          <div className="flex gap-2">
            {[5000, 10000, 25000, 50000].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                ₦{(val / 1000).toFixed(0)}k
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}

          <button
            onClick={tab === "deposit" ? handleDeposit : handleWithdraw}
            className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${tab === "deposit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {tab === "deposit" ? "Deposit Funds" : "Withdraw Funds"}
          </button>
        </div>
      </div>

      {txs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {txs.slice(0, 10).map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === "deposit" ? "bg-emerald-100" : "bg-red-100"}`}>
                    <svg className={`w-5 h-5 ${t.type === "deposit" ? "text-emerald-600" : "text-red-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={t.type === "deposit" ? "M12 4v16m8-8H4" : "M20 12H4"} />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{t.type}</p>
                    <p className="text-xs text-gray-500">{t.date}</p>
                  </div>
                </div>
                <span className={`font-semibold ${t.type === "deposit" ? "text-emerald-600" : "text-red-600"}`}>
                  {t.type === "deposit" ? "+" : "-"}₦{t.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
