import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

let freeUsers = new Set();
let premiumUsers = new Set();
let lastSignalDate = null;

// Indicators (unchanged)
function calculateRSI(prices, period = 14){
  let gains = 0; let losses = 0;
  for(let i = prices.length - period; i < prices.length - 1; i++){
    let diff = prices[i+1] - prices[i];
    if(diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  if(avgLoss === 0) return 100;
  let rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function volatilityFilter(prices){
  let changes = [];
  for(let i=1;i<prices.length;i++){
    changes.push(Math.abs(prices[i]-prices[i-1]));
  }
  let avgVolatility = changes.reduce((a,b)=>a+b,0)/changes.length;
  return avgVolatility > 0.0003;
}

function marketStabilityScore(prices){
  let volatility = 0;
  for(let i=1;i<prices.length;i++){
    volatility += Math.abs(prices[i]-prices[i-1]);
  }
  let avgVol = volatility / prices.length;
  return avgVol
