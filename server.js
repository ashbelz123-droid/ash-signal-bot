import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
dotenv.config();

const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
bot.startPolling();

let freeUsers = new Set();
let premiumUsers = new Set();
let lastSignalDate = null;

function calculateRSI(prices, period = 14){ }
function volatilityFilter(prices){ }
function marketStabilityScore(prices){ }
function calculateADX(prices, period = 14) { }
function getSupport(prices) { }
function getResistance(prices) { }
function checkCandlePattern(prices) { }

bot.onText(/\/start/, msg => {
  let chatId = msg.chat.id;
  if (freeUsers.has(chatId)) {
    bot.sendMessage(chatId, "👋 You’re already registered. Type /signal for market data.");
    return;
  }
  freeUsers.add(chatId);
  const welcome
