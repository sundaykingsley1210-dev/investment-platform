"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const USERS_KEY = "invest_registered_users";

function getRegisteredEmails(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const users = JSON.parse(raw);
    return Object.keys(users);
  } catch {
    return [];
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmails, setRegisteredEmails] = useState<string[]>([]);
  const [showAccounts, setShowAccounts] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setRegisteredEmails(getRegisteredEmails());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      router.push("/dashboard");
    } else {
      const emails = getRegisteredEmails();
      setRegisteredEmails(emails);
      if (emails.length === 0) {
        setError("No accounts found on this browser. Please sign up first.");
      } else if (!emails.includes(email)) {
        setError(`Email "${email}" not found. Registered emails: ${emails.join(", ")}`);
      } else {
        setError("Wrong password. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h1 className="text-3xl font-bold text-white">InvestPro</h1>
          </div>
          <p className="text-gray-400">Sign in to your investment dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Welcome back</h2>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {registeredEmails.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowAccounts(!showAccounts)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {showAccounts ? "Hide" : "Show"} registered accounts on this browser ({registeredEmails.length})
              </button>
              {showAccounts && (
                <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1">
                  {registeredEmails.map((e) => (
                    <button
                      key={e}
                      onClick={() => { setEmail(e); setError(""); }}
                      className="w-full text-left text-xs text-gray-700 hover:text-emerald-600 px-2 py-1 rounded hover:bg-gray-100"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Demo accounts:</p>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => { setEmail("admin@invest.com"); setPassword("admin123"); setError(""); }}
                className="w-full px-3 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-700 text-left"
              >
                Admin: admin@invest.com
              </button>
              <button
                onClick={() => { setEmail("user@invest.com"); setPassword("user123"); setError(""); }}
                className="w-full px-3 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-700 text-left"
              >
                User: user@invest.com
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-emerald-600 font-medium hover:text-emerald-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}