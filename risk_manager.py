def calculate_position_size(balance, risk_per_trade, stop_loss):
    return (balance * risk_per_trade) / stop_loss

def check_max_trades(today_trades, max_trades):
    return today_trades < max_trades
