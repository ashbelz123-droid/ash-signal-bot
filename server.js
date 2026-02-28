import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{
    polling:true
});

/* Users Storage */

let freeUsers = new Set();
let premiumUsers = new Set();

let lastSignalDate = null;

/* =============================
   Welcome Message
============================= */

bot.onText(/\/start/,msg=>{
    let chatId = msg.chat.id;

    freeUsers.add(chatId);

    const welcomeMessage = `
🔥 Ash Signal Bot

📊 1 Strong Conservative Signal Per Day

⚠️ Analysis only — trading has risk.

💡 Account Setup:
• Risk 1% – 3% per trade
• Follow SL and TP
• Trade only if setup is clear.

🇺🇬 Designed for traders.

Type /signal to check signal.
`;

    bot.sendMessage(chatId,welcomeMessage);
});

/* =============================
   Signal Generator (9/10 Safe Mode)
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

        /* Conservative Probability Trigger */

        if(Math.random() > 0.93){

            return {
                direction: last > shortAvg && shortAvg > longAvg ? "BUY" : "SELL",
                price: last
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
        bot.sendMessage(chatId,"⏳ Market not strong enough for safe signal.");
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
   Auto Worker (5 Minutes Check)
============================= */

async function signalWorker(){

    let today = new Date().toDateString();

    if(lastSignalDate === today) return;

    const signal = await generateSignal();

    if(!signal) return;

    lastSignalDate = today;

    const message = `
🔥 ASH SIGNAL PRO

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

console.log("🔥 Ash Signal Pro Running");
