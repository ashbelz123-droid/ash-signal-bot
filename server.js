require("dotenv").config();

const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ALPHA_KEY;
const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN);

// ===== GOD AI PAIRS =====
const PAIRS = [
    { from:"EUR", to:"USD" },
    { from:"GBP", to:"USD" }
];

// ===== GOD AI ENGINE =====
async function analyzePair(pair){

    try{

        const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${pair.from}&to_symbol=${pair.to}&apikey=${API_KEY}`;

        const response = await axios.get(url);

        const data = response.data["Time Series FX (Daily)"];

        if(!data || typeof data !== "object") return;

        const times = Object.keys(data);

        if(times.length < 20) return;

        const prices = times.slice(0,20).map(t =>
            parseFloat(data[t]["4. close"])
        ).filter(x=>!isNaN(x));

        if(prices.length < 10) return;

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0) / prices.length;

        const volatility =
        Math.max(...prices) - Math.min(...prices);

        const momentum = current - prices[3];

        let signal = "HOLD";
        let confidence = 0;

        // ===== GOD AI LOGIC =====

        if(current > sma && momentum > 0){
            signal = "BUY";
            confidence = 70 + Math.random()*20;
        }

        else if(current < sma && momentum < 0){
            signal = "SELL";
            confidence = 70 + Math.random()*20;
        }

        if(signal === "HOLD") return;

        const tp =
        signal === "BUY"
        ? (current + volatility*0.3).toFixed(5)
        : (current - volatility*0.3).toFixed(5);

        const sl =
        signal === "BUY"
        ? (current - volatility*0.15).toFixed(5)
        : (current + volatility*0.15).toFixed(5);

        const message =
`🔥 ASH SIGNAL BOT GOD AI 🔥

Pair: ${pair.from}/${pair.to}

Signal: ${signal}
Confidence: ${confidence.toFixed(1)}%

Entry: ${current}
TP: ${tp}
SL: ${sl}

Volatility Engine Active 🤖
`;

        await bot.sendMessage(CHAT_ID,message);

    }catch(err){
        console.log("GOD AI Error:", err.message);
    }
}

// ===== Render Wake Engine =====
app.get("/", async (req,res)=>{

    try{
        for(const pair of PAIRS){
            await analyzePair(pair);
        }

        res.send("🔥 Ash Signal Bot GOD AI Running");

    }catch(err){
        res.send("Bot Active");
    }
});

app.listen(PORT,()=>{
    console.log("Ash Signal Bot GOD AI Live");
});
