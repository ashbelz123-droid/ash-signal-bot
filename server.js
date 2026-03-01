require("dotenv").config();

const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

process.on("uncaughtException", err=>{
    console.log("Uncaught Exception:", err.message);
});

process.on("unhandledRejection", err=>{
    console.log("Unhandled Rejection:", err?.message);
});

const app = express();

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ALPHA_KEY;
const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if(!API_KEY || !TELEGRAM_TOKEN || !CHAT_ID){
    console.log("Missing environment variables.");
}

const bot = new TelegramBot(TELEGRAM_TOKEN);

const PAIRS = [
    { from:"EUR", to:"USD" },
    { from:"GBP", to:"USD" }
];

// ===============================
// MARKET ENGINE (SAFE VERSION)
// ===============================

async function scanPair(pair){

    try{

        const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${pair.from}&to_symbol=${pair.to}&apikey=${API_KEY}`;

        const response = await axios.get(url);

        if(!response?.data) return null;

        const dataset = response.data["Time Series FX (Daily)"];

        if(!dataset || typeof dataset !== "object") return null;

        const keys = Object.keys(dataset);
        if(keys.length < 20) return null;

        const prices = keys.slice(0,20).map(k =>
            parseFloat(dataset[k]["4. close"])
        ).filter(n=>!isNaN(n));

        if(prices.length < 10) return null;

        const current = prices[0];
        const sma = prices.reduce((a,b)=>a+b,0)/prices.length;
        const momentum = current - prices[3];

        let signal = null;

        if(current > sma && momentum > 0) signal = "BUY";
        if(current < sma && momentum < 0) signal = "SELL";

        if(!signal) return null;

        const volatility =
        Math.max(...prices) - Math.min(...prices);

        const tp =
        signal === "BUY"
        ? current + volatility*0.3
        : current - volatility*0.3;

        const sl =
        signal === "BUY"
        ? current - volatility*0.15
        : current + volatility*0.15;

        return {
            pair: `${pair.from}/${pair.to}`,
            signal,
            entry: current.toFixed(5),
            tp: tp.toFixed(5),
            sl: sl.toFixed(5)
        };

    }catch(err){
        console.log("Scan Error:", err.message);
        return null;
    }
}

// ===============================
// HTTP TRIGGER (RENDER SAFE)
// ===============================

app.get("/", async (req,res)=>{

    try{

        const results = [];

        for(const pair of PAIRS){
            const result = await scanPair(pair);
            if(result) results.push(result);
        }

        if(results.length === 0){
            return res.send("Bot active. No signals.");
        }

        for(const r of results){

            const message =
`🔥 ASH SIGNAL BOT PRODUCTION 🔥

Pair: ${r.pair}
Signal: ${r.signal}

Entry: ${r.entry}
TP: ${r.tp}
SL: ${r.sl}

Risk Management Enabled 📊
`;

            await bot.sendMessage(CHAT_ID,message);
        }

        res.send("Signals sent successfully.");

    }catch(err){
        console.log("Root Error:",err.message);
        res.send("Bot running safely.");
    }

});

// ===============================
// SERVER LISTENER
// ===============================

app.listen(PORT,()=>{
    console.log("Ash Signal Bot Production Live on Port", PORT);
});
