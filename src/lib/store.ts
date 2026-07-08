import type { Holding, Transaction, PortfolioSummary, ChartDataPoint, PriceAlert, Referral } from "./types";

const STORAGE_PREFIX = "invest_";

function getKey(userId: string, key: string) {
  return `${STORAGE_PREFIX}${userId}_${key}`;
}

export function getHoldings(userId: string): Holding[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(getKey(userId, "holdings"));
  return raw ? JSON.parse(raw) : [];
}

export function saveHoldings(userId: string, holdings: Holding[]) {
  localStorage.setItem(getKey(userId, "holdings"), JSON.stringify(holdings));
}

export function getTransactions(userId: string): Transaction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(getKey(userId, "transactions"));
  return raw ? JSON.parse(raw) : [];
}

export function saveTransactions(userId: string, transactions: Transaction[]) {
  localStorage.setItem(getKey(userId, "transactions"), JSON.stringify(transactions));
}

export function getCashBalance(userId: string): number {
  if (typeof window === "undefined") return 5000;
  const raw = localStorage.getItem(getKey(userId, "cash"));
  return raw ? JSON.parse(raw) : 5000;
}

export function saveCashBalance(userId: string, balance: number) {
  localStorage.setItem(getKey(userId, "cash"), JSON.stringify(balance));
}

export function initializeNewUser(userId: string) {
  if (getHoldings(userId).length === 0 && getTransactions(userId).length === 0) {
    saveHoldings(userId, []);
    saveTransactions(userId, []);
    saveCashBalance(userId, 5000);
  }
}

export function buyStock(userId: string, symbol: string, name: string, sector: string, shares: number, price: number): boolean {
  const cash = getCashBalance(userId);
  const total = shares * price;
  if (total > cash) return false;

  const holdings = getHoldings(userId);
  const txs = getTransactions(userId);
  const existing = holdings.find((h) => h.symbol === symbol);

  const today = new Date().toISOString().split("T")[0];

  if (existing) {
    const newShares = existing.shares + shares;
    const newAvgCost = ((existing.shares * existing.avgCost) + total) / newShares;
    existing.shares = newShares;
    existing.avgCost = Math.round(newAvgCost * 100) / 100;
    existing.currentPrice = price;
  } else {
    holdings.push({
      id: Date.now().toString(),
      symbol,
      name,
      shares,
      avgCost: price,
      currentPrice: price,
      change: 0,
      changePercent: 0,
      sector,
    });
  }

  txs.unshift({
    id: Date.now().toString(),
    type: "buy",
    symbol,
    shares,
    price,
    total,
    date: today,
  });

  saveHoldings(userId, holdings);
  saveTransactions(userId, txs);
  saveCashBalance(userId, cash - total);
  return true;
}

export function sellStock(userId: string, symbol: string, shares: number, price: number): boolean {
  const holdings = getHoldings(userId);
  const existing = holdings.find((h) => h.symbol === symbol);
  if (!existing || existing.shares < shares) return false;

  const txs = getTransactions(userId);
  const cash = getCashBalance(userId);
  const total = shares * price;
  const today = new Date().toISOString().split("T")[0];

  existing.shares -= shares;
  if (existing.shares === 0) {
    const idx = holdings.indexOf(existing);
    holdings.splice(idx, 1);
  }

  txs.unshift({
    id: Date.now().toString(),
    type: "sell",
    symbol,
    shares,
    price,
    total,
    date: today,
  });

  saveHoldings(userId, holdings);
  saveTransactions(userId, txs);
  saveCashBalance(userId, cash + total);
  return true;
}

export function getPortfolioSummary(userId: string): PortfolioSummary {
  const holdings = getHoldings(userId);
  const cash = getCashBalance(userId);
  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const dayChange = holdings.reduce((sum, h) => sum + h.shares * h.change, 0);
  const dayChangePercent = totalValue - dayChange > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  return {
    totalValue,
    totalGain,
    totalGainPercent,
    dayChange,
    dayChangePercent,
    cashBalance: cash,
  };
}

export function generateChartData(userId: string): ChartDataPoint[] {
  const holdings = getHoldings(userId);
  const cash = getCashBalance(userId);
  const currentValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0) + cash;
  const data: ChartDataPoint[] = [];
  let value = currentValue * 0.85;
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value += (Math.random() - 0.45) * (currentValue * 0.02);
    if (value < 0) value = 0;
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

export function depositFunds(userId: string, amount: number): boolean {
  if (amount < 5000) return false;
  const cash = getCashBalance(userId);
  const txs = getTransactions(userId);
  const today = new Date().toISOString().split("T")[0];

  txs.unshift({
    id: Date.now().toString(),
    type: "deposit",
    symbol: "CASH",
    shares: 1,
    price: amount,
    total: amount,
    date: today,
  });

  saveCashBalance(userId, cash + amount);
  saveTransactions(userId, txs);
  return true;
}

export function withdrawFunds(userId: string, amount: number): boolean {
  if (amount < 5000) return false;
  const cash = getCashBalance(userId);
  if (amount > cash) return false;

  const txs = getTransactions(userId);
  const today = new Date().toISOString().split("T")[0];

  txs.unshift({
    id: Date.now().toString(),
    type: "withdrawal",
    symbol: "CASH",
    shares: 1,
    price: amount,
    total: amount,
    date: today,
  });

  saveCashBalance(userId, cash - amount);
  saveTransactions(userId, txs);
  return true;
}

export function getAlerts(userId: string): PriceAlert[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(getKey(userId, "alerts"));
  return raw ? JSON.parse(raw) : [];
}

export function saveAlerts(userId: string, alerts: PriceAlert[]) {
  localStorage.setItem(getKey(userId, "alerts"), JSON.stringify(alerts));
}

export function createAlert(userId: string, symbol: string, name: string, targetPrice: number, direction: "above" | "below"): PriceAlert {
  const alerts = getAlerts(userId);
  const newAlert: PriceAlert = {
    id: Date.now().toString(),
    symbol,
    name,
    targetPrice,
    direction,
    active: true,
    createdAt: new Date().toISOString().split("T")[0],
    triggered: false,
  };
  alerts.unshift(newAlert);
  saveAlerts(userId, alerts);
  return newAlert;
}

export function deleteAlert(userId: string, alertId: string) {
  const alerts = getAlerts(userId).filter((a) => a.id !== alertId);
  saveAlerts(userId, alerts);
}

export function toggleAlert(userId: string, alertId: string) {
  const alerts = getAlerts(userId);
  const alert = alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.active = !alert.active;
    saveAlerts(userId, alerts);
  }
}

export function getReferralCode(userId: string): string {
  if (typeof window === "undefined") return "";
  const raw = localStorage.getItem(getKey(userId, "referralCode"));
  if (raw) return JSON.parse(raw);
  const code = `INV${userId.slice(-4)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  localStorage.setItem(getKey(userId, "referralCode"), JSON.stringify(code));
  return code;
}

export function getReferrals(userId: string): Referral[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(getKey(userId, "referrals"));
  return raw ? JSON.parse(raw) : [];
}

export function saveReferrals(userId: string, referrals: Referral[]) {
  localStorage.setItem(getKey(userId, "referrals"), JSON.stringify(referrals));
}

export function addReferral(userId: string, referredEmail: string): Referral | null {
  const referrals = getReferrals(userId);
  const exists = referrals.find((r) => r.referredEmail === referredEmail);
  if (exists) return null;

  const newReferral: Referral = {
    id: Date.now().toString(),
    code: getReferralCode(userId),
    referredBy: userId,
    referredEmail,
    status: "completed",
    bonus: 500,
    date: new Date().toISOString().split("T")[0],
  };

  referrals.unshift(newReferral);
  saveReferrals(userId, referrals);

  const cash = getCashBalance(userId);
  saveCashBalance(userId, cash + 500);

  return newReferral;
}
