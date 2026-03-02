import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
app.use(express.json());

// =============================
// Bot Setup
// =============================

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{
    polling:true
});

// Channels
const FREE_CHANNEL = "@Freeashsignalchanel";

// =============================
// Market Session Control
// =============================

function isNewYorkSession(){

    let hour = new Date().getUTCHours();

    // New York market active approx 13:00 – 21:00 UTC
    return hour >= 13 && hour <= 21;
}

// =============================
// Indicator Brain
// =============================

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

function signalBrain(prices){

    let rsi = calculateRSI(prices);

    let last = prices[prices.length-1];

    let ma50 =
    prices.slice(-50).reduce((a,b)=>a+b,0)/50;

    let ma200 =
    prices.slice(-200).reduce((a,b)=>a+b,0)/200;

    let trendScore = 0;

    if(last > ma50 && ma50 > ma200) trendScore = 40;
    if(last < ma50 && ma50 < ma200) trendScore = 40;

    let rsiScore = 0;

    if(rsi > 40 && rsi < 65) rsiScore = 40;

    return trendScore + rsiScore;
}

// =============================
// Signal Generator
// =============================

async function generateSignal(){

    try{

        if(!isNewYorkSession()) return null;

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

        if(score < 80) return null;

        let last = prices[prices.length-1];

        let ma50 =
        prices.slice(-50).reduce((a,b)=>a+b,0)/50;

        return {
            direction: last > ma50 ? "BUY 📈" : "SELL 📉",
            price:last,
            score
        };

    }catch(err){
        console.log(err.message);
        return null;
    }
}

// =============================
// Channel Sender
// =============================

async function sendSignal(message){

    try{
        await bot.sendMessage(FREE_CHANNEL,message);
    }catch(err){
        console.log(err.message);
    }
}

// =============================
// Commands
// =============================

bot.onText(/\/start/,async(msg)=>{

    await bot.sendMessage(msg.chat.id,
`
🔥 AshBot V10 Global Research

🌍 New York session intelligence
📊 Rare high quality signals

Type /signal
`);
});

bot.onText(/\/signal/,async(msg)=>{

    const signal = await generateSignal();

    if(!signal){
        bot.sendMessage(msg.chat.id,
        "⏳ No strong global research setup.");
        return;
    }

    const message =
`
🏛 ASHBOT V10 GLOBAL SIGNAL

Direction: ${signal.direction}
Entry: ${signal.price}

Confidence Score: ${signal.score}%

⚠ Research signal only.
Risk 1%.
`;

    await sendSignal(message);
});

// =============================
// Worker Engine
// =============================

setInterval(async()=>{

    const signal = await generateSignal();

    if(!signal) return;

    const message =
`
🔥 ASHBOT AUTO GLOBAL SIGNAL

Direction: ${signal.direction}
Entry: ${signal.price}

Confidence Score: ${signal.score}%

⚠ Community research signal.
`;

    await sendSignal(message);

},300000);

// =============================

const PORT = process.env.PORT || 3000;

app.get("/",(req,res)=>{
    res.send("🔥 AshBot V10 Global Running");
});

app.listen(PORT,()=>{
    console.log("AshBot V10 Live");
});
