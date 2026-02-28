import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{
    polling:true
});

// User storage
let freeUsers = new Set();
let premiumUsers = new Set();
let lastSignalDate = null;

// Start command
bot.onText(/\/start/,msg=>{
    let chatId = msg.chat.id;

    freeUsers.add(chatId);

    bot.sendMessage(chatId,
        "🔥 Welcome to Ash Signal Bot\n\n✅ You are now a free signal user\n📊 You will receive 1 strong signal per day\n⚠️ Analysis only."
    );
});

// Signal generator
function generateSignal(){

    if(Math.random() > 0.8){

        return {
            direction: Math.random()>0.5 ? "BUY" : "SELL"
        };
    }

    return null;
}

// Worker system
function signalWorker(){

    let today = new Date().toDateString();

    if(lastSignalDate === today) return;

    let signal = generateSignal();

    if(signal){

        lastSignalDate = today;

        let message = `
🔥 ASH SIGNAL

Pair: EURUSD
Direction: ${signal.direction}
Entry: Market Price
SL: 25 pips
TP: 50 pips

⚠️ Analysis only
`;

        freeUsers.forEach(id=>{
            bot.sendMessage(id,message);
        });

        premiumUsers.forEach(id=>{
            bot.sendMessage(id,message);
        });
    }
}

// Check every 5 minutes
setInterval(signalWorker,300000);

console.log("Ash Signal Bot Running");
