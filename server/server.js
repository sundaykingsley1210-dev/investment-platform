require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  }
}));
app.use(express.json());

const MONNIFY_BASE_URL =
  process.env.MONNIFY_ENVIRONMENT === "LIVE"
    ? "https://api.monnify.com"
    : "https://sandbox.monnify.com";

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const ACCOUNTS_FILE = path.join(DATA_DIR, "virtual-accounts.json");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");

function loadJSON(file, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let cachedToken = null;
let tokenExpiry = 0;

async function getMonnifyToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const credentials = Buffer.from(
    `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!data.requestSuccessful) {
    throw new Error(data.responseMessage || "Monnify auth failed");
  }

  cachedToken = data.responseBody.accessToken;
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken;
}

// Create virtual account for user
app.post("/api/virtual-account", async (req, res) => {
  try {
    const { userId, userName, userEmail, bvn } = req.body;

    if (!userId || !userName || !userEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const accounts = loadJSON(ACCOUNTS_FILE);
    if (accounts[userId]) {
      return res.json({ success: true, account: accounts[userId] });
    }

    const token = await getMonnifyToken();
    const accountReference = `INV-${userId}-${Date.now()}`;

    const payload = {
      accountReference,
      accountName: `${userName} Investment Account`,
      currencyCode: "NGN",
      contractCode: process.env.MONNIFY_CONTRACT_CODE,
      customerEmail: userEmail,
      customerName: userName,
      getAllAvailableBanks: true,
    };

    if (bvn && bvn.length === 11) {
      payload.bvn = bvn;
    }

    const res2 = await fetch(
      `${MONNIFY_BASE_URL}/api/v2/bank-transfer/reserved-accounts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res2.json();

    if (!data.requestSuccessful) {
      return res.status(400).json({ error: data.responseMessage });
    }

    const bankAccounts = data.responseBody.accounts || [];
    const moniepoint = bankAccounts.find(a => a.bankName.toLowerCase().includes("moniepoint"));
    const selected = moniepoint || bankAccounts[0];

    if (!selected) {
      return res.status(400).json({ error: "No virtual account generated" });
    }

    const account = {
      accountNumber: selected.accountNumber,
      accountName: selected.accountName || data.responseBody.accountName,
      bankName: selected.bankName,
      bankCode: selected.bankCode,
      accountReference,
      reservationReference: data.responseBody.reservationReference,
      userId,
    };

    accounts[userId] = account;
    saveJSON(ACCOUNTS_FILE, accounts);

    res.json({ success: true, account });
  } catch (err) {
    console.error("Virtual account error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's virtual account
app.get("/api/virtual-account/:userId", (req, res) => {
  const accounts = loadJSON(ACCOUNTS_FILE);
  const account = accounts[req.params.userId];
  if (!account) {
    return res.status(404).json({ error: "No virtual account found" });
  }
  res.json({ success: true, account });
});

// Webhook: Monnify notifies when payment is received
app.post("/api/webhook/monnify", (req, res) => {
  const event = req.body;

  console.log("=== MONNIFY WEBHOOK ===");
  console.log(JSON.stringify(event, null, 2));

  if (event.eventType === "SUCCESSFUL_TRANSACTION") {
    const { accountReference, amountPaid, transactionReference, paidOn } = event;

    const transactions = loadJSON(TRANSACTIONS_FILE, []);
    transactions.push({
      id: transactionReference || Date.now().toString(),
      accountReference,
      amount: parseFloat(amountPaid),
      transactionReference,
      paidOn: paidOn || new Date().toISOString(),
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });
    saveJSON(TRANSACTIONS_FILE, transactions);

    console.log(`CONFIRMED: ₦${amountPaid} to ${accountReference}`);
  }

  res.sendStatus(200);
});

// Frontend polls this to get confirmed deposits
app.get("/api/deposits/:userId", (req, res) => {
  const accounts = loadJSON(ACCOUNTS_FILE);
  const account = accounts[req.params.userId];
  if (!account) {
    return res.json({ success: true, deposits: [] });
  }

  const transactions = loadJSON(TRANSACTIONS_FILE, []);
  const userDeposits = transactions.filter(
    (t) => t.accountReference === account.accountReference && t.status === "confirmed"
  );

  res.json({ success: true, deposits: userDeposits });
});

// Get all confirmed deposits (admin)
app.get("/api/admin/deposits", (req, res) => {
  const transactions = loadJSON(TRANSACTIONS_FILE, []);
  const confirmed = transactions.filter((t) => t.status === "confirmed");
  res.json({ success: true, deposits: confirmed });
});

// Get all virtual accounts (admin)
app.get("/api/admin/accounts", (req, res) => {
  const accounts = loadJSON(ACCOUNTS_FILE);
  res.json({ success: true, accounts: Object.values(accounts) });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.MONNIFY_ENVIRONMENT });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.MONNIFY_ENVIRONMENT || "SANDBOX"}`);
});
