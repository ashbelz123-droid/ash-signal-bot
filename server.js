import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{
    polling:true
});

bot.onText(/\/start/,msg=>{
    bot.sendMessage(msg.chat.id,
        "🔥 Ash Signal Bot\n\n✅ 1 Strong Signal Per Day\n⚠️ Analysis only"
    );
});

console.log("Ash Signal Bot Running...");
