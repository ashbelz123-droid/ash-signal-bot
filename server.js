require("dotenv").config();
const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.ALPHA_KEY;
const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN);

async function getForexData() {
    try {
        const response = await axios.get(
            `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=5min&apikey=${API_KEY}`
        );

        const data = response.data["Time Series FX (5min)"];
        const times = Object.keys(data).slice(0, 14);

        let prices = times.map(time => parseFloat(data[time]["4. close"]));

        const currentPrice = prices[0];
        const sma = prices.reduce((a, b) => a + b, 0) / prices.length;

        generateSignal(currentPrice, sma);

    } catch (error) {
        console.log("Error:", error.message);
    }
}

function generateSignal(current, sma) {
    let signal = "";
    let tp = "";
    let sl = "";

    if (current > sma) {
        signal = "BUY 📈";
        tp = (current + 0.0020).toFixed(5);
        sl = (current - 0.0010).toFixed(5);
    } else {
        signal = "SELL 📉";
        tp = (current - 0.0020).toFixed(5);
        sl = (current + 0.0010).toFixed(5);
    }

    const message = `
🔥 ASH SIGNAL BOT 🔥

Pair: EUR/USD
Signal: ${signal}

Entry: ${current}
Take Profit: ${tp}
Stop Loss: ${sl}

Trade with risk management ⚡
    `;

    bot.sendMessage(CHAT_ID, message);
}

app.get("/", async (req, res) => {
    await getForexData();
    res.send("🔥 Ash Signal Bot is running...");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
