# Ultimate Crypto Bot Setup

1. Install Python 3.10+
2. Install dependencies:
   pip install -r requirements.txt
3. Set environment variables in Render or locally:
   - API_KEY, API_SECRET
   - WEBHOOK_KEY
   - TELEGRAM_TOKEN, TELEGRAM_CHAT_ID
4. Deploy bot.py as a Background Worker on Render
5. Setup UptimeRobot to ping:
   https://<your-render-app>.onrender.com/webhook every 5 min
6. Setup TradingView webhook alerts:
   {
     "key":"<WEBHOOK_KEY>",
     "pair":"BTC/USDT",
     "action":"buy"
   }
7. Run the bot → it will auto-execute trades, send Telegram alerts, and keep alive 24/7
