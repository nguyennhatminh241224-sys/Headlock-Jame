// ================= HEADLOCK JAME CONFIG =================
const API_BASE = "https://headlock-jame-production.up.railway.app";

// ================= MAINTENANCE =================
const MAINTENANCE_MODE = True; false

if (MAINTENANCE_MODE) {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.innerHTML = `
      <div style="
        position:fixed;
        inset:0;
        display:flex;
        justify-content:center;
        align-items:center;
        background:#07090f;
        color:white;
        font-family:Arial,sans-serif;
        text-align:center;
        padding:20px;
      ">
        <div>
          <div style="font-size:70px;font-weight:bold;color:#00d4ff;margin-bottom:20px;">
            HEADLOCK
          </div>
          <h2 style="margin:0 0 15px">APP ĐANG NÂNG CẤP</h2>
          <p style="opacity:.8">
            Phiên bản mới đang được cập nhật.<br>
            Vui lòng quay lại sau.
          </p>
          <div style="margin-top:25px;color:#00ff88;font-size:14px;">
            © HEADLOCK JAME
          </div>
        </div>
      </div>
    `;
  });

  throw new Error("Maintenance");
}

const GET_KEY_FREE_URL = "https://link4m.net/lnZEeK4t";
const CONTACT_ZALO = "https://zalo.me/0333635135";

const STORAGE = {
  DEVICE: "headlock-jame-device-id",
  KEY: "headlock-jame-key",
  SESSION: "headlock-jame-unlocked",
  VERSION: "headlock-jame-freefire-version"
};

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
const licenseText = document.getElementById("licenseText");

const actions = document.querySelectorAll(".feature-card");
const versionModal = document.getElementById("versionModal");
const boostModal = document.getElementById("boostModal");
const crosshairModal = document.getElementById("crosshairModal");
const crosshairDot = document.getElementById("crosshairDot");
const crosshairSize = document.getElementById("crosshairSize");
const crosshairColor = document.getElementById("crosshairColor");

const terminal = document.getElementById("terminal");
const boostDone = document.getElementById("boostDone");
const statusText = document.getElementById("statusText");
const onBtn = document.getElementById("onBtn");
const offBtn = document.getElementById("offBtn");
const toast = document.getElementById("toast");
const infoPanel = document.getElementById("infoPanel");
const overlay = document.getElementById("overlay");

const terminalLines = [
  "$ Initializing BOST RAM optimization...",
  "$ Scanning system memory...",
  "$ Clearing cache files...",
  "$ Optimizing RAM allocation...",
  "$ Freeing up memory blocks...",
  "$ Applying performance boost...",
  "$ Finalizing optimization..."
];

function getDeviceId() {
  try {
    if (
      typeof AndroidBridge !== "undefined" &&
      typeof AndroidBridge.getAndroidId === "function"
    ) {
      const androidId = AndroidBridge.getAndroidId();

      if (androidId && androidId.length > 5) {
        return "ANDROID-" + androidId;
      }
    }
  } catch (error) {
    console.warn("Không lấy được Android ID:", error);
  }

  let deviceId = localStorage.getItem(STORAGE.DEVICE);

  if (!deviceId) {
    deviceId =
      "WEB-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 10).toUpperCase();

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
  window.headlockToastTimer = setTimeout(() => {
    toast.classList.remove("active");
  }, 1800);
}

function formatDate(value) {
  if (!value) return "vĩnh viễn";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
}

async function checkKeyOnline(key) {
  const res = await fetch(API_BASE + "/check-key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      key,
      deviceId: getDeviceId()
    })
  });

  if (!res.ok) {
    throw new Error("Không kết nối được API.");
  }

  return await res.json();
}

function unlockApp(message = "Đã mở khóa") {
  document.body.classList.add("unlocked");

  if (passwordScreen) passwordScreen.classList.add("hidden");
  if (mainApp) mainApp.classList.remove("locked");
  if (logoutBtn) logoutBtn.classList.remove("hidden");
  if (licenseText) licenseText.textContent = message;

  sessionStorage.setItem(STORAGE.SESSION, "true");
}

function lockApp() {
  document.body.classList.remove("unlocked");

  if (passwordScreen) passwordScreen.classList.remove("hidden");
  if (mainApp) mainApp.classList.add("locked");
  if (logoutBtn) logoutBtn.classList.add("hidden");
  if (passwordInput) passwordInput.value = "";

  sessionStorage.removeItem(STORAGE.SESSION);
  localStorage.removeItem(STORAGE.KEY);

  setLoginMessage("", "Zalo hỗ trợ: 0333635135");
}

async function loginWithValue(value) {
  if (!API_BASE || !API_BASE.startsWith("http")) {
    throw new Error("Chưa cấu hình API_BASE.");
  }

  setLoginMessage("", "Đang kiểm tra key online...");

  const result = await checkKeyOnline(value);

  if (result.success) {
    localStorage.setItem(STORAGE.KEY, value);

    const slotText =
      result.slotUsed && result.slotMax
        ? ` | Slot: ${result.slotUsed}/${result.slotMax}`
        : "";

    unlockApp("Key hết hạn: " + formatDate(result.expiresAt) + slotText);
    return;
  }

  throw new Error(result.message || "Key không hợp lệ.");
}

async function autoLogin() {
  const savedKey = localStorage.getItem(STORAGE.KEY);

  if (!savedKey || sessionStorage.getItem(STORAGE.SESSION) !== "true") {
    return;
  }

  try {
    await loginWithValue(savedKey);
  } catch {
    lockApp();
  }
}

function startExpireWatcher() {
  setInterval(async () => {
    const savedKey = localStorage.getItem(STORAGE.KEY);

    if (!savedKey) return;
    if (sessionStorage.getItem(STORAGE.SESSION) !== "true") return;

    try {
      const result = await checkKeyOnline(savedKey);

      if (!result.success) {
        lockApp();
        setLoginMessage("err", result.message || "Key không còn hợp lệ.");
      }
    } catch {
      lockApp();
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
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-8px)" },
          { transform: "translateX(8px)" },
          { transform: "translateX(0)" }
        ],
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
  logoutBtn.addEventListener("click", lockApp);
}

if (contactBtn) {
  contactBtn.addEventListener("click", () => {
    window.open(CONTACT_ZALO, "_blank");
  });
}

function openGetKeyFree() {
  window.open(GET_KEY_FREE_URL, "_blank");
}

if (getKeyBtn) {
  getKeyBtn.addEventListener("click", openGetKeyFree);
}

if (infoGetKeyBtn) {
  infoGetKeyBtn.addEventListener("click", openGetKeyFree);
}

const menuBtn = document.getElementById("menuBtn");
const closeInfo = document.getElementById("closeInfo");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    if (infoPanel) infoPanel.classList.add("active");
    if (overlay) overlay.classList.remove("hidden");
  });
}

if (closeInfo) {
  closeInfo.addEventListener("click", closeAll);
}

if (overlay) {
  overlay.addEventListener("click", closeAll);
}

function closeAll() {
  if (infoPanel) infoPanel.classList.remove("active");
  if (overlay) overlay.classList.add("hidden");

  if (versionModal) {
    versionModal.classList.add("hidden");
    versionModal.setAttribute("aria-hidden", "true");
  }

  if (boostModal) {
    boostModal.classList.add("hidden");
    boostModal.setAttribute("aria-hidden", "true");
  }

  if (crosshairModal) {
    crosshairModal.classList.add("hidden");
    crosshairModal.setAttribute("aria-hidden", "true");
  }
}

function openModal(modal) {
  if (!modal) return;

  modal.classList.remove("hidden");
  if (overlay) overlay.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");

  const hasOpenModal =
    (versionModal && !versionModal.classList.contains("hidden")) ||
    (boostModal && !boostModal.classList.contains("hidden")) ||
    (crosshairModal && !crosshairModal.classList.contains("hidden")) ||
    (infoPanel && infoPanel.classList.contains("active"));

  if (!hasOpenModal && overlay) {
    overlay.classList.add("hidden");
  }
}

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeModal(versionModal);
    closeModal(boostModal);
    closeModal(crosshairModal);
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

function openVersionModal() {
  openModal(versionModal);
}

function runBoost() {
  if (!terminal || !boostDone) return;

  terminal.textContent = "";
  boostDone.classList.add("hidden");
  openModal(boostModal);

  let index = 0;

  const timer = setInterval(() => {
    terminal.textContent += terminalLines[index] + "\\n";
    index++;

    if (index >= terminalLines.length) {
      clearInterval(timer);

      setTimeout(() => {
        boostDone.classList.remove("hidden");
      }, 450);
    }
  }, 380);
}

actions.forEach((card) => {
  card.addEventListener("click", () => {
    const action = card.dataset.action;
    card.classList.toggle("active");

    if (action === "crosshair") {
      openModal(crosshairModal);
      showToast("Tâm ảo đã sẵn sàng");
      return;
    }

    if (action === "aimbody") {
      showToast(
        card.classList.contains("active")
          ? "Đã bật AIMBODY"
          : "Đã tắt AIMBODY"
      );

      if (statusText) {
        statusText.textContent = "AIMBODY simulation activated!";
      }

      return;
    }

    if (action === "boost") {
      runBoost();
      showToast("Đã bật BOST RAM");
      return;
    }

    if (action === "headlock" || action === "reg") {
      openVersionModal();
      showToast("Chọn phiên bản Free Fire");
      return;
    }

    if (action === "fix") {
      showToast(
        card.classList.contains("active")
          ? "Đã bật FIX RUNG"
          : "Đã tắt FIX RUNG"
      );

      if (statusText) {
        statusText.textContent = "FIX RUNG activated successfully!";
      }
    }
  });
});

document.querySelectorAll(".version-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".version-btn").forEach((item) =>
      item.classList.remove("active")
    );

    btn.classList.add("active");

    localStorage.setItem(STORAGE.VERSION, btn.dataset.version);

    if (statusText) {
      statusText.textContent = `${btn.dataset.version} selected. HeadLock Jame ready!`;
    }

    if (onBtn) onBtn.classList.add("active");
    if (offBtn) offBtn.classList.remove("active");
  });
});

const successBtn = document.getElementById("successBtn");
const dangerBtn = document.getElementById("dangerBtn");

if (successBtn) {
  successBtn.addEventListener("click", () => {
    if (statusText) statusText.textContent = "HeadLock Was Successful!";
    if (onBtn) onBtn.classList.add("active");
    if (offBtn) offBtn.classList.remove("active");

    closeModal(versionModal);
    showToast("HeadLock bật thành công");
  });
}

if (dangerBtn) {
  dangerBtn.addEventListener("click", () => {
    if (statusText) statusText.textContent = "HeadLock turned off";
    if (offBtn) offBtn.classList.add("active");
    if (onBtn) onBtn.classList.remove("active");

    closeModal(versionModal);
    showToast("Đã tắt HeadLock");
  });
}

if (onBtn) {
  onBtn.addEventListener("click", () => {
    onBtn.classList.add("active");
    if (offBtn) offBtn.classList.remove("active");
    if (statusText) statusText.textContent = "Panel is ON";

    openVersionModal();
  });
}

if (offBtn) {
  offBtn.addEventListener("click", () => {
    offBtn.classList.add("active");
    if (onBtn) onBtn.classList.remove("active");
    if (statusText) statusText.textContent = "Panel is OFF";

    showToast("Đã tắt HEADLOCK");
  });
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

if (crosshairSize && crosshairColor) {
  crosshairSize.addEventListener("input", updateCrosshairPreview);
  crosshairColor.addEventListener("input", updateCrosshairPreview);
  updateCrosshairPreview();
}

// ================= REAL ANDROID CROSSHAIR =================

const crosshairOnBtn = document.getElementById("crosshairOnBtn");
const crosshairOffBtn = document.getElementById("crosshairOffBtn");

function hasAndroidBridge() {
    return typeof AndroidBridge !== "undefined";
}

function updateNativeCrosshair() {

    if (!crosshairSize || !crosshairColor) return;

    const size = parseInt(crosshairSize.value, 10);
    const color = crosshairColor.value;

    updateCrosshairPreview();

    localStorage.setItem("crosshair_size", size);
    localStorage.setItem("crosshair_color", color);

    if (
        hasAndroidBridge() &&
        typeof AndroidBridge.updateCrosshair === "function"
    ) {
        AndroidBridge.updateCrosshair(size, color);
    }

}

function loadCrosshair() {

    const size = localStorage.getItem("crosshair_size");
    const color = localStorage.getItem("crosshair_color");

    if (size) {
        crosshairSize.value = size;
    }

    if (color) {
        crosshairColor.value = color;
    }

    updateNativeCrosshair();

}

if (crosshairSize) {

    crosshairSize.addEventListener("input", updateNativeCrosshair);

}

if (crosshairColor) {

    crosshairColor.addEventListener("input", updateNativeCrosshair);

}

if (crosshairOnBtn) {

    crosshairOnBtn.addEventListener("click", () => {

        updateNativeCrosshair();

        if (
            hasAndroidBridge() &&
            typeof AndroidBridge.startCrosshair === "function"
        ) {

            AndroidBridge.startCrosshair();

            showToast("Đã bật tâm ảo");

        } else {

            showToast("Chỉ hoạt động trong app Android");

        }

    });

}

if (crosshairOffBtn) {

    crosshairOffBtn.addEventListener("click", () => {

        if (
            hasAndroidBridge() &&
            typeof AndroidBridge.stopCrosshair === "function"
        ) {

            AndroidBridge.stopCrosshair();

            showToast("Đã tắt tâm ảo");

        }

    });

}

loadCrosshair();

startExpireWatcher();
autoLogin();

