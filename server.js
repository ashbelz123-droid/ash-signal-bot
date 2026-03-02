import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
app.use(express.json());

// ==============================
// Bot Setup
// ==============================

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{
    polling:true
});

// ==============================
// Channels
// ==============================

const FREE_CHANNEL = "@Freeashsignalchanel";
const PREMIUM_CHANNEL = "@YourPremiumChannel";

// ==============================
// User Storage (Memory Only)
// ==============================

let freeUsers = new Set();
let premiumUsers = new Set();

let lastSignalDate = null;

// ==============================
// Conservative Indicator Engine
// ==============================

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

function volatilityFilter(prices){

    let max = Math.max(...prices);
    let min = Math.min(...prices);

    return (max-min) < (prices[prices.length-1]*0.02);
}

// ==============================
// Signal Generator
// ==============================

async function generateSignal(){

    try{

        const apiKey = process.env.FOREX_API_KEY;

        const res = await axios.get(
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${apiKey}`
        );

        const data = res.data["Time Series FX (60min)"];
        if(!data) return null;

        const prices = Object.values(data)
        .map(v=>parseFloat(v["4. close"]))
        .reverse();

        if(prices.length < 150) return null;

        const rsi = calculateRSI(prices);

        if(rsi > 70 || rsi < 30) return null;
        if(!volatilityFilter(prices)) return null;

        let last = prices[prices.length-1];
        let ma50 = prices.slice(-50).reduce((a,b)=>a+b,0)/50;
        let ma200 = prices.slice(-200).reduce((a,b)=>a+b,0)/200;

        if(last > ma50 && ma50 > ma200 && rsi > 50 && rsi < 65){
            return {direction:"BUY", price:last};
        }

        if(last < ma50 && ma50 < ma200 && rsi < 50 && rsi > 35){
            return {direction:"SELL", price:last};
        }

        return null;

    }catch(err){
        console.log("Signal Error:",err.message);
        return null;
    }
}

// ==============================
// Channel Sender
// ==============================

async function sendSignal(message, isPremium=false){

    try{

        await bot.sendMessage(FREE_CHANNEL,message);

        if(isPremium){
            await bot.sendMessage(PREMIUM_CHANNEL,message);
        }

    }catch(err){
        console.log("Channel send error:",err.message);
    }
}

// ==============================
// Commands
// ==============================

bot.onText(/\/start/, async(msg)=>{

    const chatId = msg.chat.id;

    freeUsers.add(chatId);

    const welcome =
`
🔥 AshBot Research Community

✅ Free signal preview
💡 Premium preview coming later

Type /signal to check market.
`;

    await bot.sendMessage(chatId,welcome);
});

// ==============================
// Signal Worker (1 Signal / Day)
// ==============================

async function signalWorker(){

    let today = new Date().toDateString();

    if(lastSignalDate === today) return;

    const signal = await generateSignal();
    if(!signal) return;

    lastSignalDate = today;

    const risk = 1;
    const tp = 0.0005;
    const sl = 0.00025;

    const message =
`
🏛 ASHBOT RESEARCH PREVIEW

Pair: EURUSD
Direction: ${signal.direction}
Entry: ${signal.price}

TP: ${signal.price + tp}
SL: ${signal.price - sl}

Risk: ${risk}% per trade

⚠ Research signal only.
`;

    await sendSignal(message,false);
}

// ==============================

setInterval(()=>{
    signalWorker();
}, 5*60*1000);

// ==============================

const PORT = process.env.PORT || 3000;

app.get("/",(req,res)=>{
    res.send("🔥 AshBot Community Running");
});

app.listen(PORT,()=>{
    console.log("AshBot Live");
});
