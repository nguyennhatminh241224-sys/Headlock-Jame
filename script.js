// ================= HEADLOCK JAME CONFIG =================
const API_BASE = "";
const MAINTENANCE_MODE = false;

if (MAINTENANCE_MODE) {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.innerHTML = `<div style="position:fixed;inset:0;display:flex;justify-content:center;align-items:center;background:#07090f;color:white;font-family:Arial,sans-serif;text-align:center;padding:20px;"><div><div style="font-size:70px;font-weight:bold;color:#00d4ff;margin-bottom:20px;">HEADLOCK</div><h2 style="margin:0 0 15px">APP ĐANG NÂNG CẤP</h2><p style="opacity:.8">Phiên bản mới đang được cập nhật.<br>Vui lòng quay lại sau.</p></div></div>`;
  });
  throw new Error("Maintenance");
}

const GET_KEY_FREE_URL = "https://link4m.net/LrM89eO";
const CONTACT_ZALO = "https://zalo.me/0333635135";
const PASSWORDS = ["0333635135", "JameFF", "VIP2026", "Headlock"];
const EXPIRE_CODE = "MjAyNi0wNy0yNVQyMzo1OTo1OQ=="; // 25/07/2026

function getExpireDateTime() {
  try { return atob(EXPIRE_CODE); } catch { return "1970-01-01T00:00:00"; }
}

const STORAGE = { DEVICE: "hl-dev-id", KEY: "hl-key", SESSION: "hl-unlocked", VERSION: "hl-ff-ver" };

const passwordScreen = document.getElementById("passwordScreen");
const mainApp = document.getElementById("mainApp");
const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");
const togglePassword = document.getElementById("togglePassword");
const logoutBtn = document.getElementById("logoutBtn");
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

const terminalLines = ["$ Initializing BOST RAM...", "$ Scanning system memory...", "$ Clearing cache files...", "$ Optimizing RAM allocation...", "$ Applying performance boost...", "$ Finalizing optimization..."];

function getDeviceId() {
  let id = localStorage.getItem(STORAGE.DEVICE);
  if (!id) { id = "JAME-" + Date.now().toString(36).toUpperCase(); localStorage.setItem(STORAGE.DEVICE, id); }
  return id;
}

function setLoginMessage(type, text) { passwordError.className = "message " + (type || ""); passwordError.textContent = text; }
function showToast(text) { toast.textContent = text; toast.classList.add("active"); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => toast.classList.remove("active"), 1800); }
function formatDate(v) { if (!v) return "vĩnh viễn"; return new Date(v).toLocaleString("vi-VN"); }

function unlockApp(msg = "Đã mở khóa") {
  document.body.classList.add("unlocked"); passwordScreen.classList.add("hidden"); mainApp.classList.remove("locked"); logoutBtn.classList.remove("hidden"); licenseText.textContent = msg; sessionStorage.setItem(STORAGE.SESSION, "true");
}

function lockApp() {
  document.body.classList.remove("unlocked"); passwordScreen.classList.remove("hidden"); mainApp.classList.add("locked"); logoutBtn.classList.add("hidden"); passwordInput.value = ""; sessionStorage.removeItem(STORAGE.SESSION); localStorage.removeItem(STORAGE.KEY); setLoginMessage("", "Zalo hỗ trợ: 0333635135");
}

async function loginWithValue(val) {
  if (PASSWORDS.includes(val)) {
    const expire = new Date(getExpireDateTime());
    if (new Date() > expire) throw new Error("Key đã hết hạn.");
    localStorage.setItem(STORAGE.KEY, val); unlockApp("Hết hạn: " + formatDate(expire)); return;
  }
  throw new Error("Sai mật khẩu. Vui lòng thử lại.");
}

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault(); const val = passwordInput.value.trim();
  try { await loginWithValue(val); passwordInput.value = ""; } catch (err) { setLoginMessage("err", err.message); }
});

togglePassword.addEventListener("click", () => {
  const isPass = passwordInput.type === "password"; passwordInput.type = isPass ? "text" : "password"; togglePassword.textContent = isPass ? "🙈" : "👁";
});

logoutBtn.addEventListener("click", lockApp);
document.getElementById("contactBtn").addEventListener("click", () => window.open(CONTACT_ZALO, "_blank"));
document.getElementById("getKeyBtn").addEventListener("click", () => window.open(GET_KEY_FREE_URL, "_blank"));

document.getElementById("menuBtn").addEventListener("click", () => { infoPanel.classList.add("active"); overlay.classList.remove("hidden"); });
document.getElementById("closeInfo").addEventListener("click", closeAll);
overlay.addEventListener("click", closeAll);

function closeAll() {
  infoPanel.classList.remove("active"); overlay.classList.add("hidden");
  [versionModal, boostModal, crosshairModal].forEach(m => { if(m){ m.classList.add("hidden"); m.setAttribute("aria-hidden", "true"); } });
}

function openModal(m) { if (!m) return; m.classList.remove("hidden"); overlay.classList.remove("hidden"); m.setAttribute("aria-hidden", "false"); }
function closeModal(m) { if (!m) return; m.classList.add("hidden"); m.setAttribute("aria-hidden", "true"); if (versionModal.classList.contains("hidden") && boostModal.classList.contains("hidden") && (!crosshairModal || crosshairModal.classList.contains("hidden")) && !infoPanel.classList.contains("active")) overlay.classList.add("hidden"); }

document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => { closeModal(versionModal); closeModal(boostModal); closeModal(crosshairModal); }));

actions.forEach(card => {
  card.addEventListener("click", () => {
    const act = card.dataset.action; if (act !== "crosshair") card.classList.toggle("active");
    if (act === "crosshair") { openModal(crosshairModal); return; }
    if (act === "boost") {
      terminal.textContent = ""; boostDone.classList.add("hidden"); openModal(boostModal); let idx = 0;
      let t = setInterval(() => { terminal.textContent += terminalLines[idx] + "\n"; idx++; if(idx>=terminalLines.length){ clearInterval(t); setTimeout(()=>boostDone.classList.remove("hidden"), 450); } }, 300);
      return;
    }
    if (act === "headlock" || act === "reg") { openModal(versionModal); return; }
    showToast("Đã thực thi tác vụ: " + act.toUpperCase());
  });
});

function updateCrosshairPreview() {
  if (!crosshairDot) return; const sz = crosshairSize.value + "px", clr = crosshairColor.value;
  crosshairDot.style.width = sz; crosshairDot.style.height = sz; crosshairDot.style.borderColor = clr; crosshairDot.style.boxShadow = `0 0 16px ${clr}`;
}
if (crosshairSize) { ["input", "change"].forEach(ev => { crosshairSize.addEventListener(ev, updateCrosshairPreview); crosshairColor.addEventListener(ev, updateCrosshairPreview); }); updateCrosshairPreview(); }

// ================= XỬ LÝ OVERLAY TÂM ẢO VÀO GAME (ANDROID APK NATIVE) =================
const btnToggleOverlay = document.getElementById("btnToggleOverlay");
const crosshairFeatureCard = document.querySelector('[data-action="crosshair"]');

if (btnToggleOverlay) {
  btnToggleOverlay.addEventListener("click", () => {
    const isActive = btnToggleOverlay.classList.contains("active-overlay");
    const size = parseInt(crosshairSize.value) || 34;
    const color = crosshairColor.value || "#00ff88";

    if (!isActive) {
      if (window.AndroidBridge && window.AndroidBridge.toggleOverlay) {
        window.AndroidBridge.toggleOverlay(true, size, color);
        btnToggleOverlay.classList.add("active-overlay");
        btnToggleOverlay.innerText = "✕ TẮT OVERLAY GAME";
        btnToggleOverlay.style.background = "#ff4a4a";
        if (crosshairFeatureCard) crosshairFeatureCard.classList.add("active");
        closeModal(crosshairModal);
        showToast("Đã kích hoạt Overlay Tâm Ảo!");
      } else {
        showToast("Lỗi: Chỉ chạy được tính năng này trên App APK!");
      }
    } else {
      if (window.AndroidBridge && window.AndroidBridge.toggleOverlay) {
        window.AndroidBridge.toggleOverlay(false, 0, "");
      }
      btnToggleOverlay.classList.remove("active-overlay");
      btnToggleOverlay.innerText = "KÍCH HOẠT OVERLAY VÀO GAME";
      btnToggleOverlay.style.background = "#00ff88";
      if (crosshairFeatureCard) crosshairFeatureCard.classList.remove("active");
      showToast("Đã gỡ Overlay Tâm Ảo");
    }
  });
}
