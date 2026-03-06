import pandas as pd
import ta

def calculate_indicators(df):
    # Trend
    df["ema50"] = ta.trend.ema_indicator(df["close"], window=50)
    df["ema200"] = ta.trend.ema_indicator(df["close"], window=200)
    
    # Momentum
    df["rsi"] = ta.momentum.rsi(df["close"], window=14)
    
    # Bollinger Bands
    bb = ta.volatility.BollingerBands(df["close"])
    df["bb_low"] = bb.bollinger_lband()
    df["bb_high"] = bb.bollinger_hband()
    
    return df

def generate_signal(df):
    last = df.iloc[-1]
    
    # Buy condition
    if last["ema50"] > last["ema200"] and last["rsi"] < 35 and last["close"] <= last["bb_low"]:
        return "buy"
    
    # Sell condition
    if last["ema50"] < last["ema200"] and last["rsi"] > 65 and last["close"] >= last["bb_high"]:
        return "sell"
    
    return "hold"
