require("dotenv").config();

const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT;
const API_KEY = process.env.ALPHA_KEY;
const TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TOKEN);

// ==============================
// Safety Warning
// ==============================

const WARNING_MESSAGE =
`⚠ ASH BOT RISK NOTICE

Forex trading contains risk.

Signals are research filtered.

No profit guarantee.

Type /help for guide.
`;

// ==============================
// Memory Lock System
// ==============================

let signalToday = 0;
let lastSignalKey = "";

const MAX_SIGNAL_PER_DAY = 1;

// ==============================
// Market Pair
// ==============================

const PAIR = {
    from:"EUR",
    to:"USD"
};

// ==============================
// Institutional Research Model
// ==============================

function researchScore(current,sma,momentum,volatility,rsi){

    let score = 65;

    if(current > sma) score += 15;
    if(momentum > 0) score += 10;

    if(Math.abs(momentum) > volatility*0.08)
        score += 10;

    if(rsi < 30 || rsi > 70)
        score += 10;

    return score;
}

// ==============================
// Market Scanner Engine
// ==============================

async function scanMarket(){

    try{

        if(signalToday >= MAX_SIGNAL_PER_DAY)
            return;

        const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${PAIR.from}&to_symbol=${PAIR.to}&apikey=${API_KEY}`;

        const response = await axios.get(url);

        const dataset =
        response?.data?.["Time Series FX (Daily)"];

        if(!dataset) return;

        const times = Object.keys(dataset);

        if(times.length < 100) return;

        const prices = times.slice(0,120).map(t =>
            parseFloat(dataset[t]["4. close"])
        ).filter(x=>!isNaN(x));

        if(prices.length < 60) return;

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0)/prices.length;

        const momentum = current - prices[15];

        const volatility =
        Math.max(...prices) - Math.min(...prices);

        const rsi =
        50 + (momentum/(volatility+0.0001))*30;

        let signal = null;

        if(
            current > sma &&
            momentum > volatility*0.08 &&
            rsi < 30
        ){
            signal = "BUY 📈";
        }

        if(
            current < sma &&
            momentum < -volatility*0.08 &&
            rsi > 70
        ){
            signal = "SELL 📉";
        }

        if(!signal) return;

        const probability =
        researchScore(current,sma,momentum,volatility,rsi);

        if(probability < 95) return;

        const tp =
        signal.includes("BUY")
        ? current + volatility*0.9
        : current - volatility*0.9;

        const sl =
        signal.includes("BUY")
        ? current - volatility*0.45
        : current + volatility*0.45;

        const message =
`🔥 ASH BOT FINAL LEGENDARY 🔥

Pair: EUR/USD
Signal: ${signal}

Research Confidence: ${probability.toFixed(1)}%

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

⭐ Ultra Rare Signal Mode Active
`;

        await bot.sendMessage(CHAT_ID,message);

        lastSignalKey = `${PAIR.from}-${PAIR.to}-${signal}`;
        signalToday++;

    }catch(err){
        console.log(err.message);
    }
}

// ==============================
// Telegram Commands
// ==============================

bot.onText(/\/start/, (msg)=>{
    bot.sendMessage(msg.chat.id, WARNING_MESSAGE);
});

bot.onText(/\/help/, (msg)=>{
    bot.sendMessage(msg.chat.id,
`ASH BOT GUIDE

✔ Ultra strict filtering
✔ Expect 0–1 signal/day
✔ Risk management required
`);
});

// ==============================
// Server Endpoint
// ==============================

app.get("/", async (req,res)=>{
    await scanMarket();
    res.send("🔥 Ash Bot Final Legendary Running");
});

// ==============================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("Ash Bot Final Live");
});
