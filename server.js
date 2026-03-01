require("dotenv").config();

const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ALPHA_KEY;
const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// Forex pairs
const PAIRS = [
    { from: "EUR", to: "USD" },
    { from: "GBP", to: "USD" }
];

// ===== AI Signal Engine =====
async function analyzePair(pair) {

    try {

        const url =
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${pair.from}&to_symbol=${pair.to}&interval=5min&apikey=${API_KEY}`;

        const response = await axios.get(url);

        const data = response.data["Time Series FX (5min)"];
        if (!data) return;

        const prices = Object.keys(data)
        .slice(0, 30)
        .map(t => parseFloat(data[t]["4. close"]));

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0) / prices.length;

        const momentum = current - prices[8];

        let signal = "HOLD 🤝";

        if (current > sma && momentum > 0.0001)
            signal = "BUY 📈";

        else if (current < sma && momentum < -0.0001)
            signal = "SELL 📉";

        if(signal !== "HOLD 🤝"){

            const tp =
            signal === "BUY 📈"
            ? (current + 0.0025).toFixed(5)
            : (current - 0.0025).toFixed(5);

            const sl =
            signal === "BUY 📈"
            ? (current - 0.0012).toFixed(5)
            : (current + 0.0012).toFixed(5);

            const message = `
🔥 ASH SIGNAL BOT PRO AI 🔥

Pair: ${pair.from}/${pair.to}
Signal: ${signal}

Entry: ${current}
TP: ${tp}
SL: ${sl}

AI Filter Active 🤖
`;

            await bot.sendMessage(CHAT_ID, message);
        }

    } catch(err){
        console.log("AI Engine Error:", err.message);
    }
}

// Scheduler (Render safe)
async function runBot(){
    for(const pair of PAIRS){
        await analyzePair(pair);
    }
}

// Wake-up endpoint (VERY IMPORTANT for Render free plan)
app.get("/", async (req,res)=>{

    await runBot();

    res.send("🔥 Ash Signal Bot Pro AI Running");
});

// Run scheduler every 4 minutes
setInterval(runBot, 240000);

app.listen(PORT,()=>{
    console.log("Ash Signal Bot Pro AI Live");
});
