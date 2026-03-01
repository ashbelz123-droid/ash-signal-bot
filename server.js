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
// GOD MODE MEMORY PROTECTION
// =============================

let lastSignalHash = "";

// =============================
// Trading Pairs
// =============================

const PAIRS = [
    { from:"EUR", to:"USD" },
    { from:"GBP", to:"USD" }
];

// =============================
// GOD MODE ENGINE
// =============================

function calculateScore(current, sma, momentum, volatility){

    let score = 50;

    if(current > sma) score += 15;
    if(momentum > 0) score += 15;

    if(Math.abs(momentum) > volatility*0.02)
        score += 10;

    return score;
}

async function analyzePair(pair){

    try{

        const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${pair.from}&to_symbol=${pair.to}&apikey=${API_KEY}`;

        const response = await axios.get(url);

        const dataset = response?.data?.["Time Series FX (Daily)"];

        if(!dataset) return;

        const times = Object.keys(dataset);

        if(times.length < 25) return;

        const prices = times.slice(0,30).map(t =>
            parseFloat(dataset[t]["4. close"])
        ).filter(x=>!isNaN(x));

        if(prices.length < 12) return;

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0)/prices.length;

        const momentum = current - prices[3];

        const volatility =
        Math.max(...prices) - Math.min(...prices);

        let signal = null;

        if(current > sma && momentum > volatility*0.015)
            signal = "BUY 📈";

        if(current < sma && momentum < -volatility*0.015)
            signal = "SELL 📉";

        if(!signal) return;

        const hash =
        `${pair.from}-${pair.to}-${signal}`;

        if(hash === lastSignalHash) return;

        lastSignalHash = hash;

        const score =
        calculateScore(current,sma,momentum,volatility);

        if(score < 65) return;

        const tp =
        signal.includes("BUY")
        ? current + volatility*0.4
        : current - volatility*0.4;

        const sl =
        signal.includes("BUY")
        ? current - volatility*0.2
        : current + volatility*0.2;

        const message =
`🔥 ASH SIGNAL BOT V4 GOD MODE 🔥

Pair: ${pair.from}/${pair.to}

Signal: ${signal}
Confidence Score: ${score.toFixed(1)}%

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

Ultra Filtering Engine Active 🤖
`;

        await bot.sendMessage(CHAT_ID,message);

    }catch(err){
        console.log("Engine Error:",err.message);
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

        res.send("🔥 Ash Signal Bot V4 GOD MODE Running");

    }catch(err){
        res.send("Bot Active");
    }

});

// =============================
// Server Listener
// =============================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("Ash Signal Bot V4 GOD MODE Live");
});
