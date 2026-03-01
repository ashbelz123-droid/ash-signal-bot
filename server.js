const express = require("express");
const app = express();

const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.send("🔥 Ash Signal Bot Running");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
});
