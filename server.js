import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

process.env.NTBA_FIX_350 = "1";

// ==============================
// Server Setup
// ==============================

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Health Endpoint
app.get("/", (req, res) => {
    res.send("🔥 AshBot Community Brand Running");
});

// ==============================
// Bot Setup (Webhook Mode)
// ==============================

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const CHANNEL = "@Freeashsignalchanel";

// Webhook Endpoint
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Webhook Register
if (process.env.RENDER_EXTERNAL_URL) {
    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    );
}

// ==============================
// Heartbeat Anti-Sleep System
// ==============================

setInterval(async () => {
    try {
        if (!process.env.RENDER_EXTERNAL_URL) return;
        await axios.get(process.env.RENDER_EXTERNAL_URL);
        console.log("🔥 Anti-sleep heartbeat active");
    } catch (err) {
        console.log("Heartbeat error");
    }
}, 5 * 60 * 1000);

// ==============================
// Liquidity Session Filter
// ==============================

function isLiquiditySession() {

    const utcHour = new Date().getUTCHours();

    return (utcHour >= 7 && utcHour <= 10) ||
           (utcHour >= 13 && utcHour <= 17);
}

// ==============================
// RSI Logic
// ==============================

function calculateRSI(prices, period = 14) {

    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {

        let diff = prices[i] - prices[i - 1];

        if (diff > 0) gains += diff;
        else losses -= diff;
    }

    let rs = (gains / period) / ((losses / period) || 1);

    return 100 - (100 / (1 + rs));
}

// ==============================
// Start Command Brand Message
// ==============================

bot.onText(/\/start/, async (msg) => {

    const text = `
🔥 ASHBOT FREE COMMUNITY

📊 Pair: EURUSD
⏰ Strategy: 1 Hour Trend System

🌍 Signals appear only inside:
London & New York liquidity windows.

⚠ Risk only 1–2% per trade.

Use /performance to check stats.
`;

    await bot.sendMessage(msg.chat.id, text);
});

// ==============================
// Performance Tracker
// ==============================

let totalTrades = 0;
let wins = 0;
let losses = 0;

bot.onText(/\/performance/, async (msg) => {

    const winRate = totalTrades === 0
        ? 0
        : ((wins / totalTrades) * 100).toFixed(2);

    const text = `
📊 Lifetime Performance

Trades: ${totalTrades}
Wins: ${wins}
Losses: ${losses}

Win Rate: ${winRate}%
`;

    await bot.sendMessage(msg.chat.id, text);
});

// ==============================
// Signal Engine
// ==============================

async function communitySignalEngine() {

    try {

        if (!isLiquiditySession()) return;

        const response = await axios.get(
            `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${process.env.FOREX_API_KEY}`
        );

        const data = response.data["Time Series FX (60min)"];
        if (!data) return;

        const prices = Object.values(data)
            .map(v => parseFloat(v["4. close"]))
            .reverse();

        if (prices.length < 200) return;

        const last = prices[prices.length - 1];

        const ma50 = prices.slice(-50).reduce((a,b)=>a+b,0)/50;
        const ma200 = prices.slice(-200).reduce((a,b)=>a+b,0)/200;

        const rsi = calculateRSI(prices);

        let score = 0;

        if (last > ma50 && ma50 > ma200) score += 50;
        if (last < ma50 && ma50 < ma200) score += 50;
        if (rsi > 45 && rsi < 65) score += 40;

        if (score < 90) return;

        const direction = last > ma50 ? "BUY 📈" : "SELL 📉";

        const entry = last;

        const sl = direction === "BUY 📈"
            ? entry - entry * 0.0025
            : entry + entry * 0.0025;

        const tp1 = direction === "BUY 📈"
            ? entry + entry * 0.005
            : entry - entry * 0.005;

        const tp2 = direction === "BUY 📈"
            ? entry + entry * 0.01
            : entry - entry * 0.01;

        totalTrades++;

        const message = `
🔥 ASHBOT ELITE SIGNAL

Pair: EURUSD
Direction: ${direction}

Entry: ${entry.toFixed(5)}
SL: ${sl.toFixed(5)}

🎯 TP1: ${tp1.toFixed(5)}
🎯 TP2: ${tp2.toFixed(5)}

Confidence: ${score}%

Risk: 1–2%

⚠ Free community signal.
`;

        await bot.sendMessage(CHANNEL, message);

    } catch (err) {
        console.log(err.message);
    }
}

// ==============================
// Scheduler
// ==============================

setInterval(communitySignalEngine, 60 * 60 * 1000);

// ==============================
// Start Server
// ==============================

app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 AshBot Brand Running");
});
