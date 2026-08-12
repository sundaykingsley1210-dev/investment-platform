"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 300));

    const ok = await login(email, password);
    setLoading(false);

    if (ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Please check and try again.");
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

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Quick login (tap to fill):</p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => { setEmail("admin@invest.com"); setPassword("admin123"); setError(""); }}
                className="w-full px-3 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-700 text-left"
              >
                Admin: admin@invest.com / admin123
              </button>
              <button
                type="button"
                onClick={() => { setEmail("sundaykingsley1210@gmail.com"); setPassword("123456"); setError(""); }}
                className="w-full px-3 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-700 text-left"
              >
                Sunday (Admin): sundaykingsley1210@gmail.com / 123456
              </button>
              <button
                type="button"
                onClick={() => { setEmail("unico@invest.com"); setPassword("Happiness"); setError(""); }}
                className="w-full px-3 py-2.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition text-emerald-700 text-left"
              >
                Unico (VIP 4): unico@invest.com / Happiness
              </button>
              <button
                type="button"
                onClick={() => { setEmail("ozumbacharles7@gmail.com"); setPassword("charles.com123"); setError(""); }}
                className="w-full px-3 py-2.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition text-emerald-700 text-left"
              >
                Ozumba (VIP 1): ozumbacharles7@gmail.com / charles.com123
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