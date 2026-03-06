from flask import Flask, request
import ccxt
import threading, time
import pandas as pd
from config import *
from strategy import calculate_indicators, generate_signal
from risk_manager import calculate_position_size, check_max_trades
from telegram_alerts import send_telegram_message
import os

app = Flask(__name__)
exchange = ccxt.binance({"apiKey": API_KEY, "secret": API_SECRET})
today_trades = 0

# Heartbeat thread
def heartbeat():
    while True:
        print("Heartbeat: bot alive")
        time.sleep(300)

threading.Thread(target=heartbeat).start()

# Fetch OHLCV data
def fetch_data(pair):
    bars = exchange.fetch_ohlcv(pair, timeframe='1m', limit=200)
    df = pd.DataFrame(bars, columns=["time","open","high","low","close","volume"])
    return df

# Webhook endpoint
@app.route("/webhook", methods=["POST"])
def webhook():
    global today_trades
    data = request.json
    key = data.get("key")

    if key != WEBHOOK_KEY:
        return "Unauthorized", 403

    pair = data.get("pair")
    action = data.get("action")

    if pair not in PAIRS:
        return "Pair not allowed", 400

    if not check_max_trades(today_trades, MAX_TRADES_PER_DAY):
        return "Max trades reached today", 200

    df = fetch_data(pair)
    df = calculate_indicators(df)
    signal = generate_signal(df)

    if signal == action:
        balance = exchange.fetch_balance()['total']['USDT']
        size = calculate_position_size(balance, RISK_PER_TRADE, STOP_LOSS)

        if action == "buy":
            exchange.create_market_buy_order(pair, size)
        elif action == "sell":
            exchange.create_market_sell_order(pair, size)

        today_trades += 1
        send_telegram_message(f"Trade executed: {action} {pair} size {size}")
        return "Trade executed", 200

    return "No trade", 200

app.run(host="0.0.0.0", port=10000)
