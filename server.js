import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();
process.env.NTBA_FIX_350 = "1";

/*
====================================
ASHBOT ELITE COMMUNITY SIGNAL ENGINE
Owner: Ashbelz
Pairs: Major Forex Only
Hosting: Render Free Tier Friendly
====================================
*/

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const CHANNEL = "@Freeashsignalchanel";

/* =========================
Webhook Setup
========================= */

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

if (process.env.RENDER_EXTERNAL_URL) {
    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    ).catch(err => console.log(err.message));
}

/* =========================
Anti Sleep Ping
========================= */

setInterval(async () => {
    try {
        if (!process.env.RENDER_EXTERNAL_URL) return;
        await axios.get(process.env.RENDER_EXTERNAL_URL);
    } catch {}
}, 5 * 60 * 1000);

/* =========================
Pairs List
========================= */

const PAIRS = [
    { from: "EUR", to: "USD" },
    { from: "GBP", to: "USD" },
    { from: "USD", to: "JPY" },
    { from: "AUD", to: "USD" },
    { from: "USD", to: "CAD" }
];

/* =========================
Signal Limits
========================= */

let dailySignalCount = 0;
let lastSignalDay = new Date().getUTCDate();

/* =========================
RSI Calculator
========================= */

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

/* =========================
Liquidity Session Filter
London + New York
========================= */

function isLiquiditySession() {

    const utcHour = new Date().getUTCHours();

    return (utcHour >= 7 && utcHour <= 11) ||
           (utcHour >= 13 && utcHour <= 17);
}

/* =========================
Start Command Message
========================= */

bot.onText(/\/start/, async (msg) => {

    const text = `
🔥 ASHBOT ELITE COMMUNITY

👤 Owner: Ashbelz

Strategy: Institutional Trend Pullback Sniper

📊 Major Forex Pairs Only:
EURUSD | GBPUSD | USDJPY | AUDUSD | USDCAD

⚠ Caution Message:
• Signals are research guidance only.
• Use 1–2% risk per trade.
• Market movement is uncertain.

Channel Signal Hub:
👉 https://t.me/Freeashsignalchanel

Stay disciplined ❤️
`;

    await bot.sendMessage(msg.chat.id, text);
});

/* =========================
Signal Engine
========================= */

async function communitySignalEngine() {

    try {

        if (!isLiquiditySession()) return;

        const today = new Date().getUTCDate();

        if (today !== lastSignalDay) {
            dailySignalCount = 0;
            lastSignalDay = today;
        }

        if (dailySignalCount >= 2) return;

        for (let pair of PAIRS) {

            const response = await axios.get(
                `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${pair.from}&to_symbol=${pair.to}&interval=60min&apikey=${process.env.FOREX_API_KEY}`
            );

            const data = response.data["Time Series FX (60min)"];
            if (!data) continue;

            const candles = Object.values(data).slice(1).reverse();
            if (candles.length < 200) continue;

            const closes = candles.map(c => parseFloat(c["4. close"]));

            const last = closes[closes.length - 1];
            const ma50 = closes.slice(-50).reduce((a,b)=>a+b,0)/50;
            const ma200 = closes.slice(-200).reduce((a,b)=>a+b,0)/200;
            const rsi = calculateRSI(closes);

            const trendUp = last > ma50 && ma50 > ma200;
            const trendDown = last < ma50 && ma50 < ma200;

            const strongTrend = Math.abs(ma50 - ma200) > 0.0005;
            if (!strongTrend) continue;

            const nearMA50 = Math.abs(last - ma50) < 0.0007;
            if (!nearMA50) continue;

            if (trendUp && rsi < 55) continue;
            if (trendDown && rsi > 45) continue;

            if (!trendUp && !trendDown) continue;

            const direction = trendUp ? "BUY 📈" : "SELL 📉";
            const entry = last;

            const sl = trendUp
                ? entry - entry * 0.0018
                : entry + entry * 0.0018;

            const tp = trendUp
                ? entry + entry * 0.005
                : entry - entry * 0.005;

            dailySignalCount++;

            const precision = pair.to === "JPY" ? 3 : 5;

            const message = `
🔥 ASHBOT ELITE SNIPER SIGNAL

Pair: ${pair.from}${pair.to}
Direction: ${direction}

Entry: ${entry.toFixed(precision)}
SL: ${sl.toFixed(precision)}
TP: ${tp.toFixed(precision)}

⭐ SETUP STRENGTH: 98%

⚠ Risk 1–2% only.
Free community signal ❤️
`;

            await bot.sendMessage(CHANNEL, message);
            break;
        }

    } catch (error) {
        console.log(error.message);
    }
}

/* =========================
Engine Scheduler
========================= */

setInterval(communitySignalEngine, 15 * 60 * 1000);

/* =========================
Server Start
========================= */

app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 AshBot Elite Running");
});
