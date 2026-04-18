async function initUserFilter() {
  const select = document.getElementById("userFilterSelect");
  const box = document.getElementById("userFilterBox");

  if (!select || !box) return;

  if (!window.authStore) {
    console.error("authStore bulunamadı");
    return;
  }

  if (!window.adminStore) {
    console.error("adminStore bulunamadı");
    return;
  }

  const role = authStore.getRole();

  if (role !== "ADMIN") {
    box.style.display = "none";
    return;
  }

  box.style.display = "block";

  try {
    const users = await adminStore.fetchProfiles();

    select.innerHTML = `<option value="">Tüm Kullanıcılar</option>`;

    users.forEach((u) => {
      select.insertAdjacentHTML(
        "beforeend",
        `<option value="${escapeHtml(String(u.id))}">${escapeHtml(u.username)}</option>`
      );
    });

    if (!select.dataset.bound) {
      select.addEventListener("change", () => {
        const userId = select.value || null;

        if (window.initDashboard) {
          initDashboard(userId);
        }
      });

      select.dataset.bound = "true";
    }
  } catch (err) {
    console.error("User filter error:", err);
    showToast(err.message || "Kullanıcı filtresi yüklenemedi", "error");
  }
}

window.initUserFilter = initUserFilter;