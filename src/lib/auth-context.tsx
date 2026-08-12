"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "./types";
import { initializeNewUser } from "./store";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, bvn?: string) => Promise<boolean>;
  updateBvn: (bvn: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = "invest_registered_users";

interface StoredUser {
  password: string;
  user: User;
}

function getUsersFromStorage(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveUsersToStorage(users: Record<string, StoredUser>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getAllAccounts(): Record<string, StoredUser> {
  const seed: Record<string, StoredUser> = {
    "admin@invest.com": {
      password: "admin123",
      user: { id: "1", name: "Admin User", email: "admin@invest.com", role: "admin" },
    },
    "user@invest.com": {
      password: "user123",
      user: { id: "2", name: "John Investor", email: "user@invest.com", role: "user" },
    },
    "unico@invest.com": {
      password: "Happiness",
      user: { id: "100", name: "Unico", email: "unico@invest.com", role: "user", vip: 4 },
    },
    "ozumbacharles7@gmail.com": {
      password: "charles.com123",
      user: { id: "101", name: "Ozumba Charles", email: "ozumbacharles7@gmail.com", role: "user", vip: 1 },
    },
  };
  const stored = getUsersFromStorage();
  return { ...seed, ...stored };
}

function findUserByEmail(email: string): { key: string; entry: StoredUser } | null {
  const all = getAllAccounts();
  const normalized = email.trim().toLowerCase();
  for (const key of Object.keys(all)) {
    if (key.toLowerCase() === normalized) {
      return { key, entry: all[key] };
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("invest_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.email) {
          setUser(parsed);
        }
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const found = findUserByEmail(email);
    if (!found) return false;
    if (found.entry.password !== password) return false;

    const initialBalance = found.entry.user.id === "100" ? 178300 : found.entry.user.id === "101" ? 3150 : undefined;
    initializeNewUser(found.entry.user.id, initialBalance);
    setUser(found.entry.user);
    localStorage.setItem("invest_user", JSON.stringify(found.entry.user));
    return true;
  };

  const signup = async (name: string, email: string, password: string, bvn?: string): Promise<boolean> => {
    const found = findUserByEmail(email);
    if (found) return false;

    const normalizedEmail = email.trim().toLowerCase();
    const newUser: User = { id: Date.now().toString(), name, email: normalizedEmail, role: "user" };
    if (bvn) newUser.bvn = bvn;

    const stored = getUsersFromStorage();
    stored[normalizedEmail] = { password, user: newUser };
    saveUsersToStorage(stored);

    initializeNewUser(newUser.id);
    setUser(newUser);
    localStorage.setItem("invest_user", JSON.stringify(newUser));
    return true;
  };

  const updateBvn = (bvn: string) => {
    if (!user) return;
    const updated = { ...user, bvn };
    setUser(updated);
    localStorage.setItem("invest_user", JSON.stringify(updated));

    const stored = getUsersFromStorage();
    const normalizedEmail = user.email.toLowerCase();
    if (stored[normalizedEmail]) {
      stored[normalizedEmail].user = updated;
      saveUsersToStorage(stored);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("invest_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateBvn, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}