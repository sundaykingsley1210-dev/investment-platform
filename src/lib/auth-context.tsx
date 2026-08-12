"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "./types";

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
const CASH_KEY_PREFIX = "invest_";
const HOLDINGS_SUFFIX = "_holdings";
const TXS_SUFFIX = "_transactions";
const CASH_SUFFIX = "_cash";

interface StoredUser {
  password: string;
  user: User;
}

function readJSON(key: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsersFromStorage(): Record<string, StoredUser> {
  return readJSON(USERS_KEY) || {};
}

function saveUsersToStorage(users: Record<string, StoredUser>) {
  writeJSON(USERS_KEY, users);
}

const SEED_ACCOUNTS: Record<string, StoredUser> = {
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

function findAccount(email: string): { key: string; account: StoredUser } | null {
  const all = { ...SEED_ACCOUNTS, ...getUsersFromStorage() };
  const norm = email.trim().toLowerCase();
  for (const key of Object.keys(all)) {
    if (key.toLowerCase() === norm) {
      return { key, account: all[key] };
    }
  }
  return null;
}

function initUserCash(userId: string, amount: number) {
  const cashKey = `${CASH_KEY_PREFIX}${userId}${CASH_SUFFIX}`;
  const existing = localStorage.getItem(cashKey);
  if (existing === null) {
    writeJSON(cashKey, amount);
  }
}

function initUserData(userId: string) {
  const holdingsKey = `${CASH_KEY_PREFIX}${userId}${HOLDINGS_SUFFIX}`;
  const txsKey = `${CASH_KEY_PREFIX}${userId}${TXS_SUFFIX}`;
  if (!localStorage.getItem(holdingsKey)) writeJSON(holdingsKey, []);
  if (!localStorage.getItem(txsKey)) writeJSON(txsKey, []);
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
    const found = findAccount(email);
    if (!found) {
      console.log("Login failed: email not found:", email);
      return false;
    }
    if (found.account.password !== password) {
      console.log("Login failed: wrong password for:", email);
      return false;
    }

    const u = found.account.user;
    initUserData(u.id);
    if (u.id === "100") initUserCash(u.id, 178300);
    else if (u.id === "101") initUserCash(u.id, 3150);
    else initUserCash(u.id, 5000);

    setUser(u);
    localStorage.setItem("invest_user", JSON.stringify(u));
    console.log("Login success:", u.email, "balance:", localStorage.getItem(`${CASH_KEY_PREFIX}${u.id}${CASH_SUFFIX}`));
    return true;
  };

  const signup = async (name: string, email: string, password: string, bvn?: string): Promise<boolean> => {
    const found = findAccount(email);
    if (found) return false;

    const norm = email.trim().toLowerCase();
    const newUser: User = { id: Date.now().toString(), name, email: norm, role: "user" };
    if (bvn) newUser.bvn = bvn;

    const stored = getUsersFromStorage();
    stored[norm] = { password, user: newUser };
    saveUsersToStorage(stored);

    initUserData(newUser.id);
    initUserCash(newUser.id, 5000);

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
    const norm = user.email.toLowerCase();
    if (stored[norm]) {
      stored[norm].user = updated;
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