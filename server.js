import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

process.env.NTBA_FIX_350 = "1";

/*
====================================
SUPER ELITE COMMUNITY BRAND BOT
====================================
Pair: EURUSD
Hosting: Render Free Tier Friendly
Strategy: 1H Trend Structure
Max Signals Per Day: 3
Confidence Threshold: 95%
====================================
*/

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
    res.send("🔥 AshBot Super Elite Running");
});

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const CHANNEL = "@Freeashsignalchanel";

/* Webhook */

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

if (process.env.RENDER_EXTERNAL_URL) {
    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    );
}

/* ============================
ANTI SLEEP HEARTBEAT
============================ */

setInterval(async () => {
    try {
        if (!process.env.RENDER_EXTERNAL_URL) return;
        await axios.get(process.env.RENDER_EXTERNAL_URL);
    } catch {}
}, 5 * 60 * 1000);

/* ============================
SUPER ELITE DAILY LIMIT CONTROL
============================ */

let dailySignalCount = 0;
let lastSignalDay = new Date().getUTCDate();

/* ============================
RSI CALCULATOR
============================ */

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

/* ============================
SESSION FILTER
London + New York Liquidity
============================ */

function isLiquiditySession() {

    const utcHour = new Date().getUTCHours();

    return (utcHour >= 7 && utcHour <= 10) ||
           (utcHour >= 13 && utcHour <= 17);
}

/* ============================
START COMMAND
============================ */

bot.onText(/\/start/, async (msg) => {

    const text = `
🔥 ASHBOT SUPER ELITE COMMUNITY

Pair: EURUSD
Strategy: 1H Structure Trend System

✅ Ultra strict setup filter
✅ Max 3 signals per day
✅ Super high quality signals

⚠ Trade responsibly.
Risk 1–2%.
`;

    await bot.sendMessage(msg.chat.id, text);
});

/* ============================
PERFORMANCE COMMAND
============================ */

bot.onText(/\/performance/, async (msg) => {

    const text = `
📊 Lifetime Performance

Feature under community mode.
Track trade manually.
`;

    await bot.sendMessage(msg.chat.id, text);
});

/* ============================
SUPER ELITE SIGNAL ENGINE
============================ */

async function communitySignalEngine() {

    try {

        if (!isLiquiditySession()) return;

        const today = new Date().getUTCDate();

        if (today !== lastSignalDay) {
            dailySignalCount = 0;
            lastSignalDay = today;
        }

        if (dailySignalCount >= 3) return;

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

        if (score < 95) return;

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

        dailySignalCount++;

        const message = `
🔥 ASHBOT SUPER ELITE SIGNAL

Pair: EURUSD
Direction: ${direction}

Entry: ${entry.toFixed(5)}
SL: ${sl.toFixed(5)}

🎯 TP1: ${tp1.toFixed(5)}
🎯 TP2: ${tp2.toFixed(5)}

⭐ CONFIDENCE: ${score}%

⚠ Free community signal.
`;

        await bot.sendMessage(CHANNEL, message);

    } catch {}
}

/* Scheduler */

setInterval(communitySignalEngine, 60 * 60 * 1000);

/* Server Start */

app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 AshBot Super Elite Running");
});
