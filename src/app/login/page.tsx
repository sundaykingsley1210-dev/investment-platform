"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const USERS_KEY = "invest_registered_users";

interface StoredUser {
  password: string;
  user: { id: string; name: string; email: string; role: string };
}

function getRegisteredUsers(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const runDebug = () => {
    const users = getRegisteredUsers();
    const keys = Object.keys(users);
    if (keys.length === 0) {
      setDebugInfo("NO ACCOUNTS FOUND IN LOCALSTORAGE\n\nThis means no one has registered on this browser yet, or localStorage was cleared.");
    } else {
      const info = keys.map((key) => {
        const u = users[key];
        return `Email: ${key}\n  Name: ${u.user.name}\n  ID: ${u.user.id}`;
      }).join("\n\n");
      setDebugInfo(`REGISTERED ACCOUNTS (${keys.length}):\n\n${info}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      router.push("/dashboard");
    } else {
      const users = getRegisteredUsers();
      const keys = Object.keys(users);
      const normalizedInput = email.trim().toLowerCase();
      const found = keys.find((k) => k.toLowerCase() === normalizedInput);
      
      if (keys.length === 0) {
        setError("No accounts exist on this browser. Please sign up first.");
      } else if (!found) {
        setError(`Email "${email}" not found. Click "Show Accounts" below to see registered emails.`);
      } else if (users[found].password !== password) {
        setError(`Email found but wrong password. Your password is stored as: "${users[found].password}"`);
      } else {
        setError("Login failed for unknown reason.");
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
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm whitespace-pre-wrap">{error}</div>
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

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => { setShowDebug(!showDebug); if (!showDebug) runDebug(); }}
              className="w-full text-xs text-gray-500 hover:text-gray-700 font-medium py-2"
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </button>
            {showDebug && debugInfo && (
              <pre className="mt-2 bg-gray-100 rounded-lg p-3 text-xs text-gray-700 overflow-auto max-h-48 whitespace-pre-wrap">
                {debugInfo}
              </pre>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Demo accounts:</p>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => { setEmail("admin@invest.com"); setPassword("admin123"); setError(""); }}
                className="w-full px-3 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-700 text-left"
              >
                Admin: admin@invest.com / admin123
              </button>
              <button
                onClick={() => { setEmail("user@invest.com"); setPassword("user123"); setError(""); }}
                className="w-full px-3 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-700 text-left"
              >
                User: user@invest.com / user123
              </button>
              <button
                onClick={() => { setEmail("unico@invest.com"); setPassword("unico123"); setError(""); }}
                className="w-full px-3 py-2.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition text-emerald-700 text-left"
              >
                Unico: unico@invest.com / unico123
              </button>
              <button
                onClick={() => { setEmail("ozumba@invest.com"); setPassword("ozumba123"); setError(""); }}
                className="w-full px-3 py-2.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition text-emerald-700 text-left"
              >
                Ozumba: ozumba@invest.com / ozumba123
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