// ==============================
// USERS UI MODULE
// ==============================

// 🔒 Auth kontrolü
if (!authStore.isLoggedIn()) {
  window.location.href = "login.html";
}

// Şube cache
let _companyMap = {}; // { id: name }

async function _loadCompanyMap() {
  try {
    const companies = await adminApi.getCompanies();
    if (companies && companies.length) {
      companies.forEach(c => { _companyMap[c.id] = c.name; });
    }
  } catch (e) {
    console.warn("Şubeler yüklenemedi:", e.message);
  }
}

/*********************************
 * LOAD USERS
 *********************************/
async function loadUsersSafe() {
  console.log("SAFE LOAD USERS");

  const container = document.getElementById("pageContent");
  if (!container) {
    console.error("PAGE CONTENT YOK");
    return;
  }

  const tbody = container.querySelector("#userTable");
  if (!tbody) {
    console.error("TBODY BULUNAMADI");
    return;
  }

  try {
    const rawUsers = await adminStore.fetchProfiles();

    const users = Array.isArray(rawUsers)
      ? rawUsers
      : Array.isArray(rawUsers?.content)
      ? rawUsers.content
      : [];

    tbody.innerHTML = "";

    if (!users.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center;">Kullanıcı bulunamadı</td>
        </tr>
      `;
      return;
    }

    users.forEach((u) => {
      const tr = document.createElement("tr");
      tr.className = "user-row";
      tr.dataset.id = String(u.id);

      const username = u.username || u.userName || "-";
      const role = u.role || "USER";

      const subeName = _companyMap[u.companyId] || `Şube #${u.companyId || "?"}`;
      tr.innerHTML = `
        <td class="user-name">${escapeHtml(username)}</td>
        <td style="font-size:12px;color:#94a3b8">${escapeHtml(subeName)}</td>
        <td>
          <select class="roleSelect" data-id="${u.id}">
            <option value="USER" ${role === "USER" ? "selected" : ""}>USER</option>
            <option value="ADMIN" ${role === "ADMIN" ? "selected" : ""}>ADMIN</option>
          </select>
        </td>
        <td>
          <button type="button" class="btn-delete deleteUserBtn">Sil</button>
        </td>
      `;

      // 🎯 Rol değiştir
      tr.querySelector(".roleSelect").addEventListener("change", async (e) => {
        const newRole = e.target.value;
        const userId = e.target.dataset.id;

        try {
          await adminStore.updateUserRole(userId, newRole);
          showToast("Rol güncellendi", "success");
        } catch (err) {
          showToast("Rol güncellenemedi", "error");
        }
      });

      // 🗑️ Sil
      tr.querySelector(".deleteUserBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await deleteUser(u.id);
      });

      // 👁️ Detay (yetkiler)
      tr.addEventListener("click", (e) => {
        if (e.target.closest(".roleSelect")) return;
        if (e.target.closest(".deleteUserBtn")) return;

        editUser(u.id, username);
      });

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("LOAD USERS SAFE ERROR:", err);
    showToast("Kullanıcılar yüklenemedi", "error");
  }
}

/*********************************
 * ADD USER
 *********************************/
async function addUser() {
  const username  = document.getElementById("newUsername")?.value?.trim();
  const password  = document.getElementById("newUserPassword")?.value?.trim();
  const companyId = document.getElementById("newUserCompany")?.value;

  if (!username || !password) {
    showToast("Kullanıcı adı ve şifre zorunludur", "error");
    return;
  }

  if (!/^[0-9]{4}$/.test(password)) {
    showToast("Şifre tam olarak 4 rakam olmalıdır", "error");
    return;
  }

  try {
    await adminStore.createUser({
      username,
      password,
      role: "USER",
      companyId: companyId ? Number(companyId) : null
    });

    showToast("Kullanıcı eklendi", "success");
    document.getElementById("newUsername").value = "";
    document.getElementById("newUserPassword").value = "";
    loadUsersSafe();

  } catch (e) {
    const msg = e?.message || "";
    if (msg.includes("USER_ALREADY_EXISTS")) {
      showToast("Bu kullanıcı adı zaten var", "error");
    } else {
      showToast("Kullanıcı eklenemedi: " + msg, "error");
    }
  }
}

/*********************************
 * DELETE USER
 *********************************/
async function deleteUser(id) {
  showConfirmToast("Kullanıcı silinsin mi?", async () => {

    const tbody = document.querySelector("#pageContent #userTable");
    const row = tbody?.querySelector(`tr[data-id="${id}"]`);

    try {
      await adminStore.deleteUser(id);
    } catch (e) {
      showToast("Silme başarısız", "error");
      return;
    }

    showToast("Kullanıcı pasif yapıldı", "success");

    if (row) {
  row.classList.add("removing");

  setTimeout(() => {
    row.remove();
  }, 300);
    } else {
      loadUsersSafe();
    }
  });
}

/*********************************
 * EDIT USER PERMISSIONS
 *********************************/
async function editUser(id, username) {
  try {
    const tbody = document.getElementById("userTable");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");

    const existing = document.querySelector(".permission-row");

    if (existing) {
  const content = existing.querySelector(".permission-content");
  // aynı kullanıcıya tekrar tıklandıysa highlight kaldır
if (existing.dataset.userid == id) {
  const rows = document.querySelectorAll(".user-row");
  rows.forEach(r => r.classList.remove("active"));
}
  
  if (content) {
    content.classList.remove("open");

    setTimeout(() => {
      existing.remove();
    }, 300);
  } else {
    existing.remove();
  }

  if (existing.dataset.userid == id) return;
}

    const perms = await adminStore.fetchUserPermissions(id);

    // data-id ile bul — innerText eşleşme sorunu olmaz
    const targetRow = tbody.querySelector(`tr[data-id="${id}"]`);

    // Tüm satırlardan active kaldır
    tbody.querySelectorAll("tr").forEach(r => r.classList.remove("active"));
    if (!targetRow) return;
    targetRow.classList.add("active");

    const permRow = document.createElement("tr");
    permRow.className = "permission-row";
    permRow.dataset.userid = id;

    permRow.innerHTML = `
<td colspan="4">
  <div class="permission-content">
    <div class="permission-grid">
      ${checkbox("KASA", perms)}
      ${checkbox("CEK", perms)}
      ${checkbox("SENET", perms)}
      ${checkbox("MASRAF", perms)}
      ${checkbox("KREDILER", perms)}
      ${checkbox("BANKA", perms)}
      ${checkbox("KULLANICI_YONETIMI", perms)}
    </div>
    <button class="savePermBtn">Kaydet</button>
  </div>
</td>
`;

    targetRow.after(permRow);

    setTimeout(() => {
  permRow.querySelector(".permission-content")?.classList.add("open");
}, 10);

    permRow
      .querySelector(".savePermBtn")
      .addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        savePermissions(id);
      });

  } catch (err) {
    console.error("EDIT USER ERROR:", err);
    showToast("Yetkiler yüklenemedi", "error");
  }
}

/*********************************
 * CHECKBOX
 *********************************/
function checkbox(code, perms) {
  const labels = {
    KASA: "Kasa",
    CEK: "Çek",
    SENET: "Senet",
    MASRAF: "Masraf",
    KREDILER: "Krediler",
    BANKA: "Banka",
    KULLANICI_YONETIMI: "Kullanıcı Yönetimi",
  };

  const safePerms = Array.isArray(perms) ? perms : [];

  return `
    <label>
      <input type="checkbox" value="${code}" ${safePerms.includes(code) ? "checked" : ""}>
      ${labels[code]}
    </label>
  `;
}

/*********************************
 * SAVE PERMISSIONS
 *********************************/
async function savePermissions(userId) {
  const row = document.querySelector(".permission-row");
  if (!row) return;

  const checkboxes = row.querySelectorAll("input[type=checkbox]");
  const perms = [];

  checkboxes.forEach((c) => {
    if (c.checked) perms.push(c.value);
  });

  try {
    await adminStore.updateUserPermissions(userId, perms);
    showToast("Yetkiler kaydedildi", "success");
  } catch (err) {
    console.error("SAVE PERMISSIONS ERROR:", err);
    showToast("Kaydedilemedi", "error");
  }
}

/*********************************
 * ENTER HANDLER (SADECE USER PAGE)
 *********************************/
function bindUserEnterHandler() {

  const container = document.getElementById("pageContent");
  if (!container) return;

  container.addEventListener("keydown", function (e) {

    if (e.key !== "Enter") return;

    const target = e.target;

    if (
      target.id === "newUsername" ||
      target.id === "newUserPassword"
    ) {
      e.preventDefault();
      addUser();
    }

  });
}

/*********************************
 * INIT
 *********************************/
async function initUsersPage() {
  console.log("initUsersPage ÇALIŞTI");

  await _loadCompanyMap();
  await _loadCompanyDropdown();
  loadUsersSafe();
  bindUserEnterHandler();

  if (window.initUserFilter) {
    initUserFilter();
  }
}

async function _loadCompanyDropdown() {
  const select = document.getElementById("newUserCompany");
  if (!select) return;
  const companies = Object.entries(_companyMap);
  if (companies.length === 0) {
    select.innerHTML = "<option value=''>Şube yüklenemedi</option>";
    return;
  }
  select.innerHTML = companies.map(([id, name]) =>
    `<option value="${id}">${escapeHtml(name)}</option>`
  ).join("");
}

/*********************************
 * EXPORTS
 *********************************/
window.loadUsersSafe = loadUsersSafe;
window.initUsersPage = initUsersPage;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.editUser = editUser;
window.savePermissions = savePermissions;