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

function saveRegisteredUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSeedUsers(): Record<string, StoredUser> {
  return {
    "admin@invest.com": {
      password: "admin123",
      user: { id: "1", name: "Admin User", email: "admin@invest.com", role: "admin" },
    },
    "user@invest.com": {
      password: "user123",
      user: { id: "2", name: "John Investor", email: "user@invest.com", role: "user" },
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("invest_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const allUsers = { ...getSeedUsers(), ...getRegisteredUsers() };
    const entry = allUsers[email];
    if (entry && entry.password === password) {
      initializeNewUser(entry.user.id);
      setUser(entry.user);
      localStorage.setItem("invest_user", JSON.stringify(entry.user));
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string, bvn?: string): Promise<boolean> => {
    const allUsers = { ...getSeedUsers(), ...getRegisteredUsers() };
    if (allUsers[email]) return false;

    const newUser: User = { id: Date.now().toString(), name, email, role: "user" };
    if (bvn) newUser.bvn = bvn;

    allUsers[email] = { password, user: newUser };
    saveRegisteredUsers(allUsers);

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

    const allUsers = getRegisteredUsers();
    const email = user.email;
    if (allUsers[email]) {
      allUsers[email].user = updated;
      saveRegisteredUsers(allUsers);
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
