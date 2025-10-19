// server.js
const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000; // Render.com nutzt process.env.PORT
const AUTH_TOKEN = "2MQQF2cLAqx0oDFfas"; // muss gleich sein wie in Roblox Script

const app = express();
app.use(bodyParser.json());

// WebSocket Server für Website-Clients
const wss = new WebSocket.Server({ noServer: true });

// Upgrade HTTP zu WS
const server = app.listen(PORT, () => console.log(`HTTP listening on port ${PORT}`));
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws) => {
  console.log("Website connected via WebSocket");
});

// Broadcast-Funktion
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}

// Roblox POST Endpoint
app.post("/api/camupdate", (req, res) => {
  const auth = req.header("Authorization") || "";
  if (!auth.startsWith("Bearer ") || auth.split(" ")[1] !== AUTH_TOKEN) {
    return res.status(401).send({ error: "Unauthorized" });
  }

  const payload = req.body; // { time:..., cams:[{id, cframe:{position:{x,y,z}, look:{x,y,z}, up:{x,y,z}}}] }
  console.log("Received cams:", payload);

  // Broadcast an alle WS-Clients (Website)
  broadcast({ type: "camUpdate", payload });

  res.status(200).send({ status: "ok" });
});

// Root Route
app.get("/", (req, res) => {
  res.send("Roblox Cam Server is running!");
});
