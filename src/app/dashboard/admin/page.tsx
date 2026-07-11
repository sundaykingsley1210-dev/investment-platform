"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getHoldings, getTransactions, getAllPayments, approvePayment, rejectPayment } from "@/lib/store";
import type { Payment } from "@/lib/types";

export default function AdminPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "auto-rejected">("all");

  const holdings = user ? getHoldings(user.id) : [];
  const transactions = user ? getTransactions(user.id) : [];
  const totalAUM = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0) + 5000;

  const reload = () => { setPayments(getAllPayments()); };
  useEffect(() => { reload(); }, []);

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const autoRejectedCount = payments.filter((p) => p.status === "auto-rejected").length;

  const handleApprove = (id: string) => {
    approvePayment(id, user!.name);
    reload();
  };

  const handleReject = (id: string) => {
    rejectPayment(id, user!.name);
    reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1">System management and payment approvals</p>
      </div>

      {user?.role !== "admin" ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-800">Access Restricted</h3>
          <p className="text-yellow-700 mt-1">You need admin privileges to view this page.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Total AUM</p>
              <p className="text-2xl font-bold text-gray-900">₦{totalAUM.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Auto-Rejected</p>
              <p className="text-2xl font-bold text-red-600">{autoRejectedCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Active Holdings</p>
              <p className="text-2xl font-bold text-gray-900">{holdings.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Account</h3>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 mt-1">
                    Administrator
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="space-y-4">
                {[
                  { label: "API Response Time", value: "45ms", status: "good" },
                  { label: "Database Connection", value: "Healthy", status: "good" },
                  { label: "Cache Hit Rate", value: "94.2%", status: "good" },
                  { label: "Error Rate (24h)", value: "0.02%", status: "good" },
                  { label: "Uptime (30d)", value: "99.98%", status: "good" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                      <span className={`w-2 h-2 rounded-full ${item.status === "good" ? "bg-emerald-500" : "bg-red-500"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-900">Payment Approvals</h3>
              <div className="flex gap-2 flex-wrap">
                {(["all", "pending", "approved", "rejected", "auto-rejected"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === f
                        ? f === "pending" ? "bg-amber-600 text-white" : f === "approved" ? "bg-emerald-600 text-white" : f === "rejected" || f === "auto-rejected" ? "bg-red-600 text-white" : "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f === "auto-rejected" ? "Auto-Rejected" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-gray-500">No {filter !== "all" ? filter.replace("-", " ") : ""} payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">User</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Card</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Amount</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className={`border-t border-gray-100 hover:bg-gray-50 ${p.status === "auto-rejected" ? "bg-red-50" : ""}`}>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{p.userName}</p>
                          <p className="text-xs text-gray-500">{p.userEmail}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-700">
                          ****{p.cardFirst4}...{p.cardLast4}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.cardType === "Visa" ? "bg-blue-100 text-blue-700" :
                            p.cardType === "Mastercard" ? "bg-orange-100 text-orange-700" :
                            p.cardType === "Verve" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {p.cardType || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          ₦{p.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{p.date}</td>
                        <td className="px-6 py-4">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              p.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                              p.status === "rejected" || p.status === "auto-rejected" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {p.status === "approved" ? "Confirmed" : p.status === "rejected" ? "Rejected" : p.status === "auto-rejected" ? "Auto-Rejected" : "Pending"}
                            </span>
                            {p.rejectionReason && (
                              <p className="text-xs text-red-500 mt-1 max-w-[200px]">{p.rejectionReason}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(p.id)}
                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(p.id)}
                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : p.status === "auto-rejected" ? (
                            <span className="text-xs text-red-500">No action needed</span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {p.reviewedBy && `By ${p.reviewedBy}`}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
