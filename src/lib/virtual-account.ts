import type { VirtualAccount } from "./types";

const VIRTUAL_ACCOUNTS_KEY = "invest_virtual_accounts";
const DEPOSITS_KEY = "invest_synced_deposits";

function getBackendUrl(): string {
  if (typeof window === "undefined") return "http://localhost:5000";
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
}

export function getStoredVirtualAccount(userId: string): VirtualAccount | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(VIRTUAL_ACCOUNTS_KEY);
  if (!raw) return null;
  try {
    const accounts: Record<string, VirtualAccount> = JSON.parse(raw);
    return accounts[userId] || null;
  } catch {
    return null;
  }
}

export function storeVirtualAccount(account: VirtualAccount) {
  const raw = localStorage.getItem(VIRTUAL_ACCOUNTS_KEY);
  const accounts: Record<string, VirtualAccount> = raw ? JSON.parse(raw) : {};
  accounts[account.userId] = account;
  localStorage.setItem(VIRTUAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function generateVirtualAccount(
  userId: string,
  userName: string,
  userEmail: string,
  bvn?: string
): Promise<{ success: boolean; account?: VirtualAccount; error?: string }> {
  try {
    const BACKEND_URL = getBackendUrl();
    const res = await fetch(`${BACKEND_URL}/api/virtual-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, userName, userEmail, bvn }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: "Invalid server response" };
    }

    if (!res.ok) {
      return { success: false, error: data.error || "Failed to generate account" };
    }

    const account: VirtualAccount = {
      accountNumber: data.account.accountNumber,
      accountName: data.account.accountName,
      bankName: data.account.bankName,
      bankCode: data.account.bankCode,
      accountReference: data.account.accountReference,
      userId,
    };

    storeVirtualAccount(account);
    return { success: true, account };
  } catch (err) {
    return { success: false, error: "Cannot connect to backend server. Make sure it is running." };
  }
}

export async function syncDeposits(userId: string): Promise<number> {
  try {
    const BACKEND_URL = getBackendUrl();
    const res = await fetch(`${BACKEND_URL}/api/deposits/${userId}`);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return 0;
    }

    if (!data.success || !data.deposits) return 0;

    const syncedRaw = localStorage.getItem(DEPOSITS_KEY);
    const synced: Record<string, string[]> = syncedRaw ? JSON.parse(syncedRaw) : {};
    const alreadySynced = synced[userId] || [];

    let newTotal = 0;
    for (const deposit of data.deposits) {
      if (!alreadySynced.includes(deposit.id)) {
        newTotal += deposit.amount;
        alreadySynced.push(deposit.id);
      }
    }

    synced[userId] = alreadySynced;
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify(synced));

    return newTotal;
  } catch {
    return 0;
  }
}
