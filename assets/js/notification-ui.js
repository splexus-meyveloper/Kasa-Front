async function loadHeaderNotifications() {
  const container = document.getElementById("notifList");
  if (!container) return;

  const list = await notificationStore.build();

  const badge = document.getElementById("notificationCount");
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

    // 🔥 ICON SEÇİMİ
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
        ${n.message}
      </div>
    `;
  });
}

window.loadHeaderNotifications = loadHeaderNotifications;