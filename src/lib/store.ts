import type { Holding, Transaction, PortfolioSummary, ChartDataPoint } from "./types";

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
