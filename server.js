require("dotenv").config();

const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT || 10000;

const API_KEY = process.env.ALPHA_KEY;
const TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Telegram Bot
const bot = new TelegramBot(TOKEN,{
    polling:true
});

// =============================
// Config
// =============================

const PAIR = { from:"EUR", to:"USD" };

let signalToday = 0;
const MAX_SIGNAL_PER_DAY = 1;

// =============================
// Warning Message (Business Style)
// =============================

function warningMessage(){

return `
⚠ AshBot Research Signal Service

✅ Free Community Signal
💡 Premium Service Coming Later

Trading contains risk.
Use proper money management.

Type /help for commands.
`;

}

// =============================
// Premium Signal Template
// =============================

function premiumTemplate(signal, entryLow, entryHigh, tp, sl, confidence){

return `
🏛 ASHBOT INSTITUTIONAL RESEARCH

Bias: ${signal}

Entry Zone:
${entryLow} — ${entryHigh}

Take Profit:
${tp.toFixed(5)}

Stop Loss:
${sl.toFixed(5)}

Confidence: ${confidence}%

⚠ Research signal only.
No profit guarantee.
`;
}

// =============================
// Utility
// =============================

function avg(arr){
    return arr.reduce((a,b)=>a+b,0)/arr.length;
}

function volatility(arr){
    return Math.max(...arr)-Math.min(...arr);
}

// =============================
// Commands
// =============================

bot.onText(/\/start/, async(msg)=>{

    await bot.sendMessage(
        msg.chat.id,
        warningMessage()
    );

});

bot.onText(/\/help/, async(msg)=>{

    await bot.sendMessage(
        msg.chat.id,
`
Commands:

/start
/help

AshBot Free Community Signal Service.
`
    );

});

// =============================
// Market Scanner (1 Signal Per Day)
// =============================

async function scanMarket(){

    if(signalToday >= MAX_SIGNAL_PER_DAY) return;

    try{

        const url =
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${PAIR.from}&to_symbol=${PAIR.to}&interval=60min&apikey=${API_KEY}`;

        const response = await axios.get(url);

        const data =
        response?.data?.["Time Series FX (60min)"];

        if(!data) return;

        const times = Object.keys(data);

        if(times.length < 80) return;

        const prices =
        times.slice(0,100)
        .map(t=>parseFloat(data[t]["4. close"]))
        .filter(x=>!isNaN(x));

        if(prices.length < 50) return;

        const current = prices[0];

        const sma = avg(prices);

        const momentum = current - prices[10];

        const vol = volatility(prices);

        if(vol < 0.002 || vol > 0.02) return;

        let signal = null;

        if(current > sma && momentum > vol*0.07)
            signal = "BUY 📈";

        if(current < sma && momentum < -vol*0.07)
            signal = "SELL 📉";

        if(!signal) return;

        const tp =
        signal === "BUY"
        ? Math.max(...prices.slice(0,30))
        : Math.min(...prices.slice(0,30));

        const sl =
        signal === "BUY"
        ? current - vol*0.4
        : current + vol*0.4;

        const entryLow = (current - vol*0.05).toFixed(5);
        const entryHigh = (current + vol*0.05).toFixed(5);

        const confidence =
        Math.min(
            100,
            Math.abs(momentum)/(vol*0.1)*100
        ).toFixed(0);

        const message =
        premiumTemplate(
            signal,
            entryLow,
            entryHigh,
            tp,
            sl,
            confidence
        );

        await bot.sendMessage(CHAT_ID,message);

        signalToday++;

    }catch(err){
        console.log("Scan Error:",err.message);
    }
}

// =============================
// Auto Scanner (1 Hour)
// =============================

setInterval(()=>{
    scanMarket();
}, 60 * 60 * 1000);

// =============================

app.get("/",(req,res)=>{
    res.send("🔥 AshBot Community Server Running");
});

app.listen(PORT,"0.0.0.0",()=>{
    console.log("AshBot Live");
});
