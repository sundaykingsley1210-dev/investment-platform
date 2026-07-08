"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getReferralCode, getReferrals, addReferral } from "@/lib/store";

export default function ReferralsPage() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<ReturnType<typeof getReferrals>>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const reload = () => {
    if (user) {
      setCode(getReferralCode(user.id));
      setReferrals(getReferrals(user.id));
    }
  };

  useEffect(() => { reload(); }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = () => {
    if (!email) { setError("Enter an email address"); return; }
    if (!email.includes("@")) { setError("Enter a valid email"); return; }
    const result = addReferral(user!.id, email);
    if (result) {
      setSuccess(`Referral added! ₦500 bonus credited.`);
      setEmail("");
      setError("");
      reload();
    } else {
      setError("This email was already referred");
    }
  };

  const totalBonus = referrals.reduce((sum, r) => sum + r.bonus, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-500 mt-1">Invite friends and earn ₦500 for each referral</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Referrals</p>
          <p className="text-2xl font-bold text-gray-900">{referrals.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Earned</p>
          <p className="text-2xl font-bold text-emerald-600">₦{totalBonus.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Bonus Per Referral</p>
          <p className="text-2xl font-bold text-gray-900">₦500</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Referral Code</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 font-mono text-lg font-bold text-emerald-600 tracking-wider">
            {code}
          </div>
          <button
            onClick={handleCopy}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${copied ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Share this code with friends. They get ₦500 bonus, you get ₦500 for each referral.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add Referral Manually</h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); setSuccess(""); }}
            placeholder="Enter friend's email"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
          <button onClick={handleAdd} className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            Add Referral
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        {success && <p className="text-sm text-emerald-600 font-medium mt-2">{success}</p>}
      </div>

      {referrals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Referral History</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {referrals.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{r.referredEmail}</p>
                    <p className="text-xs text-gray-500">{r.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    +₦{r.bonus}
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
