export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
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
  type: "buy" | "sell" | "dividend";
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
