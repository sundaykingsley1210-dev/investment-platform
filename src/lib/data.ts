import type { Holding, Transaction, MarketData, PortfolioSummary, ChartDataPoint } from "./types";

export const mockHoldings: Holding[] = [
  { id: "1", symbol: "AAPL", name: "Apple Inc.", shares: 50, avgCost: 142.50, currentPrice: 198.50, change: 2.35, changePercent: 1.20, sector: "Technology" },
  { id: "2", symbol: "MSFT", name: "Microsoft Corp.", shares: 30, avgCost: 285.00, currentPrice: 420.75, change: -1.25, changePercent: -0.30, sector: "Technology" },
  { id: "3", symbol: "GOOGL", name: "Alphabet Inc.", shares: 15, avgCost: 105.00, currentPrice: 175.20, change: 3.10, changePercent: 1.80, sector: "Technology" },
  { id: "4", symbol: "AMZN", name: "Amazon.com Inc.", shares: 25, avgCost: 128.00, currentPrice: 186.40, change: -0.85, changePercent: -0.45, sector: "Consumer Cyclical" },
  { id: "5", symbol: "NVDA", name: "NVIDIA Corp.", shares: 40, avgCost: 45.00, currentPrice: 135.60, change: 5.40, changePercent: 4.16, sector: "Technology" },
  { id: "6", symbol: "JPM", name: "JPMorgan Chase", shares: 20, avgCost: 145.00, currentPrice: 205.30, change: 1.10, changePercent: 0.54, sector: "Financial Services" },
  { id: "7", symbol: "V", name: "Visa Inc.", shares: 18, avgCost: 220.00, currentPrice: 285.60, change: 0.75, changePercent: 0.26, sector: "Financial Services" },
  { id: "8", symbol: "JNJ", name: "Johnson & Johnson", shares: 15, avgCost: 162.00, currentPrice: 155.80, change: -0.45, changePercent: -0.29, sector: "Healthcare" },
  { id: "9", symbol: "WMT", name: "Walmart Inc.", shares: 22, avgCost: 148.00, currentPrice: 175.90, change: 0.90, changePercent: 0.51, sector: "Consumer Defensive" },
  { id: "10", symbol: "PG", name: "Procter & Gamble", shares: 12, avgCost: 140.00, currentPrice: 168.25, change: 0.35, changePercent: 0.21, sector: "Consumer Defensive" },
];

export const mockTransactions: Transaction[] = [
  { id: "1", type: "buy", symbol: "NVDA", shares: 10, price: 130.20, total: 1302.00, date: "2026-07-05" },
  { id: "2", type: "sell", symbol: "TSLA", shares: 5, price: 245.80, total: 1229.00, date: "2026-07-03" },
  { id: "3", type: "dividend", symbol: "AAPL", shares: 50, price: 0.25, total: 12.50, date: "2026-07-01" },
  { id: "4", type: "buy", symbol: "MSFT", shares: 10, price: 418.50, total: 4185.00, date: "2026-06-28" },
  { id: "5", type: "buy", symbol: "GOOGL", shares: 5, price: 172.40, total: 862.00, date: "2026-06-25" },
  { id: "6", type: "sell", symbol: "META", shares: 8, price: 510.30, total: 4082.40, date: "2026-06-22" },
  { id: "7", type: "dividend", symbol: "JPM", shares: 20, price: 1.15, total: 23.00, date: "2026-06-20" },
  { id: "8", type: "buy", symbol: "V", shares: 8, price: 283.10, total: 2264.80, date: "2026-06-18" },
];

export const mockMarketData: MarketData[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 198.50, change: 2.35, changePercent: 1.20, volume: "52.3M", marketCap: "3.08T" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 420.75, change: -1.25, changePercent: -0.30, volume: "18.7M", marketCap: "3.12T" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 175.20, change: 3.10, changePercent: 1.80, volume: "24.1M", marketCap: "2.17T" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 186.40, change: -0.85, changePercent: -0.45, volume: "31.5M", marketCap: "1.94T" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 135.60, change: 5.40, changePercent: 4.16, volume: "89.2M", marketCap: "3.33T" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.90, change: -3.20, changePercent: -1.27, volume: "67.8M", marketCap: "794B" },
  { symbol: "META", name: "Meta Platforms", price: 512.40, change: 4.60, changePercent: 0.91, volume: "15.3M", marketCap: "1.30T" },
  { symbol: "JPM", name: "JPMorgan Chase", price: 205.30, change: 1.10, changePercent: 0.54, volume: "8.9M", marketCap: "592B" },
  { symbol: "V", name: "Visa Inc.", price: 285.60, change: 0.75, changePercent: 0.26, volume: "6.2M", marketCap: "585B" },
  { symbol: "JNJ", name: "Johnson & Johnson", price: 155.80, change: -0.45, changePercent: -0.29, volume: "7.1M", marketCap: "375B" },
  { symbol: "WMT", name: "Walmart Inc.", price: 175.90, change: 0.90, changePercent: 0.51, volume: "9.4M", marketCap: "473B" },
  { symbol: "PG", name: "Procter & Gamble", price: 168.25, change: 0.35, changePercent: 0.21, volume: "5.8M", marketCap: "396B" },
];

export function getPortfolioSummary(holdings: Holding[]): PortfolioSummary {
  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = (totalGain / totalCost) * 100;
  const dayChange = holdings.reduce((sum, h) => sum + h.shares * h.change, 0);
  const dayChangePercent = (dayChange / (totalValue - dayChange)) * 100;
  return {
    totalValue,
    totalGain,
    totalGainPercent,
    dayChange,
    dayChangePercent,
    cashBalance: 12450.00,
  };
}

export function generateChartData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let value = 85000;
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value += (Math.random() - 0.45) * 2000;
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}
