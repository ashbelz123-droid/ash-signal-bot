require("dotenv").config();

const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT;

const API_KEY = process.env.ALPHA_KEY;
const TELEGRAM_TOKEN = process.env.TG_TOKEN;

const bot = new TelegramBot(TELEGRAM_TOKEN);

// ===============================
// Admin Control
// ===============================

const ADMIN_CHAT_ID = process.env.CHAT_ID;

// Whitelist Users Database (Memory Storage)
let whitelistUsers = [];

// ===============================
// User Management
// ===============================

function addUser(userId){
    if(!whitelistUsers.includes(userId)){
        whitelistUsers.push(userId);
    }
}

function removeUser(userId){
    whitelistUsers =
    whitelistUsers.filter(id => id !== userId);
}

// ===============================
// Signal Send Protection
// ===============================

async function sendSignal(userId,message){

    if(!whitelistUsers.includes(userId))
        return;

    await bot.sendMessage(userId,message);
}

// ===============================
// Signal Scanner Engine
// ===============================

async function scanMarket(){

    try{

        const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&apikey=${API_KEY}`;

        const response = await axios.get(url);

        const dataset =
        response?.data?.["Time Series FX (Daily)"];

        if(!dataset) return;

        const prices = Object.keys(dataset)
        .slice(0,40)
        .map(t=>parseFloat(dataset[t]["4. close"]))
        .filter(x=>!isNaN(x));

        if(prices.length < 20) return;

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0)/prices.length;

        let signal = null;

        if(current > sma)
            signal = "BUY 📈";

        if(current < sma)
            signal = "SELL 📉";

        if(!signal) return;

        const message =
`🔥 ASH SIGNAL BOT V11 PRO 🔥

Signal: ${signal}
Entry: ${current.toFixed(5)}

Professional Filter Mode ⭐
`;

        for(const user of whitelistUsers){
            await sendSignal(user,message);
        }

    }catch(err){
        console.log(err.message);
    }
}

// ===============================
// Telegram Command Control
// ===============================

bot.onText(/\/add (\d+)/,(msg,match)=>{

    const chatId = msg.chat.id;

    if(chatId.toString() !== ADMIN_CHAT_ID) return;

    const userId = parseInt(match[1]);

    addUser(userId);

    bot.sendMessage(chatId,"User Added ✅");
});

bot.onText(/\/remove (\d+)/,(msg,match)=>{

    const chatId = msg.chat.id;

    if(chatId.toString() !== ADMIN_CHAT_ID) return;

    const userId = parseInt(match[1]);

    removeUser(userId);

    bot.sendMessage(chatId,"User Removed ❌");
});

// ===============================
// Wake Endpoint (Render)
// ===============================

app.get("/", async (req,res)=>{

    await scanMarket();

    res.send("🔥 Ash Signal Bot V11 Pro Running");

});

// ===============================
// Server Listener
// ===============================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("Ash Signal Bot V11 Live");
});
