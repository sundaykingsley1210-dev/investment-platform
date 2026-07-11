export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  bvn?: string;
}

export interface VirtualAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string;
  accountReference: string;
  userId: string;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  change: number;
  changePercent: number;
  sector: string;
}

export interface Transaction {
  id: string;
  type: "buy" | "sell" | "dividend" | "deposit" | "withdrawal";
  symbol: string;
  shares: number;
  price: number;
  total: number;
  date: string;
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  cashBalance: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  targetPrice: number;
  direction: "above" | "below";
  active: boolean;
  createdAt: string;
  triggered: boolean;
}

export interface Referral {
  id: string;
  code: string;
  referredBy: string;
  referredEmail: string;
  status: "pending" | "completed";
  bonus: number;
  date: string;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  cardFirst4: string;
  cardLast4: string;
  cardType: string;
  status: "pending" | "approved" | "rejected" | "auto-rejected";
  rejectionReason?: string;
  date: string;
  reviewedBy?: string;
  reviewedAt?: string;
}
