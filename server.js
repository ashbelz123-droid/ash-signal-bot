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

// Forex pairs monitored
const PAIRS = [
    { from: "EUR", to: "USD" },
    { from: "GBP", to: "USD" }
];

// Market scanner
async function scanMarket(pair) {
    try {
        const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${pair.from}&to_symbol=${pair.to}&interval=5min&apikey=${API_KEY}`;

        const response = await axios.get(url);

        const data = response.data["Time Series FX (5min)"];
        if (!data) return;

        const times = Object.keys(data).slice(0, 20);

        let prices = times.map(t =>
            parseFloat(data[t]["4. close"])
        );

        const current = prices[0];

        const sma =
            prices.reduce((a, b) => a + b, 0) / prices.length;

        const momentum = current - prices[5];

        generateSignal(pair, current, sma, momentum);

    } catch (err) {
        console.log("API Error:", err.message);
    }
}

// Signal logic
function generateSignal(pair, price, sma, momentum) {

    let signal = "HOLD 🤝";
    let tp = "";
    let sl = "";

    if (price > sma && momentum > 0) {
        signal = "BUY 📈";

        tp = (price + 0.0020).toFixed(5);
        sl = (price - 0.0010).toFixed(5);
    }

    else if (price < sma && momentum < 0) {
        signal = "SELL 📉";

        tp = (price - 0.0020).toFixed(5);
        sl = (price + 0.0010).toFixed(5);
    }

    if (signal !== "HOLD 🤝") {

        const message = `
🔥 ASH SIGNAL BOT 🔥

Pair: ${pair.from}/${pair.to}
Signal: ${signal}

Entry: ${price}
Take Profit: ${tp}
Stop Loss: ${sl}

AI Trading Assistant Mode 🤖
`;

        bot.sendMessage(CHAT_ID, message);
    }
}

// Bot scheduler (5 minutes safe free API interval)
function runBot() {
    PAIRS.forEach(scanMarket);
}

setInterval(runBot, 300000);

app.get("/", (req, res) => {
    res.send("🔥 Ash Signal Bot Running");
});

app.listen(PORT, () => {
    console.log("Ash Signal Bot Active");
});
