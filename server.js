require("dotenv").config();

const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ALPHA_KEY;
const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN);

// ===== SAFE MARKET SCANNER =====
async function analyzePair(pair){

    try{

        if(!API_KEY) return;

        const url =
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${pair.from}&to_symbol=${pair.to}&interval=5min&apikey=${API_KEY}`;

        const response = await axios.get(url);

        if(!response.data) return;

        const data = response.data["Time Series FX (5min)"];

        if(!data || typeof data !== "object") return;

        const times = Object.keys(data);

        if(times.length < 12) return;

        const prices = times.slice(0,20).map(t =>
            parseFloat(data[t]["4. close"])
        );

        if(prices.length < 6) return;

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0) / prices.length;

        const momentum = current - prices[5];

        let signal = "HOLD 🤝";

        if(current > sma && momentum > 0.0001)
            signal = "BUY 📈";

        else if(current < sma && momentum < -0.0001)
            signal = "SELL 📉";

        if(signal !== "HOLD 🤝"){

            const tp =
            signal === "BUY 📈"
            ? (current + 0.0020).toFixed(5)
            : (current - 0.0020).toFixed(5);

            const sl =
            signal === "BUY 📈"
            ? (current - 0.0010).toFixed(5)
            : (current + 0.0010).toFixed(5);

            const message =
`🔥 ASH SIGNAL BOT PRO 🔥

Pair: ${pair.from}/${pair.to}
Signal: ${signal}

Entry: ${current}
TP: ${tp}
SL: ${sl}
`;

            await bot.sendMessage(CHAT_ID, message);
        }

    }catch(err){
        console.log("Scanner Error:", err.message);
    }
}

// ===== BOT LOOP =====
const PAIRS = [
    { from: "EUR", to: "USD" },
    { from: "GBP", to: "USD" }
];

async function runBot(){

    for(const pair of PAIRS){
        await analyzePair(pair);
    }

}

// ⭐ Render Wake Endpoint (VERY IMPORTANT)
app.get("/", async (req,res)=>{
    await runBot();
    res.send("🔥 Ash Signal Bot Active");
});

// ⭐ Scheduler (Safe Free Plan Interval)
setInterval(runBot, 300000);

// Start Server
app.listen(PORT, ()=>{
    console.log("Ash Signal Bot Running");
});
