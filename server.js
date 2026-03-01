const express = require("express");
const app = express();

// VERY IMPORTANT
const PORT = process.env.PORT || 10000;

// Simple route
app.get("/", (req, res) => {
    res.send("🔥 Ash Signal Bot is Live");
});

// Force bind to 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
});
