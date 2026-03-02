import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

// ==============================
// Environment Safety
// ==============================

if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌ Telegram token missing");
    process.exit(1);
}

if (!process.env.FOREX_API_KEY) {
    console.error("❌ Forex API key missing");
    process.exit(1);
}

// ==============================

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ==============================
// Bot Setup
// ==============================

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: true
});

const FREE_CHANNEL = "@Freeashsignalchanel";

// ==============================
// Session Filter
// London + New York window
// ==============================

function isActiveMarketSession() {
    const hour = new Date().getUTCHours();
    return hour >= 7 && hour <= 21;
}

// ==============================
// RSI Calculator
// ==============================

function calculateRSI(prices, period = 14) {

    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
        let change = prices[i] - prices[i - 1];

        if (change > 0) gains += change;
        else losses -= change;
    }

    let rs = (gains / period) / ((losses / period) || 1);

    return 100 - (100 / (1 + rs));
}

// ==============================
// Elite Signal Brain
// ==============================

function signalBrain(prices) {

    const last = prices[prices.length - 1];

    const ma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
    const ma200 = prices.slice(-200).reduce((a, b) => a + b, 0) / 200;

    const rsi = calculateRSI(prices);

    let score = 0;

    if (last > ma50 && ma50 > ma200) score += 45;
    if (last < ma50 && ma50 < ma200) score += 45;

    if (rsi > 48 && rsi < 62) score += 30;

    if (Math.abs(last - ma50) / last < 0.015) score += 25;

    return Math.min(score, 100);
}

// ==============================
// Signal Generator
// EURUSD only
// ==============================

let lastSignalTime = 0;

async function generateSignal() {

    try {

        if (!isActiveMarketSession()) return null;

        const now = Date.now();

        // 1 signal per day
        if (now - lastSignalTime < 24 * 60 * 60 * 1000)
            return null;

        const res = await axios.get(
            `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${process.env.FOREX_API_KEY}`
        );

        const data = res.data["Time Series FX (60min)"];
        if (!data) return null;

        const prices = Object.values(data)
            .map(v => parseFloat(v["4. close"]))
            .reverse();

        if (prices.length < 200) return null;

        const score = signalBrain(prices);

        if (score < 90) return null;

        const last = prices[prices.length - 1];
        const ma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;

        lastSignalTime = now;

        return {
            direction: last > ma50 ? "BUY 📈" : "SELL 📉",
            price: last.toFixed(5),
            score
        };

    } catch (err) {
        console.log(err.message);
        return null;
    }
}

// ==============================
// Channel Sender
// ==============================

async function sendSignal(message) {
    try {
        await bot.sendMessage(FREE_CHANNEL, message);
    } catch (err) {
        console.log(err.message);
    }
}

// ==============================
// Auto Community Signal Loop
// ==============================

setInterval(async () => {

    console.log("🌍 Community scan running");

    const signal = await generateSignal();

    if (!signal) return;

    const message = `
🔥 ASHBOT UGANDA FREE SIGNAL

Pair: EURUSD
Direction: ${signal.direction}
Entry: ${signal.price}
Confidence: ${signal.score}%

⚠ Research signal only.
Risk 1-3%.

🇺🇬 Free community trading helper.
`;

    sendSignal(message);

}, 60 * 60 * 1000);

// ==============================

app.get("/", (req, res) => {
    res.send("🔥 AshBot Community Running");
});

app.listen(PORT, () => {
    console.log("✅ Server running");
});
