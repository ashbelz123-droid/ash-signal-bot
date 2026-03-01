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

// =============================
// Safety Warning Message
// =============================

const WARNING_MESSAGE =
`⚠️ ASH SIGNAL BOT WARNING ⚠️

This bot provides research forex signals.

Risk exists in trading.
No profit is guaranteed.

Use risk management.

Type /help for guide.
`;

// =============================
// Memory Protection
// =============================

let lastSignalKey = "";
let signalToday = 0;
const MAX_SIGNAL_PER_DAY = 1;

// =============================
// Market Pair
// =============================

const PAIR = {
    from:"EUR",
    to:"USD"
};

// =============================
// Probability Engine
// =============================

function probabilityEngine(current,sma,momentum,volatility,rsi){

    let score = 60;

    if(current > sma) score += 15;
    if(momentum > 0) score += 10;

    if(Math.abs(momentum) > volatility*0.06)
        score += 10;

    if(rsi < 30 || rsi > 70)
        score += 10;

    return score;
}

// =============================
// Market Scanner
// =============================

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

        if(times.length < 60) return;

        const prices = times.slice(0,80).map(t =>
            parseFloat(dataset[t]["4. close"])
        ).filter(x=>!isNaN(x));

        if(prices.length < 40) return;

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0)/prices.length;

        const momentum = current - prices[10];

        const volatility =
        Math.max(...prices) - Math.min(...prices);

        const rsi =
        50 + (momentum/(volatility+0.0001))*30;

        let signal = null;

        if(
            current > sma &&
            momentum > volatility*0.06 &&
            rsi < 30
        ){
            signal = "BUY 📈";
        }

        if(
            current < sma &&
            momentum < -volatility*0.06 &&
            rsi > 70
        ){
            signal = "SELL 📉";
        }

        if(!signal) return;

        const probability =
        probabilityEngine(current,sma,momentum,volatility,rsi);

        if(probability < 92) return;

        const tp =
        signal.includes("BUY")
        ? current + volatility*0.7
        : current - volatility*0.7;

        const sl =
        signal.includes("BUY")
        ? current - volatility*0.35
        : current + volatility*0.35;

        const message =
`🔥 ASH SIGNAL BOT 🔥

Pair: EUR/USD
Signal: ${signal}

Confidence: ${probability.toFixed(1)}%

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

⚠ Risk Warning Active
`;

        await bot.sendMessage(CHAT_ID,message);

    }catch(err){
        console.log(err.message);
    }
}

// =============================
// Telegram Commands
// =============================

bot.onText(/\/start/, (msg)=>{

    bot.sendMessage(msg.chat.id, WARNING_MESSAGE);

});

bot.onText(/\/help/, (msg)=>{

    bot.sendMessage(msg.chat.id,
`Commands:

/start - Safety warning
/help - Guide

Signals are sent automatically.
`);
});

// =============================
// Render Wake Endpoint
// =============================

app.get("/", async (req,res)=>{
    await scanMarket();
    res.send("🔥 Ash Signal Bot Running");
});

// =============================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("Ash Bot Live");
});
