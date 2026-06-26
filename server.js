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
  const { key, deviceId, deviceName } = req.body;

  if (!key || !deviceId) {
    return res.json({
      success: false,
      message: "Thiếu key hoặc mã thiết bị."
    });
  }

  const db = readDB();
  const keyData = db.keys[key];

  if (!keyData) {
    return res.json({
      success: false,
      message: "Key không hợp lệ."
    });
  }

  if (keyData.revoked === true) {
    return res.json({
      success: false,
      message: "Key đã bị thu hồi."
    });
  }

  const maxDevices = Number(keyData.maxDevices || keyData.slots || 1);

  if (!Array.isArray(keyData.devices)) {
    keyData.devices = [];
  }

  const expiresAt = keyData.expiresAt || null;

  if (expiresAt && new Date() > new Date(expiresAt)) {
    return res.json({
      success: false,
      message: "Key đã hết hạn."
    });
  }

  const oldDevice = keyData.devices.find((d) => {
    if (typeof d === "string") return d === deviceId;
    return d.id === deviceId;
  });

  if (!oldDevice) {
    if (keyData.devices.length >= maxDevices) {
      return res.json({
        success: false,
        message: `Key đã đạt giới hạn ${maxDevices} thiết bị.`
      });
    }

    keyData.devices.push({
      id: deviceId,
      name: deviceName || "Android Device",
      firstUsedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString()
    });

    saveDB(db);
  } else if (typeof oldDevice === "object") {
    oldDevice.lastUsedAt = new Date().toISOString();
    oldDevice.name = deviceName || oldDevice.name || "Android Device";
    saveDB(db);
  }

  return res.json({
    success: true,
    message: "Kích hoạt thành công",
    expiresAt: expiresAt,
    slotUsed: keyData.devices.length,
    slotMax: maxDevices,
    type: keyData.type || "custom"
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
