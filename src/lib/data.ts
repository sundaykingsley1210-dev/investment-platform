import type { MarketData } from "./types";

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
