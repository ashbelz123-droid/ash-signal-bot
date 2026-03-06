import os

# Binance API
API_KEY = os.getenv("API_KEY")
API_SECRET = os.getenv("API_SECRET")

# Webhook security key
WEBHOOK_KEY = os.getenv("WEBHOOK_KEY")

# Telegram bot
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# Trading settings
PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"]
MAX_TRADES_PER_DAY = 50
RISK_PER_TRADE = 0.01  # 1%
STOP_LOSS = 0.02       # 2%
TAKE_PROFIT = 0.03     # 3%
