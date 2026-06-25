const PASSWORDS = [
    "0333635135",
    "JameFF",
    "VIP2026",
    "Headlock"
];
const passwordScreen = document.getElementById('passwordScreen');
const mainApp = document.getElementById('mainApp');
const passwordForm = document.getElementById('passwordForm');
const passwordInput = document.getElementById('passwordInput');
const passwordError = document.getElementById('passwordError');
const togglePassword = document.getElementById('togglePassword');

function unlockApp() {
  document.body.classList.add('unlocked');
  mainApp.classList.remove('locked');
  sessionStorage.setItem('headlock-jame-unlocked', 'true');
}

if (sessionStorage.getItem('headlock-jame-unlocked') === 'true') {
  unlockApp();
}

passwordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = passwordInput.value.trim();

  if (value === APP_PASSWORD) {
    passwordError.textContent = '';
    passwordInput.value = '';
    unlockApp();
    return;
  }

  passwordError.textContent = 'Sai mật khẩu. Vui lòng thử lại.';
  passwordInput.select();
  passwordForm.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }],
    { duration: 260, iterations: 1 }
  );
});

togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePassword.textContent = isPassword ? '🙈' : '👁';
});

const actions = document.querySelectorAll('.action-card');
const versionModal = document.getElementById('versionModal');
const boostModal = document.getElementById('boostModal');
const terminal = document.getElementById('terminal');
const boostDone = document.getElementById('boostDone');
const statusText = document.getElementById('statusText');
const mainToggle = document.getElementById('mainToggle');

const terminalLines = [
  '$ Initializing BOST RAM optimization...',
  '$ Scanning system memory...',
  '$ Clearing cache files...',
  '$ Optimizing RAM allocation...',
  '$ Freeing up memory blocks...',
  '$ Applying performance boost...',
  '$ Finalizing optimization...'
];

function openModal(modal) {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function runBoost() {
  terminal.textContent = '';
  boostDone.classList.add('hidden');
  openModal(boostModal);

  let index = 0;
  const timer = setInterval(() => {
    terminal.textContent += terminalLines[index] + '\n';
    index++;

    if (index >= terminalLines.length) {
      clearInterval(timer);
      setTimeout(() => boostDone.classList.remove('hidden'), 450);
    }
  }, 420);
}

actions.forEach(button => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;

    if (action === 'boost') {
      runBoost();
      return;
    }

    if (action === 'headlock' || action === 'reg') {
      openModal(versionModal);
      return;
    }

    if (action === 'fix') {
      statusText.textContent = 'FIX RUNG activated successfully!';
      mainToggle.checked = true;
    }
  });
});

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    closeModal(versionModal);
    closeModal(boostModal);
  });
});

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal(modal);
  });
});

document.querySelectorAll('.version-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    statusText.textContent = `${btn.dataset.version} selected. HeadLock Jame ready!`;
    mainToggle.checked = true;
  });
});

document.querySelector('.success').addEventListener('click', () => {
  statusText.textContent = 'HeadLock Was Successful!';
  mainToggle.checked = true;
  closeModal(versionModal);
});

document.querySelector('.danger').addEventListener('click', () => {
  statusText.textContent = 'HeadLock turned off';
  mainToggle.checked = false;
  closeModal(versionModal);
});

mainToggle.addEventListener('change', () => {
  statusText.textContent = mainToggle.checked ? 'Panel is ON' : 'Panel is OFF';
});
