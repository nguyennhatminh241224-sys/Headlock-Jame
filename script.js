// ================= HEADLOCK JAME CONFIG =================
// Nếu dùng API online riêng, đổi API_BASE thành link server của bạn.
// Ví dụ: const API_BASE = "https://headlock-jame-api.onrender.com";
// Nếu để rỗng "", web sẽ dùng mật khẩu offline trong PASSWORDS.
const API_BASE = "https://headlock-api.onrender.com";

// Link Get Key Free. Đổi link này thành trang get key của bạn.
const GET_KEY_FREE_URL = "https://link4m.net/LrM89eO";

const CONTACT_ZALO = "https://zalo.me/0333635135";

const PASSWORDS = {

  "VIP2026": {
      days:1,
      slot:200
  },

  "VIP30": {
      days:30,
      slot:100
  },

  "VIP365": {
      days:365,
      slot:20
  }

};

const STORAGE = {
  DEVICE: "headlock-jame-device-id",
  KEY: "headlock-jame-key",
  SESSION: "headlock-jame-unlocked",
  VERSION: "headlock-jame-freefire-version",
  EXPIRE: "headlock-jame-expire"
};

const KEY_DURATION = 24 * 60 * 60 * 1000; // 1 ngày

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
  localStorage.removeItem(STORAGE.EXPIRE);
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

  if (PASSWORDS[value]) {

   const days = PASSWORDS[value];

const expireTime =
    Date.now() + days * 24 * 60 * 60 * 1000;

    localStorage.setItem(STORAGE.KEY, value);
    localStorage.setItem(STORAGE.EXPIRE, expireTime);

   const expireDate = new Date(expireTime);

unlockApp(`
━━━━━━━━━━━━━━━━━━

🔓 LOGIN SUCCESS

🔑 Key : ${value}

⏳ Thời hạn : ${info.days} ngày

🕒 Hết hạn lúc :

${expireDate.toLocaleString("vi-VN")}

━━━━━━━━━━━━━━━━━━
`);

    return;
}

  throw new Error("Sai mật khẩu. Vui lòng thử lại.");
}

async function autoLogin() {
  const savedKey = localStorage.getItem(STORAGE.KEY);

  if (!savedKey || sessionStorage.getItem(STORAGE.SESSION) !== "true") {
    return;
  }

  const expire = Number(localStorage.getItem(STORAGE.EXPIRE));

  if (!expire || Date.now() > expire) {
    lockApp();
    return;
  }

  try {
    unlockApp(
      "Key hết hạn: " +
      new Date(expire).toLocaleString("vi-VN")
    );
  } catch {
    lockApp();
  }
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
}

function openModal(modal) {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  if (!versionModal.classList.contains("hidden") || !boostModal.classList.contains("hidden") || infoPanel.classList.contains("active")) {
    return;
  }
  overlay.classList.add("hidden");
}

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeModal(versionModal);
    closeModal(boostModal);
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
    document.querySelectorAll(".version-btn").forEach((item) => item.classList.remove("active"));
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

autoLogin();
