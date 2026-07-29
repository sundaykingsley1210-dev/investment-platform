"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMessagesForUser, markMessageRead, deleteMessage, cleanupExpiredMessages } from "@/lib/store";
import type { Message } from "@/lib/types";

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);

  const reload = () => {
    if (user) {
      cleanupExpiredMessages();
      setMessages(getMessagesForUser(user.id));
    }
  };

  useEffect(() => { reload(); }, [user]);

  const openMessage = (msg: Message) => {
    setSelected(msg);
    if (!msg.read) {
      markMessageRead(msg.id);
      reload();
    }
  };

  const handleDelete = (id: string) => {
    deleteMessage(id);
    setSelected(null);
    reload();
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor(diff / (1000 * 60));
    if (hours >= 1) return `${hours}h ago`;
    return `${mins}m ago`;
  };

  const expiresIn = (iso: string) => {
    const elapsed = Date.now() - new Date(iso).getTime();
    const remaining = 12 * 60 * 60 * 1000 - elapsed;
    if (remaining <= 0) return "Expired";
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Messages from admin expire after 12 hours</p>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <p className="text-gray-500">No messages yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`flex items-center gap-4 px-6 py-4 border-b border-gray-100 cursor-pointer transition-colors ${
                selected?.id === msg.id ? "bg-emerald-50" : msg.read ? "bg-white hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-100"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${msg.read ? "bg-gray-400" : "bg-emerald-500"}`}>
                {msg.senderName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${msg.read ? "text-gray-600" : "font-semibold text-gray-900"}`}>{msg.senderName}</span>
                  {!msg.read && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
                </div>
                <p className={`text-sm truncate ${msg.read ? "text-gray-500" : "text-gray-700 font-medium"}`}>{msg.subject}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">{formatTime(msg.createdAt)}</p>
                <p className="text-xs text-amber-500 mt-1">{expiresIn(msg.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selected.subject}</h3>
                <p className="text-sm text-gray-500">From: {selected.senderName} &middot; {formatTime(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{selected.body}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-500">{expiresIn(selected.createdAt)}</p>
              <button onClick={() => handleDelete(selected.id)} className="text-sm text-red-600 hover:text-red-700 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}