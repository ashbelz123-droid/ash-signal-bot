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

// ==============================
// Stability Memory System
// ==============================

let lastSignalKey = "";
let signalToday = 0;

const MAX_SIGNAL_PER_DAY = 3;

// ==============================
// Trading Universe
// ==============================

const PAIRS = [
    { from:"EUR", to:"USD" },
    { from:"GBP", to:"USD" }
];

// ==============================
// Stability Intelligence Engine
// ==============================

function probabilityEngine(current,sma,momentum,volatility){

    let score = 50;

    if(current > sma) score += 15;
    if(momentum > 0) score += 15;

    if(Math.abs(momentum) > volatility*0.04)
        score += 12;

    return score;
}

// ==============================
// Strong Signal Scanner
// ==============================

async function analyzePair(pair){

    try{

        if(signalToday >= MAX_SIGNAL_PER_DAY)
            return;

        const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${pair.from}&to_symbol=${pair.to}&apikey=${API_KEY}`;

        const response = await axios.get(url);

        const dataset =
        response?.data?.["Time Series FX (Daily)"];

        if(!dataset) return;

        const times = Object.keys(dataset);

        if(times.length < 40) return;

        const prices = times.slice(0,50).map(t =>
            parseFloat(dataset[t]["4. close"])
        ).filter(x=>!isNaN(x));

        if(prices.length < 25) return;

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0)/prices.length;

        const momentum = current - prices[6];

        const volatility =
        Math.max(...prices) - Math.min(...prices);

        let signal = null;

        if(
            current > sma &&
            momentum > volatility*0.04 &&
            volatility > current*0.001
        ){
            signal = "BUY 📈";
        }

        if(
            current < sma &&
            momentum < -volatility*0.04 &&
            volatility > current*0.001
        ){
            signal = "SELL 📉";
        }

        if(!signal) return;

        const signalKey =
        `${pair.from}-${pair.to}-${signal}`;

        if(signalKey === lastSignalKey) return;

        const probability =
        probabilityEngine(current,sma,momentum,volatility);

        if(probability < 82) return;

        const tp =
        signal.includes("BUY")
        ? current + volatility*0.5
        : current - volatility*0.5;

        const sl =
        signal.includes("BUY")
        ? current - volatility*0.25
        : current + volatility*0.25;

        const message =
`🔥 ASH SIGNAL BOT V9 STABILITY MODE 🔥

Pair: ${pair.from}/${pair.to}

Signal: ${signal}
Confidence Probability: ${probability.toFixed(1)}%

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

Ultra Stable Mode Active ⭐
`;

        await bot.sendMessage(CHAT_ID,message);

        lastSignalKey = signalKey;
        signalToday++;

    }catch(err){
        console.log(err.message);
    }
}

// ==============================
// Render Wake Endpoint
// ==============================

app.get("/", async (req,res)=>{

    try{

        for(const pair of PAIRS){
            await analyzePair(pair);
        }

        res.send("🔥 Ash Signal Bot V9 Stability Running");

    }catch(err){
        res.send("Bot Active");
    }

});

// ==============================
// Server Listener
// ==============================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("Ash Signal Bot V9 Live");
});
