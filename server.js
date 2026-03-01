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

// =============================
// Signal Memory Protection
// =============================

let lastSignalKey = "";

// =============================
// Trading Universe
// =============================

const PAIRS = [
    { from:"EUR", to:"USD" },
    { from:"GBP", to:"USD" }
];

// =============================
// Statistical Intelligence Engine
// =============================

function calculateConfidence(current,sma,momentum,volatility){

    let score = 50;

    if(current > sma) score += 15;
    if(momentum > 0) score += 15;

    if(Math.abs(momentum) > volatility*0.02)
        score += 10;

    return score;
}

// =============================
// Elite Research Signal Scanner
// =============================

async function analyzePair(pair){

    try{

        const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${pair.from}&to_symbol=${pair.to}&apikey=${API_KEY}`;

        const response = await axios.get(url);

        const dataset =
        response?.data?.["Time Series FX (Daily)"];

        if(!dataset) return;

        const times = Object.keys(dataset);

        if(times.length < 30) return;

        const prices = times.slice(0,30).map(t =>
            parseFloat(dataset[t]["4. close"])
        ).filter(x=>!isNaN(x));

        if(prices.length < 15) return;

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0)/prices.length;

        const momentum = current - prices[3];

        const volatility =
        Math.max(...prices) - Math.min(...prices);

        let signal = null;

        if(current > sma && momentum > volatility*0.02)
            signal = "BUY 📈";

        if(current < sma && momentum < -volatility*0.02)
            signal = "SELL 📉";

        if(!signal) return;

        const signalKey =
        `${pair.from}-${pair.to}-${signal}`;

        if(signalKey === lastSignalKey) return;

        lastSignalKey = signalKey;

        const confidence =
        calculateConfidence(current,sma,momentum,volatility);

        if(confidence < 70) return;

        const tp =
        signal.includes("BUY")
        ? current + volatility*0.35
        : current - volatility*0.35;

        const sl =
        signal.includes("BUY")
        ? current - volatility*0.18
        : current + volatility*0.18;

        const message =
`🔥 ASH SIGNAL BOT V6 ELITE 🔥

Pair: ${pair.from}/${pair.to}

Signal: ${signal}
Confidence: ${confidence.toFixed(1)}%

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

Sent to Telegram Chat 🤖
`;

        await bot.sendMessage(CHAT_ID,message);

    }catch(err){
        console.log("Scanner Error:",err.message);
    }
}

// =============================
// Render Wake Endpoint
// =============================

app.get("/", async (req,res)=>{

    try{

        for(const pair of PAIRS){
            await analyzePair(pair);
        }

        res.send("🔥 Ash Signal Bot V6 Running");

    }catch(err){
        res.send("Bot Active");
    }

});

// =============================
// Server Listener
// =============================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("Ash Signal Bot V6 Live");
});
