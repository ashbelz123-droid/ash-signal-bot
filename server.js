import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/* ============================= Bot Setup ============================= */
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

/* ============================= User Storage ============================= */
let freeUsers = new Set();
let premiumUsers = new Set();
let lastSignalDate = null;

/* ============================= Indicators ============================= */
function calculateRSI(prices, period = 14){
  let gains = 0; let losses = 0;
  for(let i = prices.length - period; i < prices.length - 1; i++){
    let diff = prices[i+1] - prices[i];
    if(diff > 0) gains += diff;
    else losses -= diff;
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
  return avgVol < 0.0005;
}

function calculateADX(prices, period = 14) {
  let tr = [], dmPlus = [], dmMinus = [];
  for (let i = 1; i < prices.length; i++) {
    let prevClose = prices[i-1];
    let high = Math.max(prices[i], prevClose);
    let low = Math.min(prices[i], prevClose);
    tr.push(high - low);
    dmPlus.push(Math.max(0, prices[i] - prevClose));
    dmMinus.push(Math.max(0, prevClose - prices[i]));
  }
  let trSum = tr.slice(-period).reduce((a,b) => a+b, 0);
  let pSum = dmPlus.slice(-period).reduce((a,b) => a+b, 0);
  let mSum = dmMinus.slice(-period).reduce((a,b) => a+b, 0);
  let pDI = (pSum / trSum) * 100;
  let mDI = (mSum / trSum) * 100;
  let dx = Math.abs(pDI - mDI) / (pDI + mDI) * 100;
  return dx;
}

function getSupport(prices) {
  return Math.min(...prices.slice(-10));
}

function getResistance(prices) {
  return Math.max(...prices.slice(-10));
}

function checkCandlePattern(prices) {
  let last = prices[prices.length-1];
  let prev = prices[prices.length-2];
  if (last > prev && last > (prev + (prev * 0.001))) return 'bullish';
  if (last < prev && last < (prev - (prev * 0.001))) return 'bearish';
  return null;
}

/* ============================= Welcome Message ============================= */
bot.onText(/\/start/, msg => {
  let chatId = msg.chat.id;
  freeUsers.add(chatId);
  const welcomeMessage = ` 🌟 ASH SIGNAL PREMIUM 📊
Conservative Market Analysis 🔥
1 Strong Setup Per Day ⚠️
Analysis only. Risk Management:
✔ Risk 1% – 3%
✔ Follow SL & TP
🇺🇬 Designed for traders.
Type /signal to check market. `;
  bot.sendMessage(chatId,welcomeMessage);
});

/* ============================= Signal Generator V4 ============================= */
async function generateSignal(){
  const apiKey = process.env.FOREX_API_KEY;
  const res = await axios.get(
    `https:                                                                                                               
  );
  const data = res.data["Time Series FX (60min)"];
  if(!data) return null;
  const prices = Object.values(data)
    .map(v=>parseFloat(v["4. close"]))
    .reverse();
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
}

                                                                                
bot.onText(/\/signal/, async msg => {
  let chatId = msg.chat.id;
  const signal = await generateSignal();
  if(!signal){
    bot.sendMessage(chatId,"⏳ No strong conservative setup.");
    return;
  }
  const riskPercentage = 1;           
  const stopLossPips = 25;
  const takeProfitPips = 50;
  const message = `//www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=60min&apikey=${apiKey}`
  );
  const data = res.data["Time Series FX (60min)"];
  if(!data) return null;
  const prices = Object.values(data)
    .map(v=>parseFloat(v["4. close"]))
    .reverse();
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

  // BUY Signal
  if( last > ma50 && ma50 > ma200 && rsi > 50 && rsi < 65 && pattern === 'bullish' ){
    return { direction:"BUY", price:last };
  }
  // SELL Signal
  if( last < ma50 && ma50 < ma200 && rsi < 50 && rsi > 35 && pattern === 'bearish' ){
    return { direction:"SELL", price:last };
  }
  return null;
}

/* ============================= Signal Command ============================= */
bot.onText(/\/signal/, async msg => {
  let chatId = msg.chat.id;
  const signal = await generateSignal();
  if(!signal){
    bot.sendMessage(chatId,"⏳ No strong conservative setup.");
    return;
  }
  const riskPercentage = 1; // 1% risk
  const stopLossPips = 25;
  const takeProfitPips = 50;
  const message = ` 🔥 ASH SIGNAL PRO
Pair: EURUSD
Direction: ${signal.direction}
Entry: ${signal.price}
SL: ${signal.price - (stopLossPips * 0.0001 * (signal.direction === 'BUY' ? 1 : -1))}
TP: ${signal.price + (takeProfitPips * 0.0001 * (signal.direction === 'BUY' ? 1 : -1))}
Risk: ${riskPercentage}% per trade
⚠️ Analysis only. `;
  bot.sendMessage(chatId,message);
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
  const message = `/* ============================= Auto Worker ============================= */
async function signalWorker(){
  let today = new Date().toDateString();
  if(lastSignalDate === today) return;
  const signal = await generateSignal();
  if(!signal) return;
  lastSignalDate = today;
  const riskPercentage = 1; // 1% risk
  const stopLossPips = 25;
  const takeProfitPips = 50;
  const message = ` 🔥 ASH SIGNAL AUTO
Pair: EURUSD
Direction: ${signal.direction}
Entry: ${signal.price}
SL: ${signal.price - (stopLossPips * 0.0001 * (signal.direction === 'BUY' ? 1 : -1))}
TP: ${signal.price + (takeProfitPips * 0.0001 * (signal.direction === 'BUY' ? 1 : -1))}
Risk: ${riskPercentage}% per trade
⚠️ Analysis only. `;
  [...freeUsers,...premiumUsers].forEach(id=>{
    bot.sendMessage(id,message);
  });
}
setInterval(signalWorker,300000);
console.log("🔥 Ash Signal Version 4 Running");
