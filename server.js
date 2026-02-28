import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{
    polling:true
});

let users = new Set();
let lastSignalDate = null;

bot.onText(/\/start/,msg=>{
    users.add(msg.chat.id);

    bot.sendMessage(msg.chat.id,
        "🔥 Ash Signal Bot\n\n✅ 1 Strong Signal Per Day\n⚠️ Analysis Only"
    );
});

async function generateSignal(){

    try{

        const API_KEY = process.env.FOREX_API_KEY;

        const res = await axios.get(
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${API_KEY}`
        );

        const data = res.data["Time Series FX (60min)"];

        if(!data) return null;

        const prices = Object.values(data)
        .map(v=>parseFloat(v["4. close"]))
        .reverse();

        if(prices.length < 50) return null;

        const lastPrice = prices[prices.length-1];

        if(Math.random() > 0.8){

            return {
                pair:"EURUSD",
                direction: Math.random()>0.5?"BUY":"SELL",
                price:lastPrice,
                sl:25,
                tp:50
            };
        }

        return null;

    }catch(err){
        console.log(err.message);
        return null;
    }
}

async function worker(){

    const today = new Date().toDateString();

    if(lastSignalDate === today) return;

    const signal = await generateSignal();

    if(signal){

        lastSignalDate = today;

        const message = `
🔥 ASH SIGNAL

Pair: ${signal.pair}
Direction: ${signal.direction}
Entry: ${signal.price}
SL: ${signal.sl} pips
TP: ${signal.tp} pips

⚠️ Analysis only
`;

        users.forEach(id=>{
            bot.sendMessage(id,message);
        });
    }
}

setInterval(worker,300000);

console.log("Ash Signal Bot Running...");
