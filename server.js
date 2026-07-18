const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SEED_FILE = path.join(__dirname, "keys-db.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const DEFAULT_SETTINGS = {
  freeKeyUrl: "https://link4m.org/go/DbjwatKA",
  contactUrl: "https://zalo.me/0333635135",

  maintenanceMode: false,
  maintenanceTitle: "APP ĐANG NÂNG CẤP",
  maintenanceMessage: "Phiên bản mới đang được cập nhật.<br>Vui lòng quay lại sau.",

  appLatestVersionCode: 2,
  appMinVersionCode: 1,
  forceUpdate: false,
  updateUrl: "https://boostylink.com/8f947rKf",
  updateTitle: "CẦN CẬP NHẬT APP",
  updateMessage: "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục sử dụng."
};

if (!DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL chưa có. Hãy thêm PostgreSQL và DATABASE_URL trên Railway.");
}

if (!ADMIN_PASSWORD) {
  console.warn("WARNING: ADMIN_PASSWORD chưa được cấu hình. Các API admin sẽ từ chối đăng nhập.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: Math.max(1, Number(process.env.PG_POOL_MAX) || 10),
  idleTimeoutMillis: Math.max(1000, Number(process.env.PG_IDLE_TIMEOUT_MS) || 30000),
  connectionTimeoutMillis: Math.max(1000, Number(process.env.PG_CONNECTION_TIMEOUT_MS) || 10000),
  keepAlive: true,
  allowExitOnIdle: false,
  application_name: "headlock-key-server"
});

// Bắt lỗi từ các kết nối PostgreSQL đang rảnh trong pool.
// Nếu thiếu listener này, lỗi "Connection terminated unexpectedly"
// có thể trở thành "Unhandled 'error' event" và làm Node.js bị tắt.
pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error.message);
});

function getEnvText(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  return String(value);
}

function getEnvBoolean(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function getEnvNumber(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isExpired(row) {
  if (!row.expires_at) return false;
  return new Date() > new Date(row.expires_at);
}

function requireAdmin(req, res, next) {
  const token =
    req.headers["x-admin-password"] ||
    String(req.headers.authorization || "").replace(/^Bearer\s+/i, "") ||
    req.body?.adminPassword ||
    req.query?.adminPassword;

  if (!ADMIN_PASSWORD || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "Sai mật khẩu admin." });
  }

  next();
}

async function query(sql, params = []) {
  // pool.query tự lấy và trả kết nối về pool, tránh giữ client thủ công.
  return pool.query(sql, params);
}

async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS license_keys (
      key_text TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'custom',
      expires_at TIMESTAMPTZ,
      max_devices INTEGER NOT NULL DEFAULT 1,
      revoked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS key_devices (
      id BIGSERIAL PRIMARY KEY,
      key_text TEXT NOT NULL REFERENCES license_keys(key_text) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      device_name TEXT NOT NULL DEFAULT 'Android Device',
      first_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(key_text, device_id)
    )
  `);

  await query(
    `INSERT INTO app_settings (id, data)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(DEFAULT_SETTINGS)]
  );

  await seedFromJsonIfEmpty();
}

async function seedFromJsonIfEmpty() {
  const count = await query("SELECT COUNT(*)::int AS total FROM license_keys");
  if (count.rows[0].total > 0) return;
  if (!fs.existsSync(SEED_FILE)) return;

  try {
    const db = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));

    if (db.settings) {
      await query(
        `UPDATE app_settings SET data = $1::jsonb, updated_at = NOW() WHERE id = 1`,
        [JSON.stringify({ ...DEFAULT_SETTINGS, ...db.settings })]
      );
    }

    const keys = db.keys || {};
    for (const [keyText, item] of Object.entries(keys)) {
      await query(
        `INSERT INTO license_keys (key_text, type, expires_at, max_devices, revoked)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (key_text) DO NOTHING`,
        [
          keyText,
          item.type || "custom",
          item.expiresAt || null,
          Number(item.maxDevices || item.slots || 1),
          item.revoked === true
        ]
      );

      const devices = Array.isArray(item.devices) ? item.devices : [];
      for (const device of devices) {
        const deviceId = typeof device === "string" ? device : device.id;
        if (!deviceId) continue;
        await query(
          `INSERT INTO key_devices (key_text, device_id, device_name, first_used_at, last_used_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (key_text, device_id)
           DO UPDATE SET device_name = EXCLUDED.device_name, last_used_at = EXCLUDED.last_used_at`,
          [
            keyText,
            deviceId,
            typeof device === "string" ? "Android Device" : (device.name || "Android Device"),
            typeof device === "string" ? new Date().toISOString() : (device.firstUsedAt || device.createdAt || new Date().toISOString()),
            typeof device === "string" ? new Date().toISOString() : (device.lastUsedAt || device.firstUsedAt || new Date().toISOString())
          ]
        );
      }
    }

    console.log("Seed keys-db.json vào PostgreSQL thành công.");
  } catch (error) {
    console.error("Seed keys-db.json lỗi:", error.message);
  }
}

async function getSettings() {
  const result = await query("SELECT data FROM app_settings WHERE id = 1");
  return { ...DEFAULT_SETTINGS, ...(result.rows[0]?.data || {}) };
}

app.get("/", (req, res) => {
  res.send("HEADLOCK KEY SERVER IS RUNNING WITH POSTGRESQL");
});

app.get("/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({
      success: true,
      server: "online",
      database: "online",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      server: "online",
      database: "offline",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/settings", async (req, res) => {
  try {
    const settings = await getSettings();

    res.json({
      success: true,
      freeKeyUrl: getEnvText("FREE_KEY_URL", settings.freeKeyUrl || DEFAULT_SETTINGS.freeKeyUrl),
      contactUrl: getEnvText("CONTACT_ZALO", settings.contactUrl || DEFAULT_SETTINGS.contactUrl),
      maintenanceMode: getEnvBoolean("MAINTENANCE_MODE", settings.maintenanceMode === true),
      maintenanceTitle: getEnvText("MAINTENANCE_TITLE", settings.maintenanceTitle || DEFAULT_SETTINGS.maintenanceTitle),
      maintenanceMessage: getEnvText("MAINTENANCE_MESSAGE", settings.maintenanceMessage || DEFAULT_SETTINGS.maintenanceMessage),
      appLatestVersionCode: getEnvNumber("APP_LATEST_VERSION_CODE", Number(settings.appLatestVersionCode || DEFAULT_SETTINGS.appLatestVersionCode)),
      appMinVersionCode: getEnvNumber("APP_MIN_VERSION_CODE", Number(settings.appMinVersionCode || DEFAULT_SETTINGS.appMinVersionCode)),
      forceUpdate: getEnvBoolean("FORCE_UPDATE", settings.forceUpdate === true),
      updateUrl: getEnvText("APK_UPDATE_URL", settings.updateUrl || DEFAULT_SETTINGS.updateUrl),
      updateTitle: getEnvText("UPDATE_TITLE", settings.updateTitle || DEFAULT_SETTINGS.updateTitle),
      updateMessage: getEnvText("UPDATE_MESSAGE", settings.updateMessage || DEFAULT_SETTINGS.updateMessage)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tải settings.", error: error.message });
  }
});

app.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const onlineWindowMs = 10 * 60 * 1000;

    const active = await query(
      `SELECT COUNT(*)::int AS total
       FROM license_keys
       WHERE revoked = FALSE AND (expires_at IS NULL OR expires_at > NOW())`
    );

    const totalDevices = await query("SELECT COUNT(*)::int AS total FROM key_devices");

    const today = await query(
      `SELECT COUNT(*)::int AS total
       FROM key_devices
       WHERE first_used_at::date = $1::date`,
      [todayKey]
    );

    const online = await query(
      `SELECT COUNT(DISTINCT device_id)::int AS total
       FROM key_devices
       WHERE last_used_at >= NOW() - ($1 || ' milliseconds')::interval`,
      [onlineWindowMs]
    );

    res.json({
      success: true,
      online: online.rows[0].total,
      activeKeys: active.rows[0].total,
      today: today.rows[0].total,
      totalDevices: totalDevices.rows[0].total,
      server: "Online",
      railway: "Online",
      updatedAt: now.toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi thống kê.", error: error.message });
  }
});

app.post("/check-key", async (req, res) => {
  try {
    const { key, deviceId, deviceName } = req.body;

    if (!key || !deviceId) {
      return res.json({ success: false, message: "Thiếu key hoặc mã thiết bị." });
    }

    const keyResult = await query("SELECT * FROM license_keys WHERE key_text = $1", [key]);
    const keyData = keyResult.rows[0];

    if (!keyData) {
      return res.json({ success: false, message: "Key không hợp lệ." });
    }

    if (keyData.revoked === true) {
      return res.json({ success: false, message: "Key đã bị thu hồi." });
    }

    if (isExpired(keyData)) {
      return res.json({ success: false, message: "Key đã hết hạn." });
    }

    const maxDevices = Number(keyData.max_devices || 1);
    const deviceResult = await query(
      "SELECT * FROM key_devices WHERE key_text = $1 AND device_id = $2",
      [key, deviceId]
    );

    let device = deviceResult.rows[0];

    if (!device) {
      const countResult = await query(
        "SELECT COUNT(*)::int AS total FROM key_devices WHERE key_text = $1",
        [key]
      );

      if (countResult.rows[0].total >= maxDevices) {
        return res.json({ success: false, message: `Key đã đạt giới hạn ${maxDevices} thiết bị.` });
      }

      await query(
        `INSERT INTO key_devices (key_text, device_id, device_name, first_used_at, last_used_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [key, deviceId, deviceName || "Android Device"]
      );
    } else {
      await query(
        `UPDATE key_devices
         SET device_name = $3, last_used_at = NOW()
         WHERE key_text = $1 AND device_id = $2`,
        [key, deviceId, deviceName || device.device_name || "Android Device"]
      );
    }

    const slot = await query("SELECT COUNT(*)::int AS total FROM key_devices WHERE key_text = $1", [key]);

    res.json({
      success: true,
      message: "Kích hoạt thành công",
      expiresAt: toIso(keyData.expires_at),
      slotUsed: slot.rows[0].total,
      slotMax: maxDevices,
      type: keyData.type || "custom"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server kiểm tra key.", error: error.message });
  }
});

// ================= ADMIN API =================

app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) return res.json({ success: true, message: "Đăng nhập admin thành công." });
  return res.status(401).json({ success: false, message: "Sai mật khẩu admin." });
});

app.get("/admin/keys", requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        k.key_text AS key,
        k.type,
        k.expires_at AS "expiresAt",
        k.max_devices AS "maxDevices",
        k.revoked,
        k.created_at AS "createdAt",
        k.updated_at AS "updatedAt",
        COUNT(d.id)::int AS "slotUsed"
      FROM license_keys k
      LEFT JOIN key_devices d ON d.key_text = k.key_text
      GROUP BY k.key_text
      ORDER BY k.created_at DESC
    `);
    res.json({ success: true, keys: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tải key.", error: error.message });
  }
});

app.post("/admin/keys", requireAdmin, async (req, res) => {
  try {
    const { key, type, expiresAt, maxDevices, revoked } = req.body;
    if (!key) return res.json({ success: false, message: "Thiếu key." });

    await query(
      `INSERT INTO license_keys (key_text, type, expires_at, max_devices, revoked)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (key_text)
       DO UPDATE SET type = EXCLUDED.type, expires_at = EXCLUDED.expires_at,
       max_devices = EXCLUDED.max_devices, revoked = EXCLUDED.revoked, updated_at = NOW()`,
      [key, type || "custom", expiresAt || null, Number(maxDevices || 1), revoked === true]
    );

    res.json({ success: true, message: "Đã lưu key." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lưu key.", error: error.message });
  }
});

app.put("/admin/keys/:key", requireAdmin, async (req, res) => {
  try {
    const key = req.params.key;
    const { type, expiresAt, maxDevices, revoked } = req.body;

    await query(
      `UPDATE license_keys
       SET type = COALESCE($2, type), expires_at = $3,
       max_devices = COALESCE($4, max_devices), revoked = COALESCE($5, revoked), updated_at = NOW()
       WHERE key_text = $1`,
      [key, type || null, expiresAt || null, maxDevices ? Number(maxDevices) : null, typeof revoked === "boolean" ? revoked : null]
    );

    res.json({ success: true, message: "Đã cập nhật key." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật key.", error: error.message });
  }
});

app.delete("/admin/keys/:key", requireAdmin, async (req, res) => {
  try {
    await query("DELETE FROM license_keys WHERE key_text = $1", [req.params.key]);
    res.json({ success: true, message: "Đã xóa key." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa key.", error: error.message });
  }
});

app.get("/admin/keys/:key/devices", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT device_id AS id, device_name AS name,
       first_used_at AS "firstUsedAt", last_used_at AS "lastUsedAt"
       FROM key_devices WHERE key_text = $1 ORDER BY last_used_at DESC`,
      [req.params.key]
    );
    res.json({ success: true, devices: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tải thiết bị.", error: error.message });
  }
});

app.delete("/admin/keys/:key/devices", requireAdmin, async (req, res) => {
  try {
    await query("DELETE FROM key_devices WHERE key_text = $1", [req.params.key]);
    res.json({ success: true, message: "Đã reset toàn bộ thiết bị của key." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi reset thiết bị.", error: error.message });
  }
});

app.delete("/admin/keys/:key/devices/:deviceId", requireAdmin, async (req, res) => {
  try {
    await query("DELETE FROM key_devices WHERE key_text = $1 AND device_id = $2", [req.params.key, req.params.deviceId]);
    res.json({ success: true, message: "Đã xóa thiết bị." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa thiết bị.", error: error.message });
  }
});

app.get("/admin/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tải settings.", error: error.message });
  }
});

app.put("/admin/settings", requireAdmin, async (req, res) => {
  try {
    const oldSettings = await getSettings();
    const newSettings = { ...oldSettings, ...(req.body || {}) };
    delete newSettings.adminPassword;

    await query("UPDATE app_settings SET data = $1::jsonb, updated_at = NOW() WHERE id = 1", [JSON.stringify(newSettings)]);

    res.json({ success: true, message: "Đã cập nhật settings.", settings: newSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật settings.", error: error.message });
  }
});

const STARTUP_RETRY_LIMIT = Math.max(1, Number(process.env.DB_STARTUP_RETRY_LIMIT) || 10);
const STARTUP_RETRY_DELAY_MS = Math.max(1000, Number(process.env.DB_STARTUP_RETRY_DELAY_MS) || 5000);

let httpServer = null;
let shuttingDown = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initializeDatabaseWithRetry() {
  if (!DATABASE_URL) {
    throw new Error("Thiếu DATABASE_URL.");
  }

  for (let attempt = 1; attempt <= STARTUP_RETRY_LIMIT; attempt += 1) {
    try {
      await initDB();
      console.log("PostgreSQL initialized successfully.");
      return;
    } catch (error) {
      console.error(
        `Khởi tạo PostgreSQL thất bại (${attempt}/${STARTUP_RETRY_LIMIT}):`,
        error.message
      );

      if (attempt === STARTUP_RETRY_LIMIT) {
        throw error;
      }

      await sleep(STARTUP_RETRY_DELAY_MS);
    }
  }
}

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal}: đang đóng server an toàn...`);

  const forceExitTimer = setTimeout(() => {
    console.error("Quá thời gian đóng server. Buộc thoát.");
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await pool.end();
    clearTimeout(forceExitTimer);
    console.log("Đã đóng HTTP server và PostgreSQL pool.");
    process.exit(exitCode);
  } catch (error) {
    clearTimeout(forceExitTimer);
    console.error("Lỗi khi đóng server:", error);
    process.exit(1);
  }
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("UNCAUGHT_EXCEPTION", 1);
});

async function startServer() {
  await initializeDatabaseWithRetry();

  httpServer = app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
  });

  httpServer.on("error", (error) => {
    console.error("HTTP server error:", error);
  });
}

startServer().catch(async (error) => {
  console.error("Không khởi động được server:", error);

  try {
    await pool.end();
  } catch (closeError) {
    console.error("Không đóng được PostgreSQL pool:", closeError.message);
  }

  process.exit(1);
});
