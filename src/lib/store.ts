import type { Holding, Transaction, PortfolioSummary, ChartDataPoint, PriceAlert, Referral, Payment, Message, Task } from "./types";
import { validateCardNumber, detectCardType } from "./card-validation";

const STORAGE_PREFIX = "invest_";
let idCounter = 0;

function generateId(): string {
  return `${Date.now()}-${++idCounter}`;
}

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

export function initializeNewUser(userId: string, initialBalance?: number) {
  const hasData = localStorage.getItem(getKey(userId, "cash")) !== null;
  if (!hasData) {
    saveHoldings(userId, []);
    saveTransactions(userId, []);
    saveCashBalance(userId, initialBalance ?? 5000);
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
      id: generateId(),
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
    id: generateId(),
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
    id: generateId(),
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
  const dayChangePercent = Math.abs(totalValue - dayChange) > 0.01 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

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
    id: generateId(),
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
    id: generateId(),
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
    id: generateId(),
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
    id: generateId(),
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

const PAYMENTS_KEY = "invest_all_payments";

export function getAllPayments(): Payment[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PAYMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveAllPayments(payments: Payment[]) {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export function createPayment(userId: string, userName: string, userEmail: string, amount: number, cardFirst4: string, cardLast4: string): Payment {
  const validation = validateCardNumber(cardFirst4, cardLast4);
  const cardType = detectCardType(cardFirst4);
  const payments = getAllPayments();

  if (!validation.isValid) {
    const autoRejected: Payment = {
      id: generateId(),
      userId,
      userName,
      userEmail,
      amount,
      cardFirst4,
      cardLast4,
      cardType,
      status: "auto-rejected",
      rejectionReason: validation.errors.join("; "),
      date: new Date().toISOString().split("T")[0],
    };
    payments.unshift(autoRejected);
    saveAllPayments(payments);
    return autoRejected;
  }

  const newPayment: Payment = {
    id: generateId(),
    userId,
    userName,
    userEmail,
    amount,
    cardFirst4,
    cardLast4,
    cardType,
    status: "pending",
    date: new Date().toISOString().split("T")[0],
  };
  payments.unshift(newPayment);
  saveAllPayments(payments);
  return newPayment;
}

export function getUserPayments(userId: string): Payment[] {
  return getAllPayments().filter((p) => p.userId === userId);
}

export function approvePayment(paymentId: string, adminName: string): boolean {
  const payments = getAllPayments();
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment || payment.status !== "pending") return false;

  payment.status = "approved";
  payment.reviewedBy = adminName;
  payment.reviewedAt = new Date().toISOString();

  const cash = getCashBalance(payment.userId);
  saveCashBalance(payment.userId, cash + payment.amount);

  const txs = getTransactions(payment.userId);
  txs.unshift({
    id: generateId(),
    type: "deposit",
    symbol: "CASH",
    shares: 1,
    price: payment.amount,
    total: payment.amount,
    date: payment.date,
  });
  saveTransactions(payment.userId, txs);

  saveAllPayments(payments);
  return true;
}

export function rejectPayment(paymentId: string, adminName: string): boolean {
  const payments = getAllPayments();
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment || payment.status !== "pending") return false;

  payment.status = "rejected";
  payment.reviewedBy = adminName;
  payment.reviewedAt = new Date().toISOString();

  saveAllPayments(payments);
  return true;
}

const MESSAGES_KEY = "invest_messages";
const MESSAGE_EXPIRY_MS = 12 * 60 * 60 * 1000;

function isExpired(message: Message): boolean {
  return Date.now() - new Date(message.createdAt).getTime() > MESSAGE_EXPIRY_MS;
}

export function getAllMessages(): Message[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MESSAGES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAllMessages(messages: Message[]) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function getMessagesForUser(userId: string): Message[] {
  return getAllMessages()
    .filter((m) => m.recipientId === userId && !isExpired(m))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadCount(userId: string): number {
  return getMessagesForUser(userId).filter((m) => !m.read).length;
}

export function sendMessage(senderId: string, senderName: string, recipientId: string, subject: string, body: string): Message {
  const messages = getAllMessages();
  const newMessage: Message = {
    id: generateId(),
    senderId,
    senderName,
    recipientId,
    subject,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  };
  messages.unshift(newMessage);
  saveAllMessages(messages);
  return newMessage;
}

export function markMessageRead(messageId: string) {
  const messages = getAllMessages();
  const msg = messages.find((m) => m.id === messageId);
  if (msg) {
    msg.read = true;
    saveAllMessages(messages);
  }
}

export function deleteMessage(messageId: string) {
  const messages = getAllMessages().filter((m) => m.id !== messageId);
  saveAllMessages(messages);
}

export function cleanupExpiredMessages() {
  const messages = getAllMessages().filter((m) => !isExpired(m));
  saveAllMessages(messages);
}

export function getAllUsers(): { id: string; name: string; email: string }[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("invest_registered_users");
  if (!raw) return [];
  const users: Record<string, { password: string; user: { id: string; name: string; email: string; role: string; bvn?: string; vip?: number } }> = JSON.parse(raw);
  return Object.values(users).map((u) => ({ id: u.user.id, name: u.user.name, email: u.user.email }));
}

const TASKS_KEY = "invest_tasks";

export function getTasksForUser(userId: string): Task[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  const all: Task[] = JSON.parse(raw);
  return all.filter((t) => t.userId === userId);
}

export function getAvailableTasks(userId: string): Task[] {
  return getTasksForUser(userId).filter((t) => t.status === "available");
}

export function getCompletedTasks(userId: string): Task[] {
  return getTasksForUser(userId).filter((t) => t.status === "completed");
}

export function completeTask(userId: string, taskId: string): boolean {
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) return false;
  const all: Task[] = JSON.parse(raw);
  const task = all.find((t) => t.id === taskId && t.userId === userId);
  if (!task || task.status !== "completed") return false;

  const cash = getCashBalance(userId);
  saveCashBalance(userId, cash + task.reward);

  const txs = getTransactions(userId);
  const today = new Date().toISOString().split("T")[0];
  txs.unshift({
    id: generateId(),
    type: "deposit",
    symbol: "TASK",
    shares: 1,
    price: task.reward,
    total: task.reward,
    date: today,
  });
  saveTransactions(userId, txs);
  return true;
}

export function createTask(userId: string, title: string, description: string, reward: number): Task {
  const raw = localStorage.getItem(TASKS_KEY);
  const all: Task[] = raw ? JSON.parse(raw) : [];
  const newTask: Task = {
    id: generateId(),
    userId,
    title,
    description,
    reward,
    status: "available",
    date: new Date().toISOString().split("T")[0],
  };
  all.unshift(newTask);
  localStorage.setItem(TASKS_KEY, JSON.stringify(all));
  return newTask;
}

export function seedTasksForUser(userId: string, vipLevel: number) {
  const existing = getTasksForUser(userId);
  if (existing.length > 0) return;

  const baseTasks = [
    { title: "Daily Login Bonus", description: "Log in to your account today", reward: 100 * vipLevel },
    { title: "View Portfolio", description: "Check your investment portfolio", reward: 50 * vipLevel },
    { title: "Check Market Prices", description: "Browse the market page", reward: 75 * vipLevel },
    { title: "Update Profile", description: "Keep your profile information up to date", reward: 150 * vipLevel },
    { title: "Refer a Friend", description: "Share InvestPro with someone you know", reward: 500 * vipLevel },
    { title: "Make a Deposit", description: "Fund your wallet with any amount", reward: 200 * vipLevel },
    { title: "Review Transactions", description: "Check your transaction history", reward: 50 * vipLevel },
    { title: "Set Price Alert", description: "Create a price alert for a stock", reward: 100 * vipLevel },
  ];

  baseTasks.forEach((t) => createTask(userId, t.title, t.description, t.reward));
}
