require("dotenv").config();
const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT;
const API_KEY = process.env.ALPHA_KEY;
const TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TOKEN);

let signalToday = 0;
const MAX_SIGNAL_PER_DAY = 1;

const PAIR = { from: "EUR", to: "USD" };

let stats = {
    totalTrades: 0,
    wins: 0,
    losses: 0,
    equity: 100,
    maxDrawdown: 0,
    peakEquity: 100
};

let openTrade = null;

// ============================
// Utilities
// ============================

function avg(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }
function vol(arr){ return Math.max(...arr)-Math.min(...arr); }

function saveStats(){
    fs.writeFileSync("stats.json", JSON.stringify(stats,null,2));
}

function updateDrawdown(){
    if(stats.equity > stats.peakEquity)
        stats.peakEquity = stats.equity;

    const dd =
    ((stats.peakEquity - stats.equity)/stats.peakEquity)*100;

    if(dd > stats.maxDrawdown)
        stats.maxDrawdown = dd;
}

function sessionAllowed(){
    const h = new Date().getUTCHours();
    return (h >= 7 && h <= 20);
}

// ============================
// Fetch Data
// ============================

async function fetchData(interval){
    const url =
    `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${PAIR.from}&to_symbol=${PAIR.to}&interval=${interval}&apikey=${API_KEY}`;
    const res = await axios.get(url);
    return res.data[`Time Series FX (${interval})`];
}

// ============================
// Monitor Open Trade
// ============================

async function monitorTrade(current){

    if(!openTrade) return;

    if(openTrade.type === "BUY"){

        if(current >= openTrade.tp){
            stats.wins++;
            stats.equity += 2;
            openTrade = null;
        }
        else if(current <= openTrade.sl){
            stats.losses++;
            stats.equity -= 1;
            openTrade = null;
        }

    } else {

        if(current <= openTrade.tp){
            stats.wins++;
            stats.equity += 2;
            openTrade = null;
        }
        else if(current >= openTrade.sl){
            stats.losses++;
            stats.equity -= 1;
            openTrade = null;
        }
    }

    if(!openTrade){
        stats.totalTrades++;
        updateDrawdown();
        saveStats();
    }
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

        const prices1H =
        Object.keys(data1H).slice(0,100)
        .map(t=>parseFloat(data1H[t]["4. close"]));

        const prices4H =
        Object.keys(data4H).slice(0,100)
        .map(t=>parseFloat(data4H[t]["4. close"]));

        if(prices1H.length < 50 || prices4H.length < 50)
            return;

        const current = prices1H[0];

        await monitorTrade(current);

        if(openTrade) return;

        const sma4H = avg(prices4H);
        const bias4H = current > sma4H ? "BUY" : "SELL";

        const sma1H = avg(prices1H);
        const momentum = current - prices1H[10];
        const volatility = vol(prices1H);

        let type = null;

        if(bias4H === "BUY" &&
           current > sma1H &&
           momentum > volatility*0.07)
            type = "BUY";

        if(bias4H === "SELL" &&
           current < sma1H &&
           momentum < -volatility*0.07)
            type = "SELL";

        if(!type) return;

        const tp =
        type === "BUY"
        ? Math.max(...prices1H.slice(0,20))
        : Math.min(...prices1H.slice(0,20));

        const sl =
        type === "BUY"
        ? current - volatility*0.4
        : current + volatility*0.4;

        openTrade = { type, entry: current, tp, sl };

        await bot.sendMessage(CHAT_ID,
`🏛 ASHBOT V4 QUANT MODE

Signal: ${type}
Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

Trades: ${stats.totalTrades}
Wins: ${stats.wins}
Losses: ${stats.losses}
Equity: ${stats.equity}
MaxDD: ${stats.maxDrawdown.toFixed(2)}%
`);

        signalToday++;

    }catch(err){
        console.log(err.message);
    }
}

app.get("/", async (req,res)=>{
    await scanMarket();
    res.send("AshBot V4 Quant Running");
});

app.listen(PORT,"0.0.0.0");
