"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAvailableTasks, getCompletedTasks, completeTask, seedTasksForUser, getCashBalance } from "@/lib/store";
import type { Task } from "@/lib/types";

export default function TasksPage() {
  const { user } = useAuth();
  const [available, setAvailable] = useState<Task[]>([]);
  const [completed, setCompleted] = useState<Task[]>([]);
  const [cash, setCash] = useState(0);
  const [tab, setTab] = useState<"available" | "completed">("available");

  const reload = () => {
    if (user) {
      seedTasksForUser(user.id, user.vip || 1);
      setAvailable(getAvailableTasks(user.id));
      setCompleted(getCompletedTasks(user.id));
      setCash(getCashBalance(user.id));
    }
  };

  useEffect(() => { reload(); }, [user]);

  const handleComplete = (taskId: string) => {
    if (!user) return;
    const ok = completeTask(user.id, taskId);
    if (ok) {
      reload();
    }
  };

  const totalEarned = completed.reduce((s, t) => s + t.reward, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500 mt-1">Complete tasks to earn rewards</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Available Tasks</p>
          <p className="text-2xl font-bold text-emerald-600">{available.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-blue-600">{completed.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Earned</p>
          <p className="text-2xl font-bold text-emerald-600">₦{totalEarned.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("available")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === "available" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Available ({available.length})
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === "completed" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Completed ({completed.length})
        </button>
      </div>

      {tab === "available" ? (
        available.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No available tasks. Check back later!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {available.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-emerald-600">₦{task.reward.toLocaleString()}</p>
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        completed.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No completed tasks yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 opacity-75">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-400 line-through">₦{task.reward.toLocaleString()}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-2">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}