import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

process.env.NTBA_FIX_350 = "1";

// ==============================
// Environment Check
// ==============================

if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("Missing Telegram Token");
    process.exit(1);
}

if (!process.env.FOREX_API_KEY) {
    console.error("Missing Forex API Key");
    process.exit(1);
}

// ==============================
// Express Server
// ==============================

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Health Endpoint
app.get("/", (req, res) => {
    res.send("🔥 AshBot Elite Community Running");
});

// ==============================
// Telegram Bot Webhook Setup
// ==============================

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const CHANNEL = "@Freeashsignalchanel";

// Webhook Endpoint
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Register Webhook
if (process.env.RENDER_EXTERNAL_URL) {
    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    );
}

// ==============================
// Performance Tracking (Lifetime)
// ==============================

let totalTrades = 0;
let wins = 0;
let losses = 0;

// ==============================
// RSI Calculation
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
// Elite Signal Engine
// ==============================

async function generateSignal() {

    try {

        const response = await axios.get(
            `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${process.env.FOREX_API_KEY}`
        );

        const data = response.data["Time Series FX (60min)"];
        if (!data) return null;

        const prices = Object.values(data)
            .map(v => parseFloat(v["4. close"]))
            .reverse();

        if (prices.length < 200) return null;

        const last = prices[prices.length - 1];

        const ma50 = prices.slice(-50).reduce((a,b)=>a+b,0)/50;
        const ma200 = prices.slice(-200).reduce((a,b)=>a+b,0)/200;
        const rsi = calculateRSI(prices);

        let score = 0;

        if (last > ma50 && ma50 > ma200) score += 50;
        if (last < ma50 && ma50 < ma200) score += 50;
        if (rsi > 45 && rsi < 65) score += 40;

        if (score < 90) return null;

        const direction = last > ma50 ? "BUY 📈" : "SELL 📉";

        const entry = last;
        const sl = direction === "BUY 📈"
            ? entry - (entry * 0.0025)
            : entry + (entry * 0.0025);

        const tp1 = direction === "BUY 📈"
            ? entry + (entry * 0.005)
            : entry - (entry * 0.005);

        const tp2 = direction === "BUY 📈"
            ? entry + (entry * 0.01)
            : entry - (entry * 0.01);

        totalTrades++;

        const message = `
🔥 ASHBOT ELITE SIGNAL

Pair: EURUSD
Direction: ${direction}

Entry: ${entry.toFixed(5)}
Stop Loss: ${sl.toFixed(5)}

🎯 TP1: ${tp1.toFixed(5)}
🎯 TP2: ${tp2.toFixed(5)}

📊 Confidence: ${score}%

Risk: 1–2%
RR Ratio: ~1:2

⚠ Research signal only.
`;

        await bot.sendMessage(CHANNEL, message);

    } catch (err) {
        console.log(err.message);
    }
}

// ==============================
// Scheduler (Elite Scan)
// ==============================

setInterval(generateSignal, 60 * 60 * 1000);

// ==============================
// Start Server
// ==============================

app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 AshBot Elite Running");
});
