async function analyzePair(pair){

    try{

        if(!API_KEY) return;

        const url =
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${pair.from}&to_symbol=${pair.to}&interval=5min&apikey=${API_KEY}`;

        const response = await axios.get(url);

        if(!response || !response.data){
            console.log("Empty API response");
            return;
        }

        const data = response.data["Time Series FX (5min)"];

        if(!data){
            console.log("No market dataset");
            return;
        }

        const times = Object.keys(data || {});

        if(times.length < 10){
            console.log("Insufficient market history");
            return;
        }

        const prices = times.slice(0,15).map(t =>
            parseFloat(data[t]["4. close"])
        ).filter(x => !isNaN(x));

        if(prices.length < 5){
            console.log("Price array too small");
            return;
        }

        const current = prices[0];

        const sma =
        prices.reduce((a,b)=>a+b,0) / prices.length;

        const momentum = current - prices[4];

        let signal = "HOLD 🤝";

        if(current > sma && momentum > 0.0001)
            signal = "BUY 📈";

        else if(current < sma && momentum < -0.0001)
            signal = "SELL 📉";

        if(signal === "HOLD 🤝") return;

        const tp =
        signal === "BUY 📈"
        ? (current + 0.0020).toFixed(5)
        : (current - 0.0020).toFixed(5);

        const sl =
        signal === "BUY 📈"
        ? (current - 0.0010).toFixed(5)
        : (current + 0.0010).toFixed(5);

        const message =
`🔥 ASH SIGNAL BOT PRO AI 🔥

Pair: ${pair.from}/${pair.to}
Signal: ${signal}

Entry: ${current}
TP: ${tp}
SL: ${sl}
`;

        await bot.sendMessage(CHAT_ID, message);

    }catch(err){
        console.log("Scanner Safe Error:", err.message);
    }
}
