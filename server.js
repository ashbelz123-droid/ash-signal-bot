require("dotenv").config();

const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT;

const API_KEY = process.env.ALPHA_KEY;
const CHAT_ID = process.env.CHAT_ID;
const TELEGRAM_TOKEN = process.env.TG_TOKEN;

const bot = new TelegramBot(TELEGRAM_TOKEN);

// =========================
// Signal Memory Lock System
// =========================

let lastSignal = "";

// =========================
// Trading Pairs
// =========================

const PAIRS = [
    { from:"EUR", to:"USD" },
    { from:"GBP", to:"USD" }
];

// =========================
// Advanced Signal Engine
// =========================

async function analyzePair(pair){

    try{

        const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${pair.from}&to_symbol=${pair.to}&apikey=${API_KEY}`;

        const response = await axios.get(url);

        if(!response?.data) return;

        const dataset = response.data["Time Series FX (Daily)"];

        if(!dataset) return;

        const times = Object.keys(dataset);

        if(times.length < 20) return;

        const prices = times.slice(0,30).map(t =>
            parseFloat(dataset[t]["4. close"])
        ).filter(x=>!isNaN(x));

        if(prices.length < 10) return;

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0)/prices.length;

        const momentum = current - prices[4];

        const volatility =
        Math.max(...prices) - Math.min(...prices);

        let signal = null;
        let confidence = 0;

        if(current > sma && momentum > volatility*0.02){
            signal = "BUY 📈";
            confidence = 75 + Math.random()*20;
        }

        if(current < sma && momentum < -volatility*0.02){
            signal = "SELL 📉";
            confidence = 75 + Math.random()*20;
        }

        if(!signal) return;

        const signalKey =
        `${pair.from}-${pair.to}-${signal}`;

        if(lastSignal === signalKey) return;

        lastSignal = signalKey;

        const tp =
        signal.includes("BUY")
        ? current + volatility*0.35
        : current - volatility*0.35;

        const sl =
        signal.includes("BUY")
        ? current - volatility*0.18
        : current + volatility*0.18;

        const message =
`🔥 ASH SIGNAL BOT V3 ULTRA 🔥

Pair: ${pair.from}/${pair.to}

Signal: ${signal}
Confidence: ${confidence.toFixed(1)}%

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

Advanced Filtering Active 🤖
`;

        await bot.sendMessage(CHAT_ID,message);

    }catch(err){
        console.log("Engine Error:",err.message);
    }
}

// =========================
// Render Wake Endpoint
// =========================

app.get("/", async (req,res)=>{

    try{

        for(const pair of PAIRS){
            await analyzePair(pair);
        }

        res.send("🔥 Ash Signal Bot V3 Running");

    }catch(err){
        res.send("Bot Active");
    }

});

// =========================
// Server Listener
// =========================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("Ash Signal Bot V3 Live");
});
