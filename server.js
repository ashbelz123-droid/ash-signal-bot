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

let signalToday = 0;
const MAX_SIGNAL_PER_DAY = 1;

const PAIR = { from: "EUR", to: "USD" };

// ============================
// Utility Functions
// ============================

function avg(arr){
    return arr.reduce((a,b)=>a+b,0)/arr.length;
}

function vol(arr){
    return Math.max(...arr) - Math.min(...arr);
}

function riskRewardValid(entry, sl, tp){
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    return (reward / risk) >= 2;
}

function sessionAllowed(){
    const hour = new Date().getUTCHours();
    // London 7–15 UTC
    // New York 12–20 UTC
    return (hour >= 7 && hour <= 20);
}

// ============================
// Fetch Data
// ============================

async function fetchData(interval){

    const url =
    `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${PAIR.from}&to_symbol=${PAIR.to}&interval=${interval}&apikey=${API_KEY}`;

    const response = await axios.get(url);

    return response.data[`Time Series FX (${interval})`];
}

// ============================
// Main Scanner
// ============================

async function scanMarket(){

    if(signalToday >= MAX_SIGNAL_PER_DAY) return;
    if(!sessionAllowed()) return;

    try{

        const data1H = await fetchData("60min");
        const data4H = await fetchData("240min");

        if(!data1H || !data4H) return;

        const prices1H = Object.keys(data1H).slice(0,120)
        .map(t=>parseFloat(data1H[t]["4. close"]));

        const prices4H = Object.keys(data4H).slice(0,120)
        .map(t=>parseFloat(data4H[t]["4. close"]));

        if(prices1H.length < 50 || prices4H.length < 50)
            return;

        const current = prices1H[0];

        // 4H Bias
        const sma4H = avg(prices4H);
        const bias4H = current > sma4H ? "BUY" : "SELL";

        // 1H Structure
        const sma1H = avg(prices1H);
        const momentum = current - prices1H[10];
        const volatility = vol(prices1H);

        let signal = null;

        if(bias4H === "BUY" &&
           current > sma1H &&
           momentum > volatility*0.07){

            signal = "BUY 📈";
        }

        if(bias4H === "SELL" &&
           current < sma1H &&
           momentum < -volatility*0.07){

            signal = "SELL 📉";
        }

        if(!signal) return;

        const tp =
        signal.includes("BUY")
        ? Math.max(...prices1H.slice(0,30))
        : Math.min(...prices1H.slice(0,30));

        const sl =
        signal.includes("BUY")
        ? current - volatility*0.4
        : current + volatility*0.4;

        if(!riskRewardValid(current, sl, tp))
            return;

        const message =
`🏛 ASHBOT V3 INSTITUTIONAL

Pair: EUR/USD
4H Bias: ${bias4H}
Session: Active

Signal: ${signal}

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

RR ≥ 1:2
`;

        await bot.sendMessage(CHAT_ID,message);

        signalToday++;

    }catch(err){
        console.log(err.message);
    }
}

// ============================

bot.onText(/\/start/, (msg)=>{
    bot.sendMessage(msg.chat.id,
`⚠ Trading Risk Notice

This bot is a research assistant.
No profit guarantee.
Use proper risk management.
`);
});

app.get("/", async (req,res)=>{
    await scanMarket();
    res.send("AshBot V3 Institutional Running");
});

app.listen(PORT,"0.0.0.0");
