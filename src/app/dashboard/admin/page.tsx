"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAllUsersDetailed, getAllPayments, approvePayment, rejectPayment, sendMessage, getHoldings, getTransactions } from "@/lib/store";
import type { AdminUserInfo, Payment, Holding, Transaction } from "@/lib/types";

type Tab = "overview" | "users" | "payments" | "messages";

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUserInfo[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "approved" | "rejected" | "auto-rejected">("all");
  const [selectedUser, setSelectedUser] = useState<AdminUserInfo | null>(null);
  const [userHoldings, setUserHoldings] = useState<Holding[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);

  const [msgRecipient, setMsgRecipient] = useState("");
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");
  const [msgError, setMsgError] = useState("");

  const reload = () => {
    setPayments(getAllPayments());
    setAllUsers(getAllUsersDetailed());
  };

  useEffect(() => { reload(); }, []);

  const filteredPayments = paymentFilter === "all" ? payments : payments.filter((p) => p.status === paymentFilter);
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const totalDeposits = payments.filter((p) => p.status === "approved").reduce((s, p) => s + p.amount, 0);
  const totalUsers = allUsers.length;
  const totalCash = allUsers.reduce((s, u) => s + u.cash, 0);

  const handleApprove = (id: string) => {
    approvePayment(id, user!.name);
    reload();
  };

  const handleReject = (id: string) => {
    rejectPayment(id, user!.name);
    reload();
  };

  const handleViewUser = (u: AdminUserInfo) => {
    setSelectedUser(u);
    setUserHoldings(getHoldings(u.id));
    setUserTransactions(getTransactions(u.id));
  };

  const handleSendMessage = () => {
    setMsgError("");
    setMsgSuccess("");
    if (!msgRecipient || !msgSubject.trim() || !msgBody.trim()) {
      setMsgError("Please fill in all fields");
      return;
    }
    const recipient = allUsers.find((u) => u.id === msgRecipient);
    if (!recipient) {
      setMsgError("Recipient not found");
      return;
    }
    sendMessage(user!.id, user!.name, msgRecipient, msgSubject.trim(), msgBody.trim());
    setMsgSuccess(`Message sent to ${recipient.name}. It will expire in 12 hours.`);
    setMsgRecipient("");
    setMsgSubject("");
    setMsgBody("");
  };

  if (user?.role !== "admin") {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-800">Access Restricted</h3>
          <p className="text-yellow-700 mt-1">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Monitor accounts, payments, and activity</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["overview", "users", "payments", "messages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedUser(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "payments" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Total Cash</p>
              <p className="text-2xl font-bold text-emerald-600">₦{totalCash.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Approved Deposits</p>
              <p className="text-2xl font-bold text-blue-600">₦{totalDeposits.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Admin Account</h3>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user?.name?.charAt(0) || "A"}
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

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Recent Users</h3>
            </div>
            {allUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No registered users yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">User</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Role</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Cash Balance</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Holdings</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">VIP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.slice(0, 5).map((u) => (
                      <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => { setTab("users"); handleViewUser(u); }}>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">₦{u.cash.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{u.holdingsCount}</td>
                        <td className="px-6 py-4 text-right">
                          {u.vip > 0 ? <span className="text-amber-600 font-medium">VIP {u.vip}</span> : <span className="text-gray-400">-</span>}
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

      {tab === "users" && (
        <>
          {selectedUser ? (
            <div className="space-y-6">
              <button onClick={() => setSelectedUser(null)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1">
                ← Back to all users
              </button>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-gray-500">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedUser.role === "admin" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                        {selectedUser.role}
                      </span>
                      {selectedUser.vip > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          VIP {selectedUser.vip}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500">Cash Balance</p>
                  <p className="text-lg font-bold text-emerald-600">₦{selectedUser.cash.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500">Holdings</p>
                  <p className="text-lg font-bold text-gray-900">{selectedUser.holdingsCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500">Transactions</p>
                  <p className="text-lg font-bold text-gray-900">{selectedUser.transactionsCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500">BVN</p>
                  <p className="text-lg font-bold text-gray-900">{selectedUser.bvn || "Not set"}</p>
                </div>
              </div>

              {userHoldings.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Holdings ({userHoldings.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Symbol</th>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                          <th className="text-right px-6 py-3 font-medium text-gray-500">Shares</th>
                          <th className="text-right px-6 py-3 font-medium text-gray-500">Avg Cost</th>
                          <th className="text-right px-6 py-3 font-medium text-gray-500">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userHoldings.map((h) => (
                          <tr key={h.id} className="border-t border-gray-100">
                            <td className="px-6 py-3 font-medium text-gray-900">{h.symbol}</td>
                            <td className="px-6 py-3 text-gray-500">{h.name}</td>
                            <td className="px-6 py-3 text-right text-gray-900">{h.shares}</td>
                            <td className="px-6 py-3 text-right text-gray-900">₦{h.avgCost.toLocaleString()}</td>
                            <td className="px-6 py-3 text-right font-medium text-gray-900">₦{(h.shares * h.currentPrice).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {userTransactions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Transactions ({userTransactions.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Symbol</th>
                          <th className="text-right px-6 py-3 font-medium text-gray-500">Amount</th>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userTransactions.slice(0, 20).map((t) => (
                          <tr key={t.id} className="border-t border-gray-100">
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                t.type === "deposit" ? "bg-emerald-100 text-emerald-700" :
                                t.type === "withdrawal" ? "bg-red-100 text-red-700" :
                                t.type === "buy" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-gray-900">{t.symbol}</td>
                            <td className="px-6 py-3 text-right font-medium text-gray-900">₦{t.total.toLocaleString()}</td>
                            <td className="px-6 py-3 text-gray-500">{t.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">All Registered Users ({allUsers.length})</h3>
                </div>
                {allUsers.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No registered users yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">User</th>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Role</th>
                          <th className="text-right px-6 py-3 font-medium text-gray-500">Cash</th>
                          <th className="text-right px-6 py-3 font-medium text-gray-500">Holdings</th>
                          <th className="text-right px-6 py-3 font-medium text-gray-500">Transactions</th>
                          <th className="text-right px-6 py-3 font-medium text-gray-500">VIP</th>
                          <th className="text-right px-6 py-3 font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map((u) => (
                          <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-sm">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{u.name}</p>
                                  <p className="text-xs text-gray-500">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">₦{u.cash.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right text-gray-600">{u.holdingsCount}</td>
                            <td className="px-6 py-4 text-right text-gray-600">{u.transactionsCount}</td>
                            <td className="px-6 py-4 text-right">
                              {u.vip > 0 ? <span className="text-amber-600 font-medium">VIP {u.vip}</span> : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleViewUser(u)}
                                className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "payments" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">Payment Approvals</h3>
            <div className="flex gap-2 flex-wrap">
              {(["all", "pending", "approved", "rejected", "auto-rejected"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setPaymentFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    paymentFilter === f
                      ? f === "pending" ? "bg-amber-600 text-white" : f === "approved" ? "bg-emerald-600 text-white" : f === "rejected" || f === "auto-rejected" ? "bg-red-600 text-white" : "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f === "auto-rejected" ? "Auto-Rejected" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No {paymentFilter !== "all" ? paymentFilter.replace("-", " ") : ""} payments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">User</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Card</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Amount</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className={`border-t border-gray-100 hover:bg-gray-50 ${p.status === "auto-rejected" ? "bg-red-50" : ""}`}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{p.userName}</p>
                        <p className="text-xs text-gray-500">{p.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-700">****{p.cardFirst4}...{p.cardLast4}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">₦{p.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-500">{p.date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          p.status === "rejected" || p.status === "auto-rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {p.status === "approved" ? "Confirmed" : p.status === "rejected" ? "Rejected" : p.status === "auto-rejected" ? "Auto-Rejected" : "Pending"}
                        </span>
                        {p.rejectionReason && <p className="text-xs text-red-500 mt-1">{p.rejectionReason}</p>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleApprove(p.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">Approve</button>
                            <button onClick={() => handleReject(p.id)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors">Reject</button>
                          </div>
                        ) : p.status === "auto-rejected" ? (
                          <span className="text-xs text-red-500">No action needed</span>
                        ) : (
                          <span className="text-xs text-gray-400">{p.reviewedBy && `By ${p.reviewedBy}`}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "messages" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Send Message to User</h3>
          <p className="text-sm text-gray-500 mb-4">Messages expire automatically after 12 hours</p>
          {msgError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{msgError}</div>}
          {msgSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm mb-4">{msgSuccess}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <select
                value={msgRecipient}
                onChange={(e) => setMsgRecipient(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="">Select a user</option>
                {allUsers.filter((u) => u.id !== user?.id).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={msgSubject}
                onChange={(e) => setMsgSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Message subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                placeholder="Type your message here..."
              />
            </div>
            <button
              onClick={handleSendMessage}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
