require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

const MONNIFY_BASE_URL =
  process.env.MONNIFY_ENVIRONMENT === "LIVE"
    ? "https://api.monnify.com"
    : "https://sandbox.monnify.com";

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

const virtualAccounts = new Map();

app.post("/api/virtual-account", async (req, res) => {
  try {
    const { userId, userName, userEmail, bvn } = req.body;

    if (!userId || !userName || !userEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (virtualAccounts.has(userId)) {
      return res.json({ success: true, account: virtualAccounts.get(userId) });
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

    const account = {
      accountNumber: data.responseBody.accountNumber,
      accountName: data.responseBody.accountName,
      bankName: data.responseBody.bankName || "Moniepoint MFB",
      bankCode: data.responseBody.bankCode,
      accountReference,
      userId,
    };

    virtualAccounts.set(userId, account);

    res.json({ success: true, account });
  } catch (err) {
    console.error("Virtual account error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/virtual-account/:userId", (req, res) => {
  const account = virtualAccounts.get(req.params.userId);
  if (!account) {
    return res.status(404).json({ error: "No virtual account found" });
  }
  res.json({ success: true, account });
});

app.post("/api/webhook/monnify", (req, res) => {
  const event = req.body;

  console.log("Monnify webhook received:", JSON.stringify(event, null, 2));

  if (event.eventType === "SUCCESSFUL_TRANSACTION") {
    const { accountReference, amountPaid, transactionReference } = event;

    console.log(`Payment received: ₦${amountPaid} to ${accountReference}`);
    console.log(`Transaction ref: ${transactionReference}`);

    // TODO: Credit user's balance in your database
    // This would integrate with your user database to add funds
  }

  res.sendStatus(200);
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.MONNIFY_ENVIRONMENT });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.MONNIFY_ENVIRONMENT || "SANDBOX"}`);
});
