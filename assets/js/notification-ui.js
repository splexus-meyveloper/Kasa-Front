const _DISMISSED_KEY = "dismissedNotifs";
let _currentNotifMessages = [];

function _getDismissed() {
  try { return new Set(JSON.parse(sessionStorage.getItem(_DISMISSED_KEY) || "[]")); }
  catch { return new Set(); }
}

async function loadHeaderNotifications() {
  const container = document.getElementById("notifList");
  if (!container) return;

  const badge = document.getElementById("notificationCount");

  // Finansal bildirimler sadece ADMIN'e gösterilir
  if (sessionStorage.getItem("role") !== "ADMIN") {
    if (badge) badge.style.display = "none";
    const notifBtn = document.querySelector(".notif-btn");
    if (notifBtn) notifBtn.style.display = "none";
    return;
  }

  let list = await notificationStore.build();

  // Daha önce kapatılanları filtrele
  const dismissed = _getDismissed();
  list = list.filter(n => !dismissed.has(n.message));
  _currentNotifMessages = list.map(n => n.message);

  if (badge) {
    badge.innerText = list.length;
    badge.style.display = list.length ? "inline-block" : "none";
  }

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<div class='p-2 text-muted'>Bildirim yok</div>";
    return;
  }

  list.forEach(n => {
    let icon = "";
    if (n.level === "danger") {
      icon = "⚠️";
    } else if (n.level === "warning") {
      icon = "⏰";
    } else {
      icon = "ℹ️";
    }

    container.innerHTML += `
      <div class="notif-item notif-${n.level}">
        <span style="margin-right:6px;">${icon}</span>
        ${escapeHtml(n.message)}
      </div>
    `;
  });

  container.innerHTML += `
    <div style="padding:10px 14px;border-top:1px solid rgba(255,255,255,.07);text-align:center">
      <button onclick="clearNotifications()"
        style="width:100%;padding:7px 14px;border-radius:7px;border:1px solid rgba(255,255,255,.12);
               background:rgba(255,255,255,.05);color:#94a3b8;font-size:12px;cursor:pointer;
               transition:background .2s"
        onmouseover="this.style.background='rgba(255,255,255,.1)'"
        onmouseout="this.style.background='rgba(255,255,255,.05)'">
        <i class="zmdi zmdi-delete"></i> Bildirimleri Temizle
      </button>
    </div>`;
}

function clearNotifications() {
  const dismissed = _getDismissed();
  _currentNotifMessages.forEach(m => dismissed.add(m));
  sessionStorage.setItem(_DISMISSED_KEY, JSON.stringify([...dismissed]));

  const container = document.getElementById("notifList");
  if (container) container.innerHTML = "<div class='p-2 text-muted' style='padding:12px;font-size:13px;color:#64748b'>Bildirim yok</div>";
  const badge = document.getElementById("notificationCount");
  if (badge) badge.style.display = "none";
  _currentNotifMessages = [];
}

window.loadHeaderNotifications = loadHeaderNotifications;
window.clearNotifications = clearNotifications;
