import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
app.use(express.json());

// ============================
// Bot Setup
// ============================

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{
    polling:true
});

// Channels
const FREE_CHANNEL = "@Freeashsignalchanel";
const PREMIUM_CHANNEL = "@YourPremiumChannel";

// ============================
// Advanced Brain Engine
// ============================

function calculateRSI(prices, period = 14){

    if(prices.length < period+1) return 50;

    let gains = 0;
    let losses = 0;

    for(let i=prices.length-period;i<prices.length;i++){

        let change = prices[i]-prices[i-1];

        if(change > 0) gains += change;
        else losses -= change;
    }

    let rs = (gains/period)/((losses/period)||1);

    return 100 - (100/(1+rs));
}

function volatilityScore(prices){

    let max = Math.max(...prices);
    let min = Math.min(...prices);

    let volatility = (max-min)/prices[prices.length-1];

    if(volatility < 0.01) return 40;
    if(volatility < 0.02) return 60;

    return 30;
}

function trendScore(prices){

    let last = prices[prices.length-1];

    let ma50 =
    prices.slice(-50).reduce((a,b)=>a+b,0)/50;

    let ma200 =
    prices.slice(-200).reduce((a,b)=>a+b,0)/200;

    let score = 0;

    if(last > ma50 && ma50 > ma200) score += 35;
    if(last < ma50 && ma50 < ma200) score += 35;

    return score;
}

function signalBrain(prices){

    let rsi = calculateRSI(prices);

    let score =
    volatilityScore(prices)
    + trendScore(prices);

    if(rsi > 65 || rsi < 35) score -= 20;

    return Math.min(100,score);
}

// ============================
// Signal Generator
// ============================

async function generateSignal(){

    try{

        const apiKey = process.env.FOREX_API_KEY;

        const res = await axios.get(
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${apiKey}`
        );

        const data = res.data["Time Series FX (60min)"];
        if(!data) return null;

        const prices =
        Object.values(data)
        .map(v=>parseFloat(v["4. close"]))
        .reverse();

        if(prices.length < 150) return null;

        let score = signalBrain(prices);

        if(score < 75) return null;

        let last = prices[prices.length-1];

        let ma50 =
        prices.slice(-50).reduce((a,b)=>a+b,0)/50;

        let direction =
        last > ma50 ? "BUY 📈" : "SELL 📉";

        return {
            direction,
            price:last,
            score
        };

    }catch(err){
        console.log(err.message);
        return null;
    }
}

// ============================
// Channel Sender
// ============================

async function sendSignal(message){

    try{

        await bot.sendMessage(FREE_CHANNEL,message);

    }catch(err){
        console.log("Send error:",err.message);
    }
}

// ============================
// Commands
// ============================

bot.onText(/\/start/,async(msg)=>{

    await bot.sendMessage(msg.chat.id,
`
🔥 AshBot V9 Elite Research

✅ Rare high quality setups
📊 Reputation safe philosophy

Type /signal
`);
});

bot.onText(/\/signal/,async(msg)=>{

    const signal = await generateSignal();

    if(!signal){
        bot.sendMessage(msg.chat.id,
        "⏳ No strong research setup.");
        return;
    }

    const message =
`
🏛 ASHBOT V9 ELITE SIGNAL

Direction: ${signal.direction}
Entry: ${signal.price}

Confidence Score: ${signal.score}%

⚠ Research signal only.
Risk 1%.
`;

    await sendSignal(message);
});

// ============================
// Worker Engine
// ============================

let lastWorkerDate = null;

async function signalWorker(){

    let today = new Date().toDateString();

    if(lastWorkerDate === today) return;

    const signal = await generateSignal();

    if(!signal) return;

    lastWorkerDate = today;

    const message =
`
🔥 ASHBOT AUTO ELITE SIGNAL

Direction: ${signal.direction}
Entry: ${signal.price}

Confidence Score: ${signal.score}%

⚠ Community research signal.
`;

    await sendSignal(message);
}

setInterval(signalWorker,300000);

// ============================

const PORT = process.env.PORT || 3000;

app.get("/",(req,res)=>{
    res.send("🔥 AshBot V9 Elite Running");
});

app.listen(PORT,()=>{
    console.log("AshBot V9 Live");
});
