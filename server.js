import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

process.env.NTBA_FIX_350 = "1";

// ==============================
// Environment Check
// ==============================

if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("Missing Telegram Token");
    process.exit(1);
}

// ==============================
// Express Server
// ==============================

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ==============================
// Bot Setup (Webhook Mode)
// ==============================

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Webhook URL (Render Public URL REQUIRED)
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL;

if (WEBHOOK_URL) {
    bot.setWebHook(`${WEBHOOK_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);
}

// ==============================
// Channel
// ==============================

const CHANNEL = "@Freeashsignalchanel";

// ==============================
// Signal Scheduler (1 Hour Scan)
// ==============================

setInterval(() => {

    console.log("Community scan heartbeat");

}, 60 * 60 * 1000);

// ==============================
// Express Bot Endpoint (Webhook Receiver)
// ==============================

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {

    bot.processUpdate(req.body);

    res.sendStatus(200);
});

// ==============================
// Health Route
// ==============================

app.get("/", (req, res) => {
    res.send("🔥 AshBot Community Running Webhook Mode");
});

// ==============================

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
