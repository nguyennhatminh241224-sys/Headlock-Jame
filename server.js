const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = "./keys-db.json";

app.use(cors());
app.use(express.json());

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ keys: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

app.get("/", (req, res) => {
  res.send("HEADLOCK KEY SERVER IS RUNNING");
});

app.post("/check-key", (req, res) => {
  const { key, deviceId } = req.body;

  if (!key || !deviceId) {
    return res.json({ success: false, message: "Thiếu key hoặc mã thiết bị." });
  }

  const db = readDB();
  const keyData = db.keys[key];

  if (!keyData) {
    return res.json({ success: false, message: "Key không hợp lệ." });
  }

  if (new Date() > new Date(keyData.expiresAt)) {
    return res.json({ success: false, message: "Key đã hết hạn." });
  }

  if (!Array.isArray(keyData.devices)) {
    keyData.devices = [];
  }

  if (!keyData.devices.includes(deviceId)) {
    if (keyData.devices.length >= keyData.slots) {
      return res.json({
        success: false,
        message: `Key đã đạt giới hạn ${keyData.slots} thiết bị.`
      });
    }

    keyData.devices.push(deviceId);
    saveDB(db);
  }

  res.json({
    success: true,
    expiresAt: keyData.expiresAt,
    slotUsed: keyData.devices.length,
    slotMax: keyData.slots
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
