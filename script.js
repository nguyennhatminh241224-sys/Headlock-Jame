// ================= HEADLOCK JAME CONFIG =================
const API_BASE = "https://headlock-jame-production.up.railway.app";
function showMaintenanceScreen(title, message) {
  document.body.innerHTML = `
    <div style="position:fixed;inset:0;z-index:999999;display:flex;justify-content:center;align-items:center;background:#07090f;color:white;font-family:Arial,sans-serif;text-align:center;padding:20px;">
      <div>
        <div style="font-size:54px;font-weight:bold;color:#facc15;margin-bottom:20px;">HEADLOCK</div>
        <h2 style="margin:0 0 15px">${title || "APP ĐANG NÂNG CẤP"}</h2>
        <p style="opacity:.8;line-height:1.6">
          ${message || "Phiên bản mới đang được cập nhật.<br>Vui lòng quay lại sau."}
        </p>
      </div>
    </div>`;
}


function showForceUpdateScreen(title, message, updateUrl) {
  document.body.innerHTML = `
    <div style="position:fixed;inset:0;z-index:999999;display:flex;justify-content:center;align-items:center;background:#07090f;color:white;font-family:Arial,sans-serif;text-align:center;padding:20px;">
      <div style="max-width:360px;width:100%;">
        <div style="font-size:48px;font-weight:bold;color:#facc15;margin-bottom:18px;">HEADLOCK</div>
        <h2 style="margin:0 0 14px;font-size:24px;">${title || "CẦN CẬP NHẬT APP"}</h2>
        <p style="opacity:.86;line-height:1.6;margin-bottom:22px;">
          ${message || "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục sử dụng."}
        </p>
        <button id="forceUpdateBtn" type="button" style="width:100%;border:0;border-radius:18px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;font-weight:800;font-size:17px;padding:16px 18px;">
          TẢI BẢN MỚI
        </button>
        <p style="font-size:13px;opacity:.65;margin-top:14px;">Bạn cần cập nhật để tiếp tục dùng app.</p>
      </div>
    </div>`;

  setTimeout(() => {
    const btn = document.getElementById("forceUpdateBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      if (hasAndroidBridge() && typeof AndroidBridge.openExternalUrl === "function") {
        AndroidBridge.openExternalUrl(updateUrl);
      } else {
        window.location.href = updateUrl;
      }
    });
  }, 0);
}

function getCurrentAppVersionCode() {
  try {
    if (hasAndroidBridge() && typeof AndroidBridge.getVersionCode === "function") {
      return parseInt(AndroidBridge.getVersionCode(), 10) || 1;
    }
  } catch (error) {
    console.warn("Không lấy được versionCode", error);
  }

  return 1;
}

function shouldForceUpdate(data) {
  // Chỉ Android APK/WebView mới bắt buộc cập nhật.
  // Web, iOS Safari/PWA không cần hiện màn hình cập nhật APK.
  if (!hasAndroidBridge()) return false;

  const currentVersion = getCurrentAppVersionCode();
  const latestVersion = parseInt(data.appLatestVersionCode || data.latestVersionCode || "1", 10) || 1;
  const minVersion = parseInt(data.appMinVersionCode || data.minVersionCode || "1", 10) || 1;
  const forceUpdate = data.forceUpdate === true;
  const updateUrl = data.updateUrl || data.apkUrl || "";

  if (!updateUrl) return false;

  if (currentVersion < minVersion) return true;
  if (forceUpdate && currentVersion < latestVersion) return true;

  return false;
}

let GET_KEY_FREE_URL = "https://link4m.net/lnZEeK4t";
let CONTACT_ZALO = "https://zalo.me/0333635135";

const STORAGE = {
  DEVICE: "headlock_device",
  KEY: "headlock_key",
  SESSION: "headlock_session",
  CROSSHAIR_SIZE: "crosshair_size",
  CROSSHAIR_COLOR: "crosshair_color",
  CROSSHAIR_STYLE: "crosshair_style",
  CROSSHAIR_X: "crosshair_x",
  CROSSHAIR_Y: "crosshair_y"
};


async function loadRemoteSettings() {
  try {
    const res = await fetch(API_BASE + "/settings");
    if (!res.ok) throw new Error("Settings API lỗi");

    const data = await res.json();

    if (data.success) {
      GET_KEY_FREE_URL = data.freeKeyUrl || GET_KEY_FREE_URL;
      CONTACT_ZALO = data.contactUrl || CONTACT_ZALO;

      if (shouldForceUpdate(data)) {
        showForceUpdateScreen(
          data.updateTitle || "CẦN CẬP NHẬT APP",
          data.updateMessage || "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục sử dụng.",
          data.updateUrl || data.apkUrl
        );

        return false;
      }

      if (data.maintenanceMode === true) {
        showMaintenanceScreen(
          data.maintenanceTitle || "APP ĐANG NÂNG CẤP",
          data.maintenanceMessage || "Phiên bản mới đang được cập nhật.<br>Vui lòng quay lại sau."
        );

        return false;
      }
    }

    return true;
  } catch (e) {
    console.warn("Không tải được settings online", e);
    return true;
  }
}

const passwordScreen = document.getElementById("passwordScreen");
const mainApp = document.getElementById("mainApp");
const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");
const togglePassword = document.getElementById("togglePassword");
const logoutBtn = document.getElementById("logoutBtn");
const contactBtn = document.getElementById("contactBtn");
const getKeyBtn = document.getElementById("getKeyBtn");
const infoGetKeyBtn = document.getElementById("infoGetKeyBtn");
const appLogoutBtn = document.getElementById("appLogoutBtn");
const licenseText = document.getElementById("licenseText");

const boostModal = document.getElementById("boostModal");
const crosshairModal = document.getElementById("crosshairModal");
const crosshairDot = document.getElementById("crosshairDot");
const crosshairSize = document.getElementById("crosshairSize");
const crosshairColor = document.getElementById("crosshairColor");
const crosshairOnBtn = document.getElementById("crosshairOnBtn");
const crosshairOffBtn = document.getElementById("crosshairOffBtn");
const logoutModal = document.getElementById("logoutModal");
const logoutConfirm = document.getElementById("logoutConfirm");
const logoutCancel = document.getElementById("logoutCancel");
const logoutClose = document.getElementById("logoutClose");

// Nút / thanh chỉnh vị trí tâm ảo
const crosshairMoveUp = document.getElementById("crosshairMoveUp");
const crosshairMoveDown = document.getElementById("crosshairMoveDown");
const crosshairMoveLeft = document.getElementById("crosshairMoveLeft");
const crosshairMoveRight = document.getElementById("crosshairMoveRight");
const crosshairResetPos = document.getElementById("crosshairResetPos");
const crosshairPosX = document.getElementById("crosshairPosX");
const crosshairPosY = document.getElementById("crosshairPosY");
const crosshairPosText = document.getElementById("crosshairPosText");

const terminal = document.getElementById("terminal");
const boostDone = document.getElementById("boostDone");
const toast = document.getElementById("toast");
const infoPanel = document.getElementById("infoPanel");
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");
const closeInfo = document.getElementById("closeInfo");

const terminalLines = [
  "$ Initializing BOST RAM optimization...",
  "$ Scanning system memory...",
  "$ Clearing cache files...",
  "$ Optimizing RAM allocation...",
  "$ Freeing up memory blocks...",
  "$ Applying performance boost...",
  "$ Finalizing optimization..."
];

function hasAndroidBridge() {
  return typeof AndroidBridge !== "undefined";
}

function getDeviceId() {
  try {
    if (hasAndroidBridge() && typeof AndroidBridge.getAndroidId === "function") {
      const androidId = AndroidBridge.getAndroidId();
      if (androidId && androidId.length > 5) return "ANDROID-" + androidId;
    }
  } catch (error) {
    console.warn("Không lấy được Android ID:", error);
  }

  let deviceId = localStorage.getItem(STORAGE.DEVICE);
  if (!deviceId) {
    deviceId = "WEB-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem(STORAGE.DEVICE, deviceId);
  }
  return deviceId;
}

function setLoginMessage(type, text) {
  if (!passwordError) return;
  passwordError.className = "message " + (type || "");
  passwordError.textContent = text;
}

function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("active");
  clearTimeout(window.headlockToastTimer);
  window.headlockToastTimer = setTimeout(() => toast.classList.remove("active"), 1800);
}

function formatDate(value) {
  if (!value) return "vĩnh viễn";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

async function checkKeyOnline(key) {
  const res = await fetch(API_BASE + "/check-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      deviceId: getDeviceId(),
      deviceName: navigator.userAgent || "Android Device"
    })
  });

  if (!res.ok) throw new Error("Không kết nối được server.");
  return await res.json();
}

function unlockApp(message = "Đã mở khóa") {
  document.body.classList.add("unlocked");
  if (passwordScreen) passwordScreen.classList.add("hidden");
  if (mainApp) mainApp.classList.remove("locked");
  if (logoutBtn) logoutBtn.classList.remove("hidden");
  if (licenseText) licenseText.textContent = message;

  sessionStorage.setItem(STORAGE.SESSION, "true");
  setLoginMessage("ok", message);
  showToast(message);
}

function lockApp(options = {}) {
  const clearSavedKey = options.clearSavedKey === true;

  document.body.classList.remove("unlocked");
  if (passwordScreen) passwordScreen.classList.remove("hidden");
  if (mainApp) mainApp.classList.add("locked");
  if (logoutBtn) logoutBtn.classList.add("hidden");
  if (passwordInput) passwordInput.value = "";

  sessionStorage.removeItem(STORAGE.SESSION);

  // Không xóa key đã lưu khi app tự khóa do reload/mất mạng.
  // Chỉ xóa khi người dùng bấm Đăng xuất hoặc key thật sự không còn hợp lệ.
  if (clearSavedKey) {
    localStorage.removeItem(STORAGE.KEY);
  }

  setLoginMessage("", "Zalo hỗ trợ: 0333635135");
}

async function loginWithValue(value) {
  setLoginMessage("", "Đang kiểm tra key...");
  const result = await checkKeyOnline(value);

  if (result.success) {
    localStorage.setItem(STORAGE.KEY, value);
    const slotText = result.slotUsed && result.slotMax ? ` | Slot: ${result.slotUsed}/${result.slotMax}` : "";
    unlockApp("Key hết hạn: " + formatDate(result.expiresAt) + slotText);
    return;
  }

  throw new Error(result.message || "Key không hợp lệ.");
}

async function autoLogin() {
  const savedKey = localStorage.getItem(STORAGE.KEY);
  if (!savedKey) return;

  try {
    await loginWithValue(savedKey);
  } catch (error) {
    sessionStorage.removeItem(STORAGE.SESSION);
    setLoginMessage("err", error.message || "Key đã lưu không còn hợp lệ.");
  }
}

function startExpireWatcher() {
  setInterval(async () => {
    const savedKey = localStorage.getItem(STORAGE.KEY);
    if (!savedKey || sessionStorage.getItem(STORAGE.SESSION) !== "true") return;

    try {
      const result = await checkKeyOnline(savedKey);
      if (!result.success) {
        lockApp({ clearSavedKey: true });
        setLoginMessage("err", result.message || "Key không còn hợp lệ.");
      }
    } catch {
      // Mất mạng/server lỗi tạm thời: khóa màn hình nhưng vẫn giữ key để lần sau tự đăng nhập lại.
      lockApp({ clearSavedKey: false });
      setLoginMessage("err", "Không kết nối được server kiểm tra key.");
    }
  }, 60000);
}

if (passwordForm) {
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = passwordInput.value.trim();

    if (!value) {
      setLoginMessage("err", "Vui lòng nhập mật khẩu hoặc key.");
      return;
    }

    try {
      await loginWithValue(value);
      passwordInput.value = "";
    } catch (error) {
      setLoginMessage("err", error.message || "Đăng nhập thất bại.");
      passwordInput.select();
      passwordForm.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }],
        { duration: 260, iterations: 1 }
      );
    }
  });
}

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "🙈" : "👁";
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    lockApp({ clearSavedKey: true });
  });
}


// ===== Đăng xuất App: popup riêng, không dùng confirm() nên không hiện file:// =====
if (appLogoutBtn) {
  appLogoutBtn.addEventListener("click", () => {
    openModal(logoutModal);
  });
}

if (logoutCancel) {
  logoutCancel.addEventListener("click", () => closeModal(logoutModal));
}

if (logoutClose) {
  logoutClose.addEventListener("click", () => closeModal(logoutModal));
}

if (logoutConfirm) {
  logoutConfirm.addEventListener("click", () => {
    localStorage.removeItem(STORAGE.KEY);
    sessionStorage.removeItem(STORAGE.SESSION);

    closeModal(logoutModal);
    if (infoPanel) infoPanel.classList.remove("active");
    showToast("Đã đăng xuất");

    setTimeout(() => {
      location.reload();
    }, 500);
  });
}

if (contactBtn) contactBtn.addEventListener("click", () => window.open(CONTACT_ZALO, "_blank"));
if (getKeyBtn) getKeyBtn.addEventListener("click", () => window.open(GET_KEY_FREE_URL, "_blank"));
if (infoGetKeyBtn) infoGetKeyBtn.addEventListener("click", () => window.open(GET_KEY_FREE_URL, "_blank"));

function closeAll() {
  if (infoPanel) infoPanel.classList.remove("active");
  closeModal(boostModal);
  closeModal(crosshairModal);
  closeModal(logoutModal);
  if (overlay) overlay.classList.add("hidden");
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    if (infoPanel) infoPanel.classList.add("active");
    if (overlay) overlay.classList.remove("hidden");
  });
}
if (closeInfo) closeInfo.addEventListener("click", closeAll);
if (overlay) overlay.addEventListener("click", closeAll);

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  if (overlay) overlay.classList.remove("hidden");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");

  const hasOpen =
    (boostModal && !boostModal.classList.contains("hidden")) ||
    (crosshairModal && !crosshairModal.classList.contains("hidden")) ||
    (logoutModal && !logoutModal.classList.contains("hidden")) ||
    (infoPanel && infoPanel.classList.contains("active"));

  if (!hasOpen && overlay) overlay.classList.add("hidden");
}

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeModal(boostModal);
    closeModal(crosshairModal);
    closeModal(logoutModal);
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

function runBoost() {
  if (!terminal || !boostDone) return;
  terminal.textContent = "";
  boostDone.classList.add("hidden");
  openModal(boostModal);

  let index = 0;
  const timer = setInterval(() => {
    terminal.textContent += terminalLines[index] + "\n";
    index++;
    if (index >= terminalLines.length) {
      clearInterval(timer);
      setTimeout(() => boostDone.classList.remove("hidden"), 450);
    }
  }, 380);
}

document.querySelectorAll(".menu-row").forEach((btn) => {
  btn.addEventListener("click", () => {
    const feature = btn.dataset.feature;

    if (feature === "crosshair") {
      btn.classList.add("active");
      openModal(crosshairModal);
      showToast("Mở chỉnh tâm ảo");
      return;
    }

    if (feature === "boost") {
      btn.classList.add("active");
      runBoost();
      showToast("Đã bật Boost RAM");
      return;
    }

    if (feature === "info") {
      if (infoPanel) infoPanel.classList.add("active");
      if (overlay) overlay.classList.remove("hidden");
      return;
    }

    btn.classList.toggle("active");
    const name = btn.querySelector("b")?.textContent || "Tính năng";
    showToast(btn.classList.contains("active") ? "Đã bật " + name : "Đã tắt " + name);
  });
});

// ================= REAL ANDROID CROSSHAIR =================

let currentCrosshairStyle = localStorage.getItem(STORAGE.CROSSHAIR_STYLE) || "classic";
let currentCrosshairX = parseInt(localStorage.getItem(STORAGE.CROSSHAIR_X) || "0", 10);
let currentCrosshairY = parseInt(localStorage.getItem(STORAGE.CROSSHAIR_Y) || "0", 10);
const CROSSHAIR_MOVE_STEP = 5;

function setPreviewStyle(styleName) {
  currentCrosshairStyle = styleName || "classic";
  localStorage.setItem(STORAGE.CROSSHAIR_STYLE, currentCrosshairStyle);

  document.querySelectorAll(".crosshair-style").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.style === currentCrosshairStyle);
  });

  if (crosshairDot) {
    crosshairDot.className = "crosshair-dot " + currentCrosshairStyle;
  }
}

function safeNumber(value, fallback = 0) {
  const number = parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
}

function getInputMin(input, fallback) {
  if (!input || input.min === "") return fallback;
  return safeNumber(input.min, fallback);
}

function getInputMax(input, fallback) {
  if (!input || input.max === "") return fallback;
  return safeNumber(input.max, fallback);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateCrosshairPositionText() {
  if (crosshairPosText) {
    crosshairPosText.textContent = `X: ${currentCrosshairX} | Y: ${currentCrosshairY}`;
  }

  // Hiển thị vị trí trong khung preview ở tỉ lệ nhỏ để dễ nhìn, không ảnh hưởng vị trí thật trên Android.
  if (crosshairDot) {
    crosshairDot.style.setProperty("--crosshair-x", Math.round(currentCrosshairX / 3) + "px");
    crosshairDot.style.setProperty("--crosshair-y", Math.round(currentCrosshairY / 3) + "px");
  }
}

function setCrosshairPosition(x, y, shouldUpdateNative = true) {
  const minX = getInputMin(crosshairPosX, -300);
  const maxX = getInputMax(crosshairPosX, 300);
  const minY = getInputMin(crosshairPosY, -300);
  const maxY = getInputMax(crosshairPosY, 300);

  currentCrosshairX = clamp(safeNumber(x, 0), minX, maxX);
  currentCrosshairY = clamp(safeNumber(y, 0), minY, maxY);

  localStorage.setItem(STORAGE.CROSSHAIR_X, currentCrosshairX);
  localStorage.setItem(STORAGE.CROSSHAIR_Y, currentCrosshairY);

  if (crosshairPosX) crosshairPosX.value = currentCrosshairX;
  if (crosshairPosY) crosshairPosY.value = currentCrosshairY;

  updateCrosshairPositionText();

  if (shouldUpdateNative) {
    updateNativeCrosshair();
  }
}

function updateCrosshairPreview() {
  if (!crosshairDot || !crosshairSize || !crosshairColor) return;

  const size = crosshairSize.value + "px";
  const color = crosshairColor.value;

  crosshairDot.style.width = size;
  crosshairDot.style.height = size;
  crosshairDot.style.borderColor = color;
  crosshairDot.style.boxShadow = `0 0 16px ${color}`;

  let style = document.getElementById("crosshairDynamicStyle");
  if (!style) {
    style = document.createElement("style");
    style.id = "crosshairDynamicStyle";
    document.head.appendChild(style);
  }

  style.textContent = `
    .crosshair-dot::before,
    .crosshair-dot::after {
      background: ${color};
      box-shadow: 0 0 12px ${color};
    }
  `;
}

function updateNativeCrosshair() {
  if (!crosshairSize || !crosshairColor) return;

  const size = parseInt(crosshairSize.value, 10);
  const color = crosshairColor.value;

  updateCrosshairPreview();

  localStorage.setItem(STORAGE.CROSSHAIR_SIZE, size);
  localStorage.setItem(STORAGE.CROSSHAIR_COLOR, color);

  // Cập nhật size + màu. Hàm Java hiện tại nhận đúng 2 tham số: size, color.
  if (hasAndroidBridge() && typeof AndroidBridge.updateCrosshair === "function") {
    AndroidBridge.updateCrosshair(size, color);
  }

  // Cập nhật vị trí X/Y riêng để tâm ảo thật di chuyển trên màn hình.
  if (hasAndroidBridge() && typeof AndroidBridge.updateCrosshairPosition === "function") {
    AndroidBridge.updateCrosshairPosition(currentCrosshairX, currentCrosshairY);
  }

  if (hasAndroidBridge() && typeof AndroidBridge.setCrosshairStyle === "function") {
    AndroidBridge.setCrosshairStyle(currentCrosshairStyle);
  }
}

function loadCrosshair() {
  const size = localStorage.getItem(STORAGE.CROSSHAIR_SIZE);
  const color = localStorage.getItem(STORAGE.CROSSHAIR_COLOR);
  const style = localStorage.getItem(STORAGE.CROSSHAIR_STYLE) || "classic";
  const posX = localStorage.getItem(STORAGE.CROSSHAIR_X);
  const posY = localStorage.getItem(STORAGE.CROSSHAIR_Y);

  if (size && crosshairSize) crosshairSize.value = size;
  if (color && crosshairColor) crosshairColor.value = color;

  currentCrosshairX = safeNumber(posX, 0);
  currentCrosshairY = safeNumber(posY, 0);
  if (crosshairPosX) crosshairPosX.value = currentCrosshairX;
  if (crosshairPosY) crosshairPosY.value = currentCrosshairY;
  updateCrosshairPositionText();

  setPreviewStyle(style);
  updateNativeCrosshair();
}

document.querySelectorAll(".crosshair-style").forEach((btn) => {
  btn.addEventListener("click", () => {
    setPreviewStyle(btn.dataset.style);
    updateNativeCrosshair();
  });
});

if (crosshairSize) crosshairSize.addEventListener("input", updateNativeCrosshair);
if (crosshairColor) crosshairColor.addEventListener("input", updateNativeCrosshair);

if (crosshairPosX) {
  crosshairPosX.addEventListener("input", () => {
    setCrosshairPosition(crosshairPosX.value, currentCrosshairY);
  });
}

if (crosshairPosY) {
  crosshairPosY.addEventListener("input", () => {
    setCrosshairPosition(currentCrosshairX, crosshairPosY.value);
  });
}

if (crosshairMoveUp) {
  crosshairMoveUp.addEventListener("click", () => {
    setCrosshairPosition(currentCrosshairX, currentCrosshairY - CROSSHAIR_MOVE_STEP);
  });
}

if (crosshairMoveDown) {
  crosshairMoveDown.addEventListener("click", () => {
    setCrosshairPosition(currentCrosshairX, currentCrosshairY + CROSSHAIR_MOVE_STEP);
  });
}

if (crosshairMoveLeft) {
  crosshairMoveLeft.addEventListener("click", () => {
    setCrosshairPosition(currentCrosshairX - CROSSHAIR_MOVE_STEP, currentCrosshairY);
  });
}

if (crosshairMoveRight) {
  crosshairMoveRight.addEventListener("click", () => {
    setCrosshairPosition(currentCrosshairX + CROSSHAIR_MOVE_STEP, currentCrosshairY);
  });
}

if (crosshairResetPos) {
  crosshairResetPos.addEventListener("click", () => {
    setCrosshairPosition(0, 0);
    showToast("Đã đưa tâm ảo về giữa màn hình");
  });
}

if (crosshairOnBtn) {
  crosshairOnBtn.addEventListener("click", () => {
    updateNativeCrosshair();

    if (hasAndroidBridge() && typeof AndroidBridge.startCrosshair === "function") {
      AndroidBridge.startCrosshair();
      showToast("Đã bật tâm ảo");
    } else {
      showToast("Chỉ hoạt động trong app Android");
    }
  });
}

if (crosshairOffBtn) {
  crosshairOffBtn.addEventListener("click", () => {
    if (hasAndroidBridge() && typeof AndroidBridge.stopCrosshair === "function") {
      AndroidBridge.stopCrosshair();
      showToast("Đã tắt tâm ảo");
    }
  });
}


// ================= LIVE DASHBOARD STATS =================

const statOnline = document.getElementById("statOnline");
const statActiveKeys = document.getElementById("statActiveKeys");
const statToday = document.getElementById("statToday");
const statServer = document.getElementById("statServer");
const statUpdated = document.getElementById("statUpdated");
const refreshStatsBtn = document.getElementById("refreshStatsBtn");

function setStat(el, value) {
  if (el) el.textContent = value ?? "--";
}

async function loadStats() {
  try {
    setStat(statServer, "...");
    const res = await fetch(API_BASE + "/stats", { method: "GET" });
    if (!res.ok) throw new Error("Stats API lỗi");

    const data = await res.json();

    setStat(statOnline, data.online ?? 0);
    setStat(statActiveKeys, data.activeKeys ?? 0);
    setStat(statToday, data.today ?? 0);
    setStat(statServer, data.server || "Online");

    if (statUpdated) {
      const now = new Date();
      statUpdated.textContent = "Cập nhật: " + now.toLocaleTimeString("vi-VN");
    }
  } catch (error) {
    setStat(statServer, "Offline");
    if (statUpdated) statUpdated.textContent = "Không đồng bộ được thống kê.";
  }
}

if (refreshStatsBtn) {
  refreshStatsBtn.addEventListener("click", () => {
    loadStats();
    showToast("Đang tải thống kê...");
  });
}

setInterval(loadStats, 30000);



async function startHeadlockApp() {
  const canStart = await loadRemoteSettings();

  if (!canStart) return;

  loadCrosshair();
  loadStats();
  startExpireWatcher();
  autoLogin();
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startHeadlockApp);
} else {
  startHeadlockApp();
}
