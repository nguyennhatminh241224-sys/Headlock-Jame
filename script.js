// ================= HEADLOCK JAME CONFIG =================
const API_BASE = "";

// ================= MAINTENANCE =================
const MAINTENANCE_MODE = false; // false = hoạt động | true = bảo trì

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
          <div style="
            font-size:70px;
            font-weight:bold;
            color:#00d4ff;
            margin-bottom:20px;
          ">
            HEADLOCK
          </div>

          <h2 style="margin:0 0 15px">
            APP ĐANG NÂNG CẤP
          </h2>

          <p style="opacity:.8">
            Phiên bản mới đang được cập nhật.<br>
            Vui lòng quay lại sau.
          </p>

          <div style="
            margin-top:25px;
            color:#00ff88;
            font-size:14px;
          ">
            © HEADLOCK JAME
          </div>
        </div>
      </div>
    `;
  });

  throw new Error("Maintenance");
}

const GET_KEY_FREE_URL = "https://link4m.net/LrM89eO";
const CONTACT_ZALO = "https://zalo.me/0333635135";

const PASSWORDS = [
  "0333635135",
  "JameFF",
  "VIP2026",
  "Headlock"
];

// Hết hạn: 25/07/2026 23:59:59
const EXPIRE_CODE = "MjAyNi0wNy0yNVQyMzo1OTo1OQ==";

function getExpireDateTime() {
  try {
    return atob(EXPIRE_CODE);
  } catch {
    return "1970-01-01T00:00:00";
  }
}

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
  let deviceId = localStorage.getItem(STORAGE.DEVICE);

  if (!deviceId) {
    deviceId =
      "JAME-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 10).toUpperCase();

    localStorage.setItem(STORAGE.DEVICE, deviceId);
  }

  return deviceId;
}

function setLoginMessage(type, text) {
  passwordError.className = "message " + (type || "");
  passwordError.textContent = text;
}

function showToast(text) {
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
    throw new Error("Không kết nối được API");
  }

  return await res.json();
}

function unlockApp(message = "Đã mở khóa") {
  document.body.classList.add("unlocked");
  passwordScreen.classList.add("hidden");
  mainApp.classList.remove("locked");
  logoutBtn.classList.remove("hidden");
  licenseText.textContent = message;

  sessionStorage.setItem(STORAGE.SESSION, "true");
}

function lockApp() {
  document.body.classList.remove("unlocked");
  passwordScreen.classList.remove("hidden");
  mainApp.classList.add("locked");
  logoutBtn.classList.add("hidden");
  passwordInput.value = "";

  sessionStorage.removeItem(STORAGE.SESSION);
  localStorage.removeItem(STORAGE.KEY);
  setLoginMessage("", "Zalo hỗ trợ: 0333635135");
}

async function loginWithValue(value) {
  if (API_BASE && API_BASE.startsWith("http")) {
    setLoginMessage("", "Đang kiểm tra key online...");
    const result = await checkKeyOnline(value);

    if (result.success) {
      localStorage.setItem(STORAGE.KEY, value);
      unlockApp("Key hết hạn: " + formatDate(result.expiresAt));
      return;
    }

    throw new Error(result.message || "Key không hợp lệ");
  }

  if (PASSWORDS.includes(value)) {
    const expireDateTime = getExpireDateTime();
    const expire = new Date(expireDateTime);

    if (Number.isNaN(expire.getTime())) {
      throw new Error("Ngày giờ hết hạn không hợp lệ.");
    }

    if (new Date() > expire) {
      localStorage.removeItem(STORAGE.KEY);
      sessionStorage.removeItem(STORAGE.SESSION);
      throw new Error("Key đã hết hạn.");
    }

    localStorage.setItem(STORAGE.KEY, value);
    unlockApp("Hết hạn: " + formatDate(expireDateTime));
    return;
  }

  throw new Error("Sai mật khẩu. Vui lòng thử lại.");
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
  setInterval(() => {
    const savedKey = localStorage.getItem(STORAGE.KEY);

    if (!savedKey) return;
    if (!PASSWORDS.includes(savedKey)) return;

    const expireDateTime = getExpireDateTime();
    const expire = new Date(expireDateTime);

    if (Number.isNaN(expire.getTime())) return;

    if (new Date() > expire) {
      lockApp();
      setLoginMessage("err", "Key đã hết hạn. Vui lòng lấy key mới.");
    }
  }, 1000);
}

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

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "🙈" : "👁";
});

logoutBtn.addEventListener("click", lockApp);
contactBtn.addEventListener("click", () => window.open(CONTACT_ZALO, "_blank"));

function openGetKeyFree() {
  window.open(GET_KEY_FREE_URL, "_blank");
}

getKeyBtn.addEventListener("click", openGetKeyFree);
infoGetKeyBtn.addEventListener("click", openGetKeyFree);

document.getElementById("menuBtn").addEventListener("click", () => {
  infoPanel.classList.add("active");
  overlay.classList.remove("hidden");
});

document.getElementById("closeInfo").addEventListener("click", closeAll);
overlay.addEventListener("click", closeAll);

function closeAll() {
  infoPanel.classList.remove("active");
  overlay.classList.add("hidden");

  versionModal.classList.add("hidden");
  boostModal.classList.add("hidden");

  versionModal.setAttribute("aria-hidden", "true");
  boostModal.setAttribute("aria-hidden", "true");

  if (crosshairModal) {
    crosshairModal.classList.add("hidden");
    crosshairModal.setAttribute("aria-hidden", "true");
  }
}

function openModal(modal) {
  if (!modal) return;

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");

  if (
    !versionModal.classList.contains("hidden") ||
    !boostModal.classList.contains("hidden") ||
    (crosshairModal && !crosshairModal.classList.contains("hidden")) ||
    infoPanel.classList.contains("active")
  ) {
    return;
  }

  overlay.classList.add("hidden");
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
  terminal.textContent = "";
  boostDone.classList.add("hidden");
  openModal(boostModal);

  let index = 0;

  const timer = setInterval(() => {
    terminal.textContent += terminalLines[index] + "\n";
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
      showToast("Mở tâm ảo mô phỏng");
      return;
    }

    if (action === "aimbody") {
      showToast(card.classList.contains("active") ? "Đã bật AIMBODY" : "Đã tắt AIMBODY");
      statusText.textContent = "AIMBODY simulation activated!";
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
      showToast(card.classList.contains("active") ? "Đã bật FIX RUNG" : "Đã tắt FIX RUNG");
      statusText.textContent = "FIX RUNG activated successfully!";
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
    statusText.textContent = `${btn.dataset.version} selected. HeadLock Jame ready!`;
    onBtn.classList.add("active");
    offBtn.classList.remove("active");
  });
});

document.getElementById("successBtn").addEventListener("click", () => {
  statusText.textContent = "HeadLock Was Successful!";
  onBtn.classList.add("active");
  offBtn.classList.remove("active");
  closeModal(versionModal);
  showToast("HeadLock bật thành công");
});

document.getElementById("dangerBtn").addEventListener("click", () => {
  statusText.textContent = "HeadLock turned off";
  offBtn.classList.add("active");
  onBtn.classList.remove("active");
  closeModal(versionModal);
  showToast("Đã tắt HeadLock");
});

onBtn.addEventListener("click", () => {
  onBtn.classList.add("active");
  offBtn.classList.remove("active");
  statusText.textContent = "Panel is ON";
  openVersionModal();
});

offBtn.addEventListener("click", () => {
  offBtn.classList.add("active");
  onBtn.classList.remove("active");
  statusText.textContent = "Panel is OFF";
  showToast("Đã tắt HEADLOCK");
});

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

startExpireWatcher();
autoLogin();
