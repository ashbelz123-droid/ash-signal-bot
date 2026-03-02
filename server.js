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
// Indicator Brain Engine
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

function volatilityFilter(prices){

    let max = Math.max(...prices);
    let min = Math.min(...prices);

    return (max-min) < (prices[prices.length-1]*0.02);
}

function signalScore(prices){

    let last = prices[prices.length-1];

    let ma50 =
    prices.slice(-50).reduce((a,b)=>a+b,0)/50;

    let ma200 =
    prices.slice(-200).reduce((a,b)=>a+b,0)/200;

    let rsi = calculateRSI(prices);

    let trendScore = 0;
    let momentumScore = 0;
    let healthScore = 0;

    if(last > ma50 && ma50 > ma200) trendScore = 30;
    if(last < ma50 && ma50 < ma200) trendScore = 30;

    if(rsi > 40 && rsi < 65) momentumScore = 30;

    if(volatilityFilter(prices)) healthScore = 40;

    return trendScore + momentumScore + healthScore;
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

        let score = signalScore(prices);

        if(score < 70) return null;

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
        console.log("Signal Error:",err.message);
        return null;
    }
}

// ============================
// Channel Sender
// ============================

async function sendSignal(message,isPremium=false){

    try{

        await bot.sendMessage(FREE_CHANNEL,message);

        if(isPremium){
            await bot.sendMessage(PREMIUM_CHANNEL,message);
        }

    }catch(err){
        console.log("Channel send error:",err.message);
    }
}

// ============================
// Commands
// ============================

bot.onText(/\/start/,async(msg)=>{

    const welcome =
`
🔥 AshBot V8 Research Engine

✅ Conservative signal philosophy
📊 Rare high quality setups

Type /signal
`;

    await bot.sendMessage(msg.chat.id,welcome);
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
🏛 ASHBOT V8 RESEARCH PREVIEW

Direction: ${signal.direction}
Entry: ${signal.price}

Confidence Score: ${signal.score}%

⚠ Research signal only.
Risk 1% recommended.
`;

    await sendSignal(message,false);
});

// ============================
// Worker Engine (Rare Signal Philosophy)
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
🔥 ASHBOT AUTO SIGNAL

Direction: ${signal.direction}
Entry: ${signal.price}

Confidence Score: ${signal.score}%

⚠ Community research signal.
`;

    await sendSignal(message,false);
}

setInterval(signalWorker,300000);

// ============================

const PORT = process.env.PORT || 3000;

app.get("/",(req,res)=>{
    res.send("🔥 AshBot V8 Live");
});

app.listen(PORT,()=>{
    console.log("AshBot V8 Running");
});
