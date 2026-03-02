import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ===== CHECK ENV =====
if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("Missing TELEGRAM_BOT_TOKEN");
    process.exit(1);
}

if (!process.env.FOREX_API_KEY) {
    console.error("Missing FOREX_API_KEY");
    process.exit(1);
}

// ===== BOT SETUP (WEBHOOK MODE) =====
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

if (process.env.RENDER_EXTERNAL_URL) {
    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    );
}

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
    res.send("AshBot is running 🔥");
});

// ===== START COMMAND =====
bot.onText(/\/start/, async (msg) => {

    const text = `
🔥 Welcome to AshBot Free Signals

📊 Pair: EURUSD
⏰ Timeframe: 1 Hour
📡 Signals are generated automatically using trend + RSI logic.

━━━━━━━━━━━━━━━

📌 HOW TO USE:

1️⃣ Wait for signal in the channel
2️⃣ Open your trading app
3️⃣ Enter at the given price
4️⃣ Risk only 1–3% per trade
5️⃣ Always use Stop Loss

━━━━━━━━━━━━━━━

⚠ IMPORTANT:

• Research signals only
• Not financial advice
• Some days may have no signal
• Max 1 signal per day

Stay disciplined. Trade smart.
`;

    await bot.sendMessage(msg.chat.id, text);
});

// ===== SIMPLE RSI =====
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

// ===== SIGNAL LOGIC =====
let lastSignalTime = 0;
const CHANNEL = "@Freeashsignalchanel";

async function generateSignal() {

    try {

        const now = Date.now();
        if (now - lastSignalTime < 24 * 60 * 60 * 1000) return;

        const response = await axios.get(
            `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${process.env.FOREX_API_KEY}`
        );

        const data = response.data["Time Series FX (60min)"];
        if (!data) return;

        const prices = Object.values(data)
            .map(c => parseFloat(c["4. close"]))
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

        lastSignalTime = now;

        const direction = last > ma50 ? "BUY 📈" : "SELL 📉";

        const message = `
🔥 ASHBOT SIGNAL

Pair: EURUSD
Direction: ${direction}
Entry: ${last.toFixed(5)}
Confidence: ${score}%

Risk only 1–3%.
`;

        await bot.sendMessage(CHANNEL, message);

    } catch (err) {
        console.log(err.message);
    }
}

// ===== CHECK EVERY HOUR =====
setInterval(generateSignal, 60 * 60 * 1000);

// ===== START SERVER =====
app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running 🔥");
});
