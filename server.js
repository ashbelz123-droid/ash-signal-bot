import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('error', (err) => console.error('Bot error:', err));

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🌟 ASH SIGNAL PREMIUM");
});

// Add your signal logic here
