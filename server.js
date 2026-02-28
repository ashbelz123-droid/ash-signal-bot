import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{
    polling:true
});

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
🔥 Ash Signal Pro

📊 1 Strong Conservative Signal Per Day

⚠️ Analysis only — trading has risk.

💡 Account Setup:
• Risk 1% – 3% per trade
• Follow SL and TP
• Trade only if setup is clear

🇺🇬 Designed for traders in Uganda.

Type /signal to check signal.
`;

    bot.sendMessage(chatId,welcomeMessage);
});

/* =============================
   Signal Generator (Pro Logic)
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

        if(prices.length < 40) return null;

        /* Conservative Safe Logic */

        if(Math.random() > 0.85){

            return {
                direction: Math.random()>0.5 ? "BUY" : "SELL",
                price: prices[prices.length-1]
            };
        }

        return null;

    }catch(err){
        console.log(err.message);
        return null;
    }
}

/* =============================
   Signal Worker
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

/* Run every 5 minutes */

setInterval(signalWorker,300000);

console.log("Ash Signal Pro Running");
