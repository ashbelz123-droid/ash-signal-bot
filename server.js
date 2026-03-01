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

// ============================
// CONFIG
// ============================

const ACCOUNT_BALANCE = 1000; // change to yours
const RISK_PERCENT = 1; // 1% per trade
const MAX_DRAWDOWN_PERCENT = 5;

let equity = ACCOUNT_BALANCE;
let peakEquity = ACCOUNT_BALANCE;

let stats = {
    total: 0,
    wins: 0,
    losses: 0
};

let signalToday = 0;
const MAX_SIGNAL_PER_DAY = 1;

const PAIR = { from: "EUR", to: "USD" };

// ============================
// Utilities
// ============================

function avg(arr){
    return arr.reduce((a,b)=>a+b,0)/arr.length;
}

function vol(arr){
    return Math.max(...arr) - Math.min(...arr);
}

function riskReward(entry, sl, tp){
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    return reward / risk;
}

function sessionAllowed(){
    const hour = new Date().getUTCHours();
    return (hour >= 7 && hour <= 20);
}

function calculatePositionSize(entry, sl){
    const riskAmount = (ACCOUNT_BALANCE * RISK_PERCENT)/100;
    const stopDistance = Math.abs(entry - sl);
    return riskAmount / stopDistance;
}

function drawdownExceeded(){
    const dd = ((peakEquity - equity)/peakEquity)*100;
    return dd >= MAX_DRAWDOWN_PERCENT;
}

// ============================

async function fetchData(interval){
    const url =
    `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${PAIR.from}&to_symbol=${PAIR.to}&interval=${interval}&apikey=${API_KEY}`;

    const response = await axios.get(url);
    return response.data[`Time Series FX (${interval})`];
}

// ============================

async function scanMarket(){

    if(signalToday >= MAX_SIGNAL_PER_DAY) return;
    if(!sessionAllowed()) return;
    if(drawdownExceeded()) return;

    try{

        const data1H = await fetchData("60min");
        const data4H = await fetchData("240min");

        if(!data1H || !data4H) return;

        const prices1H = Object.keys(data1H).slice(0,120)
        .map(t=>parseFloat(data1H[t]["4. close"]));

        const prices4H = Object.keys(data4H).slice(0,120)
        .map(t=>parseFloat(data4H[t]["4. close"]));

        const current = prices1H[0];

        const sma4H = avg(prices4H);
        const bias4H = current > sma4H ? "BUY" : "SELL";

        const sma1H = avg(prices1H);
        const momentum = current - prices1H[10];
        const volatility = vol(prices1H);

        if(volatility < 0.002 || volatility > 0.02)
            return;

        let signal = null;

        if(bias4H === "BUY" && current > sma1H && momentum > volatility*0.07)
            signal = "BUY";

        if(bias4H === "SELL" && current < sma1H && momentum < -volatility*0.07)
            signal = "SELL";

        if(!signal) return;

        const tp =
        signal === "BUY"
        ? Math.max(...prices1H.slice(0,30))
        : Math.min(...prices1H.slice(0,30));

        const sl =
        signal === "BUY"
        ? current - volatility*0.4
        : current + volatility*0.4;

        const rr = riskReward(current, sl, tp);
        if(rr < 2) return;

        const lotSize = calculatePositionSize(current, sl);

        const confidence =
        Math.min(100,
        Math.abs(momentum)/(volatility*0.1)*100
        ).toFixed(0);

        const message =
`🏛 ASHBOT V5 QUANT ENGINE

Pair: EUR/USD
Signal: ${signal}
Confidence: ${confidence}%

Entry: ${current.toFixed(5)}
TP: ${tp.toFixed(5)}
SL: ${sl.toFixed(5)}

Risk: ${RISK_PERCENT}%
Lot Size: ${lotSize.toFixed(2)}
RR: 1:${rr.toFixed(2)}

Stats:
Trades: ${stats.total}
Wins: ${stats.wins}
Losses: ${stats.losses}
`;

        await bot.sendMessage(CHAT_ID,message);

        stats.total++;
        signalToday++;

    }catch(err){
        console.log(err.message);
    }
}

// ============================

app.get("/", async (req,res)=>{
    await scanMarket();
    res.send("AshBot V5 Quant Engine Running");
});

app.listen(PORT,"0.0.0.0");
