import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/* =============================
   Bot Setup
============================= */

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{
    polling:true
});

/* =============================
   User Storage
============================= */

let freeUsers = new Set();
let premiumUsers = new Set();

let lastSignalDate = null;

/* =============================
   RSI Calculation
============================= */

function calculateRSI(prices, period = 14){

    let gains = 0;
    let losses = 0;

    for(let i = prices.length - period; i < prices.length - 1; i++){

        let diff = prices[i+1] - prices[i];

        if(diff > 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    if(avgLoss === 0) return 100;

    let rs = avgGain / avgLoss;

    return 100 - (100 / (1 + rs));
}

/* =============================
   Volatility Filter
============================= */

function volatilityFilter(prices){

    let changes = [];

    for(let i=1;i<prices.length;i++){
        changes.push(Math.abs(prices[i]-prices[i-1]));
    }

    let avgVolatility = changes.reduce((a,b)=>a+b,0)/changes.length;

    return avgVolatility > 0.0003;
}

/* =============================
   Welcome Message
============================= */

bot.onText(/\/start/,msg=>{

    let chatId = msg.chat.id;

    freeUsers.add(chatId);

    const welcomeMessage = `
🌟 ASH SIGNAL PREMIUM

📊 Conservative Market Analysis

🔥 1 Strong Setup Per Day
⚠️ Analysis only.

Risk Management:
✔ Risk 1% – 3%
✔ Follow SL & TP

🇺🇬 Designed for traders.

Type /signal to check market.
`;

    bot.sendMessage(chatId,welcomeMessage);
});

/* =============================
   Signal Generator V3
============================= */

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

        if(prices.length < 60) return null;

        let last = prices[prices.length-1];

        let shortAvg = prices.slice(-20).reduce((a,b)=>a+b,0)/20;
        let longAvg = prices.slice(-50).reduce((a,b)=>a+b,0)/50;

        let rsi = calculateRSI(prices);

        if(!volatilityFilter(prices)){
            return null;
        }

        // BUY Signal
        if(
            last > shortAvg &&
            shortAvg > longAvg &&
            rsi > 50 &&
            rsi < 65
        ){
            return {
                direction:"BUY",
                price:last
            };
        }

        // SELL Signal
        if(
            last < shortAvg &&
            shortAvg < longAvg &&
            rsi < 50 &&
            rsi > 35
        ){
            return {
                direction:"SELL",
                price:last
            };
        }

        return null;

    }catch(err){
        console.log(err.message);
        return null;
    }
}

/* =============================
   Signal Command
============================= */

bot.onText(/\/signal/, async msg=>{

    let chatId = msg.chat.id;

    const signal = await generateSignal();

    if(!signal){
        bot.sendMessage(chatId,"⏳ No strong conservative setup.");
        return;
    }

    const message = `
🔥 ASH SIGNAL PRO

Pair: EURUSD
Direction: ${signal.direction}
Entry: ${signal.price}

SL: 25 pips
TP: 50 pips

⚠️ Analysis only.
`;

    bot.sendMessage(chatId,message);
});

/* =============================
   Auto Worker
============================= */

async function signalWorker(){

    let today = new Date().toDateString();

    if(lastSignalDate === today) return;

    const signal = await generateSignal();
    if(!signal) return;

    lastSignalDate = today;

    const message = `
🔥 ASH SIGNAL PRO AUTO

Pair: EURUSD
Direction: ${signal.direction}
Entry: ${signal.price}

SL: 25 pips
TP: 50 pips

⚠️ Analysis only.
`;

    [...freeUsers,...premiumUsers].forEach(id=>{
        bot.sendMessage(id,message);
    });
}

setInterval(signalWorker,300000);

console.log("🔥 Ash Signal Version 3 Running");
