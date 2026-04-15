async function initUserFilter() {

  const select = document.getElementById("userFilterSelect");
  const box = document.getElementById("userFilterBox");

  if (!select || !box) return;

  const jwt = JSON.parse(atob(localStorage.getItem("token").split('.')[1]));
  const role = jwt.role;

  // 👤 USER → hiçbir şey gösterme
  if (role !== "ADMIN") {
    box.style.display = "none";
    return;
  }

  // 👑 ADMIN → göster
  box.style.display = "block";

  // kullanıcıları çek
  const res = await fetch(`${API_BASE}/admin/profiles`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) return;

  const users = await res.json();

  // dropdown temizle
  select.innerHTML = `<option value="">Tüm Kullanıcılar</option>`;

  users.forEach(u => {
    select.insertAdjacentHTML("beforeend",
      `<option value="${u.id}">${u.username}</option>`
    );
  });

  // seçim değişince dashboard yenile
  select.addEventListener("change", () => {
  const userId = select.value || null;
  initDashboard(userId);
});
}

async function loadDashboardWithFilter() {

  const select = document.getElementById("userFilterSelect");
  const userId = select?.value;

  let url = `${API_BASE}/api/dashboard`;

  if (userId) {
    url += `?userId=${userId}`;
  }

  const res = await fetch(url, {
    headers: getAuthHeaders()
  });

  if (!res.ok) return;

  const data = await res.json();

  // 🔥 senin mevcut dashboard update fonksiyonun
  initDashboard();

  // chart da yenile
  loadChartWithFilter(userId);
}

async function loadChartWithFilter(userId) {

  let url = `${API_BASE}/api/dashboard/chart`;

  if (userId) {
    url += `?userId=${userId}`;
  }

  const res = await fetch(url, {
    headers: getAuthHeaders()
  });

  if (!res.ok) return;

  const data = await res.json();

  updateChartUI(data);
}


window.initUserFilter = initUserFilter;