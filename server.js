import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
dotenv.config();

const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Set webhook
bot.setWebHook(`https:                                                                            

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

let freeUsers = new Set();
let premiumUsers = new Set();
let lastSignalDate = null;

             
function calculateRSI(prices, period = 14){           }
function volatilityFilter(prices){           }
function marketStabilityScore(prices){           }
function calculateADX(prices, period = 14) {           }
function getSupport(prices) {           }
function getResistance(prices) {           }
function checkCandlePattern(prices) {           }

                  
bot.onText(/\/start/, msg => {
  let chatId = msg.chat.id;
  if (freeUsers.has(chatId)) {
    bot.sendMessage(chatId, "👋 You’re already registered. Type /signal for market data.");
    return;
  }
  freeUsers.add(chatId);
  const welcomeMessage = ` 🌟 ASH SIGNAL PREMIUM 📊 Conservative Market Analysis 🔥 1 Strong Setup Per Day ⚠️ Analysis only. Risk Management: ✔ Risk 1% – 3% ✔ Follow SL & TP 🇺🇬 Designed for traders. Type /signal to check market. `;
  bot.sendMessage(chatId, welcomeMessage);
});

                   
async function generateSignal(){
  try {
    const apiKey = process.env.FOREX_API_KEY;
    const res = await axios.get(`https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${apiKey}`);
    const data = res.data["Time Series FX (60min)"];
    if(!data) return null;
    const prices = Object.values(data).map(v=>parseFloat(v["4. close"])).reverse();
    if(prices.length < 200) return null;

    let adx = calculateADX(prices);
    if (adx < 30) return null;
    let support = getSupport(prices);
    let resistance = getResistance(prices);
    let pattern = checkCandlePattern(prices);
    if (!pattern) return null;

    let hour = new Date().getHours();
    if (hour < 8 || hour > 16) return null;

    let last = prices[prices.length-1];
    let ma50 = prices.slice(-50).reduce((a,b)=>a+b,0)/50;
    let ma200 = prices.slice(-200).reduce((a,b)=>a+b,0)/200;
    let rsi = calculateRSI(prices);

    if(!volatilityFilter(prices)) return null;
    if(!marketStabilityScore(prices)) return null;
    if (rsi > 70 || rsi < 30) return null;

    if( last > ma50 && ma50 > ma200 && rsi > 50 && rsi < 65 && pattern === 'bullish' ){
      return { direction:"BUY", price:last };
    }
    if( last < ma50 && ma50 < ma200 && rsi < 50 && rsi > 35 && pattern === 'bearish' ){
      return { direction:"SELL", price:last };
    }
    return null;
  } catch (err) {
    console.error('Signal gen error:', err);
    return null;
  }
}

bot.onText(/\/signal/, async msg => {
  try {
    const signal = await generateSignal();
    if(!signal){
      bot.sendMessage(msg.chat.id, "⏳ No strong conservative setup.");
      return;
    }
    const riskPercentage = 1;
    const stopLossPips = 25;
    const takeProfitPips = 50;
    const message = ` 🔥 ASH SIGNAL PRO Pair: EURUSD Direction: ${signal.direction} Entry: ${signal.price} SL: ${signal.price - (stopLossPips * 0.0001 * (signal.direction === 'BUY' ? 1 : -1))} TP: ${signal.price + (takeProfitPips * 0.0001 * (signal.direction === 'BUY' ? 1 : -1))} Risk: ${riskPercentage}% per trade ⚠️ Analysis only. `;
    bot.sendMessage(msg.chat.id, message);
  } catch (err) {
    console.error('Signal command error:', err);
  }
});

async function signalWorker(){
  let today = new Date().toDateString();
  if(lastSignalDate === today) return;
  const signal = await generateSignal();
  if(!signal) return;
  lastSignalDate = today;
  const riskPercentage = 1;
  const stopLossPips = 25;
  const takeProfitPips = 50;
  const message = ` 🔥 ASH SIGNAL AUTO Pair: EURUSD Direction: ${signal.direction} Entry: ${signal.price} SL: ${signal.price - (stopLossPips * 0.0001 * (signal.direction === 'BUY' ? 1 : -1))} TP: ${signal.price + (takeProfitPips * 0.0001 * (signal.direction === 'BUY' ? 1 : -1))} Risk: ${riskPercentage}% per trade ⚠️ Analysis only. `;
  [...freeUsers,...premiumUsers].forEach(id=>{
    bot.sendMessage(id,message);
  });
}
setInterval(signalWorker,300000);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🔥 Ash Signal V4 Running on port ${port}`));
  
