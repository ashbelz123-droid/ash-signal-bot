const express = require("express");
const app = express();

// Render provides port automatically
const PORT = process.env.PORT;

// Route (Required)
app.get("/", (req, res) => {
    res.send("🔥 Ash Signal Bot Running");
});

// Bind server to Render network
app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
});
