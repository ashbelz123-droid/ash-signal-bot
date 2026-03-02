import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

// ==============================
// Environment Safety Check
// ==============================

if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN is missing in Render Environment Variables.");
    process.exit(1);
}

if (!process.env.FOREX_API_KEY) {
    console.error("❌ FOREX_API_KEY is missing in Render Environment Variables.");
    process.exit(1);
}

// ==============================
// Express Setup (Render Required)
// ==============================

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("🔥 AshBot V16 Elite Running");
});

app.listen(PORT, () => {
    console.log("✅ Express server running on port", PORT);
});

// ==============================
// Telegram Bot Setup
// ==============================

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: true
});

console.log("✅ Telegram bot polling started");

// Channel
const FREE_CHANNEL = "@Freeashsignalchanel";

// ==============================
// Market Session Intelligence
// ==============================

function isActiveMarketSession() {
    const utcHour = new Date().getUTCHours();
    return utcHour >= 7 && utcHour <= 21; // London + NY
}

// ==============================
// RSI Engine
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

    let avgGain = gains / period;
    let avgLoss = losses / period || 1;

    let rs = avgGain / avgLoss;
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

    // Trend alignment
    if (last > ma50 && ma50 > ma200) score += 40;
    if (last < ma50 && ma50 < ma200) score += 40;

    // Healthy RSI zone
    if (rsi > 45 && rsi < 65) score += 30;

    // Pullback zone
    if (Math.abs(last - ma50) / last < 0.015) score += 30;

    return Math.min(score, 100);
}

// ==============================
// Signal Generator
// ==============================

let lastSignalTime = 0;

async function generateSignal() {
    try {
        if (!isActiveMarketSession()) return null;

        // Prevent spam (1 signal per hour max)
        const now = Date.now();
        if (now - lastSignalTime < 60 * 60 * 1000) return null;

        const res = await axios.get(
            `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${process.env.FOREX_API_KEY}`
        );

        const data = res.data["Time Series FX (60min)"];
        if (!data) {
            console.log("AlphaVantage limit or no data.");
            return null;
        }

        const prices = Object.values(data)
            .map(v => parseFloat(v["4. close"]))
            .reverse();

        if (prices.length < 200) return null;

        const score = signalBrain(prices);
        if (score < 88) return null;

        const last = prices[prices.length - 1];
        const ma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;

        lastSignalTime = now;

        return {
            direction: last > ma50 ? "BUY 📈" : "SELL 📉",
            price: last.toFixed(5),
            score
        };

    } catch (err) {
        console.error("Signal generation error:", err.message);
        return null;
    }
}

// ==============================
// Safety Message
// ==============================

function tradingSafetyMessage() {
    return `
⚠ Research Signal Only
No guaranteed profit.
Risk 1% – 3% per trade.
Use personal judgment.
`;
}

// ==============================
// Commands
// ==============================

bot.onText(/\/start/, async (msg) => {
    await bot.sendMessage(msg.chat.id, `
🔥 AshBot V16 Elite Research Engine

🌍 London + NY session intelligence
📊 Rare high-quality signals only

Type /signal
`);
});

bot.onText(/\/signal/, async (msg) => {

    const signal = await generateSignal();

    if (!signal) {
        await bot.sendMessage(msg.chat.id,
            "⏳ No strong elite setup right now.");
        return;
    }

    const message = `
🏛 ASHBOT V16 ELITE SIGNAL

Direction: ${signal.direction}
Entry: ${signal.price}
Confidence: ${signal.score}%

${tradingSafetyMessage()}
`;

    try {
        await bot.sendMessage(FREE_CHANNEL, message);
        await bot.sendMessage(msg.chat.id, "✅ Signal sent to channel.");
    } catch (err) {
        console.error("Telegram send error:", err.message);
    }
});
