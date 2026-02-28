import TelegramBot from "node-telegram-bot-api";
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
        "🔥 Ash Signal Bot\n\n✅ 1 Strong Signal Per Day\n📊 EUR/USD H1 Analysis\n⚠️ Signals are guidance only."
    );
});

function generateSignal(){

    if(Math.random() > 0.8){

        return {
            direction: Math.random()>0.5?"BUY":"SELL",
            price:"Market Price",
            sl:25,
            tp:50
        };
    }

    return null;
}

function worker(){

    let today = new Date().toDateString();

    if(lastSignalDate === today) return;

    let signal = generateSignal();

    if(signal){

        lastSignalDate = today;

        let message = `
🔥 ASH SIGNAL

Pair: EURUSD
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

console.log("Ash Signal Bot Running");
