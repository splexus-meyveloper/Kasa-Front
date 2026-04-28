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

  const list = await notificationStore.build();

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
}

window.loadHeaderNotifications = loadHeaderNotifications;