require("dotenv").config();

const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT;

const API_KEY = process.env.ALPHA_KEY;
const CHAT_ID = process.env.CHAT_ID;
const TOKEN = process.env.TG_TOKEN;

const bot = new TelegramBot(TOKEN);

// ==============================
// Memory Protection
// ==============================

let lastSignalKey = "";
let dailySignalCount = 0;

const MAX_SIGNAL_PER_DAY = 2;

// ==============================
// Market Universe
// ==============================

const PAIR = {
    from:"EUR",
    to:"USD"
};

// ==============================
// RSI GOLD FILTER LOGIC
// ==============================

function calculateProbability(current,sma,momentum,volatility,rsi){

    let score = 50;

    if(current > sma) score += 15;
    if(momentum > 0) score += 10;

    if(volatility > current*0.001)
        score += 10;

    if(rsi < 30 || rsi > 70)
        score += 15;

    return score;
}

// ==============================
// Market Scanner
// ==============================

async function scanMarket(){

    try{

        if(dailySignalCount >= MAX_SIGNAL_PER_DAY)
            return;

        // Request Forex Daily Data
        const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${PAIR.from}&to_symbol=${PAIR.to}&apikey=${API_KEY}`;

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

        const momentum = current - prices[5];

        const volatility =
        Math.max(...prices) - Math.min(...prices);

        // ⭐ RSI Approximation (Since API may not provide RSI directly)
        const rsi =
        50 + (momentum / (volatility+0.0001)) * 30;

        let signal = null;

        if(
            current > sma &&
            momentum > volatility*0.04 &&
            rsi < 35
        ){
            signal = "BUY 📈";
        }

        if(
            current < sma &&
            momentum < -volatility*0.04 &&
            rsi > 65
        ){
            signal = "SELL 📉";
        }

        if(!signal) return;

        const signalKey =
        `${PAIR.from}-${PAIR.to}-${signal}`;

        if(signalKey === lastSignalKey)
            return;

        const probability =
        calculateProbability(current,sma,momentum,volatility,rsi);

        if(probability < 85) return;

        const tp =
        signal.includes("BUY")
        ? current + volatility*0.5
        : current - volatility*0.5;

        const sl =
        signal.includes("BUY")
        ? current - volatility*0.25
        : current + volatility*0.25;

        const message =
`🔥 ASH BOT RSI GOLD ELITE 🔥

Pair: EUR/USD

Signal: ${signal}
RSI Level: ${rsi.toFixed(2)}
Probability Score: ${probability.toFixed(1)}%

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

Gold Filtering Active ⭐
`;

        await bot.sendMessage(CHAT_ID,message);

        lastSignalKey = signalKey;
        dailySignalCount++;

    }catch(err){
        console.log(err.message);
    }
}

// ==============================
// Render Endpoint
// ==============================

app.get("/", async (req,res)=>{
    await scanMarket();
    res.send("🔥 Ash Bot RSI Gold Elite Running");
});

// ==============================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("Ash Bot Gold Live");
});
