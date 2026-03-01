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

// ============================
// Signal Protection System
// ============================

let lastSignalKey = "";
let dailySignalCount = 0;

const MAX_DAILY_SIGNAL = 5;

// ============================
// Trading Universe
// ============================

const PAIRS = [
    { from:"EUR", to:"USD" },
    { from:"GBP", to:"USD" }
];

// ============================
// Confidence Calculator
// ============================

function confidenceScore(current,sma,momentum,volatility){

    let score = 50;

    if(current > sma) score += 15;
    if(momentum > 0) score += 15;

    if(Math.abs(momentum) > volatility*0.03)
        score += 15;

    return score;
}

// ============================
// Signal Engine
// ============================

async function analyzePair(pair){

    try{

        if(dailySignalCount >= MAX_DAILY_SIGNAL)
            return;

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

        if(
            current > sma &&
            momentum > volatility*0.03
        ){
            signal = "BUY 📈";
        }

        if(
            current < sma &&
            momentum < -volatility*0.03
        ){
            signal = "SELL 📉";
        }

        if(!signal) return;

        const signalKey =
        `${pair.from}-${pair.to}-${signal}`;

        if(signalKey === lastSignalKey) return;

        const confidence =
        confidenceScore(current,sma,momentum,volatility);

        if(confidence < 75) return;

        const tp =
        signal.includes("BUY")
        ? current + volatility*0.4
        : current - volatility*0.4;

        const sl =
        signal.includes("BUY")
        ? current - volatility*0.2
        : current + volatility*0.2;

        const message =
`🔥 ASH SIGNAL BOT V7 SOLID MODE 🔥

Pair: ${pair.from}/${pair.to}

Signal: ${signal}
Confidence: ${confidence.toFixed(1)}%

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

Solid Filtering Active ⭐
`;

        await bot.sendMessage(CHAT_ID,message);

        lastSignalKey = signalKey;
        dailySignalCount++;

    }catch(err){
        console.log(err.message);
    }
}

// ============================
// Render Endpoint
// ============================

app.get("/", async (req,res)=>{

    try{

        for(const pair of PAIRS){
            await analyzePair(pair);
        }

        res.send("🔥 Ash Signal Bot V7 Solid Running");

    }catch(err){
        res.send("Bot Active");
    }

});

// ============================
// Server Listener
// ============================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("Ash Signal Bot V7 Live");
});
