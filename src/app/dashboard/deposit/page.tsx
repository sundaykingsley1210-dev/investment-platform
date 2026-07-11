"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCashBalance, withdrawFunds, createPayment, getUserPayments } from "@/lib/store";
import { validateCardNumber, detectCardType } from "@/lib/card-validation";
import type { Payment } from "@/lib/types";

export default function DepositPage() {
  const { user } = useAuth();
  const [cash, setCash] = useState(0);
  const [amount, setAmount] = useState("");
  const [cardFirst4, setCardFirst4] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [payments, setPayments] = useState<Payment[]>([]);

  const [cardType, setCardType] = useState("");
  const [cardValid, setCardValid] = useState<boolean | null>(null);
  const [cardErrors, setCardErrors] = useState<string[]>([]);

  const reload = () => {
    if (user) {
      setCash(getCashBalance(user.id));
      setPayments(getUserPayments(user.id));
    }
  };

  useEffect(() => { reload(); }, [user]);

  useEffect(() => {
    if (cardFirst4.length === 4) {
      const type = detectCardType(cardFirst4);
      setCardType(type);
      if (cardLast4.length === 4) {
        const validation = validateCardNumber(cardFirst4, cardLast4);
        setCardValid(validation.isValid);
        setCardErrors(validation.errors);
      } else {
        setCardValid(null);
        setCardErrors([]);
      }
    } else {
      setCardType("");
      setCardValid(null);
      setCardErrors([]);
    }
  }, [cardFirst4, cardLast4]);

  const handlePayWithCard = () => {
    const val = parseFloat(amount);
    if (!val || val < 5000) { setError("Minimum payment is ₦5,000"); return; }
    if (cardFirst4.length !== 4 || !/^\d+$/.test(cardFirst4)) { setError("Enter first 4 digits of your card"); return; }
    if (cardLast4.length !== 4 || !/^\d+$/.test(cardLast4)) { setError("Enter last 4 digits of your card"); return; }

    const validation = validateCardNumber(cardFirst4, cardLast4);
    if (!validation.isValid) {
      setError(`Invalid card: ${validation.errors[0]}`);
      return;
    }

    const result = createPayment(user!.id, user!.name, user!.email, val, cardFirst4, cardLast4);
    if (result.status === "auto-rejected") {
      setError(`Payment auto-rejected: ${result.rejectionReason}`);
    } else {
      setSuccess(`Payment of ₦${val.toLocaleString()} submitted! Awaiting admin confirmation.`);
      setAmount("");
      setCardFirst4("");
      setCardLast4("");
      setError("");
    }
    reload();
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

        {tab === "deposit" ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <div>
                <p className="font-medium text-emerald-800">Pay with Debit Card</p>
                <p className="text-xs text-emerald-600">Payment will be confirmed by admin</p>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card First 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={cardFirst4}
                  onChange={(e) => { setCardFirst4(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); setSuccess(""); }}
                  placeholder="1234"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg tracking-widest text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => { setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); setSuccess(""); }}
                  placeholder="5678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg tracking-widest text-center font-mono"
                />
              </div>
            </div>

            {cardFirst4.length === 4 && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                cardType === "Unknown" || cardType === ""
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="font-medium">
                  {cardType === "Unknown" ? "Unrecognized card type" : `Detected: ${cardType}`}
                </span>
              </div>
            )}

            {cardValid === false && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-700 mb-1">Invalid Card</p>
                {cardErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">• {err}</p>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}

            <button
              onClick={handlePayWithCard}
              disabled={cardValid === false}
              className={`w-full py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                cardValid === false
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {cardValid === false ? "Invalid Card Number" : "Pay with Card"}
            </button>
          </div>
        ) : (
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
              {[5000, 10000, 25000].map((val) => (
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
              onClick={handleWithdraw}
              className="w-full bg-red-600 py-3 rounded-lg font-medium text-white transition-colors hover:bg-red-700"
            >
              Withdraw Funds
            </button>
          </div>
        )}
      </div>

      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Payment History</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {payments.slice(0, 10).map((p) => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    p.status === "approved" ? "bg-emerald-100" : p.status === "rejected" || p.status === "auto-rejected" ? "bg-red-100" : "bg-amber-100"
                  }`}>
                    <svg className={`w-5 h-5 ${
                      p.status === "approved" ? "text-emerald-600" : p.status === "rejected" || p.status === "auto-rejected" ? "text-red-600" : "text-amber-600"
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={p.status === "approved" ? "M5 13l4 4L19 7" : p.status === "rejected" || p.status === "auto-rejected" ? "M6 18L18 6M6 6l12 12" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Card ****{p.cardFirst4}...{p.cardLast4}
                      {p.cardType && <span className="text-xs text-gray-500 ml-2">({p.cardType})</span>}
                    </p>
                    <p className="text-xs text-gray-500">{p.date}</p>
                    {p.rejectionReason && <p className="text-xs text-red-500 mt-0.5">{p.rejectionReason}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">₦{p.amount.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    p.status === "rejected" || p.status === "auto-rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {p.status === "approved" ? "Confirmed" : p.status === "rejected" ? "Rejected" : p.status === "auto-rejected" ? "Invalid Card" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
