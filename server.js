async function analyzePair(pair) {

    try {

        const url =
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${pair.from}&to_symbol=${pair.to}&interval=5min&apikey=${API_KEY}`;

        const response = await axios.get(url);

        if(!response.data) return;

        const data = response.data["Time Series FX (5min)"];

        // ⭐ SAFE CHECK (Fix your error)
        if (!data || typeof data !== "object") {
            console.log("Market data empty");
            return;
        }

        const times = Object.keys(data);

        if(times.length < 10){
            console.log("Not enough price history");
            return;
        }

        const prices = times.slice(0,30).map(t =>
            parseFloat(data[t]["4. close"])
        );

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0) / prices.length;

        const momentum = current - prices[5];

        let signal = "HOLD 🤝";

        if(current > sma && momentum > 0.0001)
            signal = "BUY 📈";

        else if(current < sma && momentum < -0.0001)
            signal = "SELL 📉";

        if(signal !== "HOLD 🤝"){

            const tp =
            signal === "BUY 📈"
            ? (current + 0.0025).toFixed(5)
            : (current - 0.0025).toFixed(5);

            const sl =
            signal === "BUY 📈"
            ? (current - 0.0012).toFixed(5)
            : (current + 0.0012).toFixed(5);

            const message = `
🔥 ASH SIGNAL BOT PRO AI 🔥

Pair: ${pair.from}/${pair.to}
Signal: ${signal}

Entry: ${current}
TP: ${tp}
SL: ${sl}
`;

            await bot.sendMessage(CHAT_ID, message);
        }

    } catch(err){
        console.log("Error:", err.message);
    }
}
