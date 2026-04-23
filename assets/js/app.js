// ==============================
// APP CORE
// ==============================

function initAppShell() {
  checkPagePermission();

  const role = sessionStorage.getItem("role");
  const adminDashboard = document.getElementById("adminDashboard");
  const userWelcome = document.getElementById("userWelcome");

  if (role === "USER") {
    if (adminDashboard) adminDashboard.style.display = "none";
    if (userWelcome) userWelcome.style.display = "block";
  } else {
    if (adminDashboard) adminDashboard.style.display = "block";
    if (userWelcome) userWelcome.style.display = "none";
  }

  const username = sessionStorage.getItem("username");
  const headerEl = document.getElementById("headerUserName");
  const dropdownEl = document.getElementById("dropdownUserName");

  if (username) {
    if (headerEl) headerEl.textContent = username;
    if (dropdownEl) dropdownEl.textContent = username;
  }
}

function initApp() {
  initAppShell();

  if (window.loadPage) {
    loadPage("dashboard.html");
  }

  _showLoginNotifications();
}

// ==============================
// DARK MODE
// ==============================

function applyDarkMode(dark) {
  document.body.classList.toggle("dark-mode", dark);
  const icon = document.getElementById("darkModeIcon");
  if (icon) {
    icon.className = dark ? "zmdi zmdi-sun" : "zmdi zmdi-brightness-2";
  }
}

function toggleDarkMode() {
  const isDark = !document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDark ? "1" : "0");
  applyDarkMode(isDark);
  // Chart varsa yeniden çiz — renkleri dark/light modda güncelle
  if (window.loadChart) loadChart();
}

async function _showLoginNotifications() {
  if (!sessionStorage.getItem("justLoggedIn")) return;
  sessionStorage.removeItem("justLoggedIn");

  const show = async () => {
    try {
      const list = await notificationStore.build();
      if (!list.length) return;

      const iconMap  = { danger: "⚠️", warning: "⏰", info: "ℹ️" };
      const colorMap = { danger: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };

      const rows = list.map(n => `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
          <span style="font-size:18px;line-height:1.3">${iconMap[n.level] || "ℹ️"}</span>
          <span style="color:${colorMap[n.level] || "#e0e0e0"};font-size:13.5px;line-height:1.5">${escapeHtml(n.message)}</span>
        </div>`).join("");

      const popup = document.createElement("div");
      popup.id = "loginNotifPopup";
      popup.className = "kasa-modal active";
      popup.innerHTML = `
        <div class="kasa-modal-overlay" onclick="document.getElementById('loginNotifPopup').remove()"></div>
        <div class="kasa-modal-card" style="max-width:460px">
          <button class="kasa-modal-close" onclick="document.getElementById('loginNotifPopup').remove()">×</button>
          <div class="kasa-modal-header">
            <div class="kasa-modal-icon" style="background:rgba(239,68,68,.15)">
              <i class="zmdi zmdi-notifications" style="color:#ef4444"></i>
            </div>
            <div>
              <h3 class="kasa-modal-title">Bildirimler</h3>
              <div class="kasa-modal-subtitle">${list.length} yaklaşan veya gecikmiş ödeme</div>
            </div>
          </div>
          <div style="padding:0 4px 4px">${rows}</div>
          <div class="kasa-modal-footer">
            <button class="button button-primary" onclick="document.getElementById('loginNotifPopup').remove()">Tamam</button>
          </div>
        </div>`;
      document.body.appendChild(popup);
    } catch {}
  };

  if (window._appVisible) {
    show();
  } else {
    document.addEventListener("appVisible", show, { once: true });
  }
}

window.toggleDarkMode = toggleDarkMode;
window.initAppShell = initAppShell;
window.initApp = initApp;

document.addEventListener("DOMContentLoaded", function () {
  applyDarkMode(localStorage.getItem("darkMode") === "1");
  initApp();
  wsClient.connect();

  // Admin header user dropdown'ını sayfa geçişi beklemeden doldur
  setTimeout(() => {
    if (window.initUserFilter) initUserFilter();
  }, 800);
});