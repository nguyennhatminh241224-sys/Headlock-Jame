const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = "./keys-db.json";

app.use(cors());
app.use(express.json());

const DEFAULT_SETTINGS = {
  freeKeyUrl: "https://link4m.net/lnZEeK4t",
  contactUrl: "https://zalo.me/0333635135",

  maintenanceMode: false,
  maintenanceTitle: "APP ĐANG NÂNG CẤP",
  maintenanceMessage: "Phiên bản mới đang được cập nhật.<br>Vui lòng quay lại sau.",

  appLatestVersionCode: 1.1,
  appMinVersionCode: 1.1,
  forceUpdate: true,
  updateUrl: "https://boostylink.com/8f947rKf",
  updateTitle: "CẦN CẬP NHẬT APP",
  updateMessage: "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục sử dụng."
};

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          settings: DEFAULT_SETTINGS,
          keys: {}
        },
        null,
        2
      )
    );
  }

  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));

    db.settings = {
      ...DEFAULT_SETTINGS,
      ...(db.settings || {})
    };

    if (!db.keys) {
      db.keys = {};
    }

    return db;
  } catch (error) {
    return {
      settings: DEFAULT_SETTINGS,
      keys: {}
    };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function isExpired(keyData) {
  if (!keyData.expiresAt) {
    return false;
  }

  return new Date() > new Date(keyData.expiresAt);
}

function getMaxDevices(keyData) {
  return Number(keyData.maxDevices || keyData.slots || 1);
}

function normalizeDevices(keyData) {
  if (!Array.isArray(keyData.devices)) {
    keyData.devices = [];
  }

  keyData.devices = keyData.devices
    .map((device) => {
      if (typeof device === "string") {
        return {
          id: device,
          name: "Android Device",
          firstUsedAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString()
        };
      }

      return {
        id: device.id,
        name: device.name || "Android Device",
        firstUsedAt:
          device.firstUsedAt ||
          device.createdAt ||
          new Date().toISOString(),
        lastUsedAt:
          device.lastUsedAt ||
          device.firstUsedAt ||
          new Date().toISOString()
      };
    })
    .filter((device) => device.id);
}

function getEnvText(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  return String(value);
}

function getEnvBoolean(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
}

function getEnvNumber(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

app.get("/", (req, res) => {
  res.send("HEADLOCK KEY SERVER IS RUNNING");
});

app.get("/settings", (req, res) => {
  const db = readDB();
  const settings = db.settings || DEFAULT_SETTINGS;

  res.json({
    success: true,

    freeKeyUrl: getEnvText(
      "FREE_KEY_URL",
      settings.freeKeyUrl || DEFAULT_SETTINGS.freeKeyUrl
    ),

    contactUrl: getEnvText(
      "CONTACT_ZALO",
      settings.contactUrl || DEFAULT_SETTINGS.contactUrl
    ),

    maintenanceMode: getEnvBoolean(
      "MAINTENANCE_MODE",
      settings.maintenanceMode === true
    ),

    maintenanceTitle: getEnvText(
      "MAINTENANCE_TITLE",
      settings.maintenanceTitle || DEFAULT_SETTINGS.maintenanceTitle
    ),

    maintenanceMessage: getEnvText(
      "MAINTENANCE_MESSAGE",
      settings.maintenanceMessage || DEFAULT_SETTINGS.maintenanceMessage
    ),

    appLatestVersionCode: getEnvNumber(
      "APP_LATEST_VERSION_CODE",
      Number(settings.appLatestVersionCode || DEFAULT_SETTINGS.appLatestVersionCode)
    ),

    appMinVersionCode: getEnvNumber(
      "APP_MIN_VERSION_CODE",
      Number(settings.appMinVersionCode || DEFAULT_SETTINGS.appMinVersionCode)
    ),

    forceUpdate: getEnvBoolean(
      "FORCE_UPDATE",
      settings.forceUpdate === true
    ),

    updateUrl: getEnvText(
      "APK_UPDATE_URL",
      settings.updateUrl || DEFAULT_SETTINGS.updateUrl
    ),

    updateTitle: getEnvText(
      "UPDATE_TITLE",
      settings.updateTitle || DEFAULT_SETTINGS.updateTitle
    ),

    updateMessage: getEnvText(
      "UPDATE_MESSAGE",
      settings.updateMessage || DEFAULT_SETTINGS.updateMessage
    )
  });
});

app.get("/stats", (req, res) => {
  const db = readDB();
  const keys = db.keys || {};
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const onlineWindowMs = 10 * 60 * 1000;

  let activeKeys = 0;
  let today = 0;
  let totalDevices = 0;
  const onlineDeviceIds = new Set();

  Object.entries(keys).forEach(([key, keyData]) => {
    if (!keyData) {
      return;
    }

    normalizeDevices(keyData);

    const revoked = keyData.revoked === true;
    const expired = isExpired(keyData);

    if (!revoked && !expired) {
      activeKeys++;
    }

    keyData.devices.forEach((device) => {
      totalDevices++;

      const firstUsedAt = device.firstUsedAt || "";
      if (firstUsedAt.slice(0, 10) === todayKey) {
        today++;
      }

      const last = new Date(device.lastUsedAt || 0);
      if (!Number.isNaN(last.getTime()) && now - last <= onlineWindowMs) {
        onlineDeviceIds.add(device.id);
      }
    });
  });

  res.json({
    success: true,
    online: onlineDeviceIds.size,
    activeKeys,
    today,
    totalDevices,
    server: "Online",
    railway: "Online",
    updatedAt: now.toISOString()
  });
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
  const keyData = db.keys?.[key];

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

  if (isExpired(keyData)) {
    return res.json({
      success: false,
      message: "Key đã hết hạn."
    });
  }

  normalizeDevices(keyData);

  const maxDevices = getMaxDevices(keyData);
  const now = new Date().toISOString();

  let device = keyData.devices.find((d) => d.id === deviceId);

  if (!device) {
    if (keyData.devices.length >= maxDevices) {
      return res.json({
        success: false,
        message: `Key đã đạt giới hạn ${maxDevices} thiết bị.`
      });
    }

    device = {
      id: deviceId,
      name: deviceName || "Android Device",
      firstUsedAt: now,
      lastUsedAt: now
    };

    keyData.devices.push(device);
  } else {
    device.lastUsedAt = now;
    device.name = deviceName || device.name || "Android Device";
  }

  saveDB(db);

  return res.json({
    success: true,
    message: "Kích hoạt thành công",
    expiresAt: keyData.expiresAt || null,
    slotUsed: keyData.devices.length,
    slotMax: maxDevices,
    type: keyData.type || "custom"
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
