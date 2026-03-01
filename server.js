const express = require("express");
const app = express();

const PORT = process.env.PORT;

// Health check route (Required for Render)
app.get("/", (req, res) => {
    res.send("🔥 Ash Signal Bot Running");
});

// Bind server to Render network
app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
});
