if (!authStore.isLoggedIn()) {
    window.location.href = "login.html";
}

// Şube listesi cache
let _companies = [];

/*********************************
 * USERS PAGE INIT
 *********************************/
async function initUsersPage() {
    await loadCompanies();
    loadUsers();

    return function destroyUsersPage() {
        const tbody = document.getElementById("userTable");
        if (tbody) tbody.innerHTML = "";
        _companies = [];
    };
}

/*********************************
 * ŞUBELERİ YÜKLE
 *********************************/
async function loadCompanies() {
    const select = document.getElementById("newUserCompany");
    if (!select) return;

    try {
        const companies = await adminApi.getCompanies();
        if (companies && companies.length > 0) {
            _companies = companies;
            select.innerHTML = companies.map(c =>
                `<option value="${c.id}">${c.name} (${c.branchType === "MERKEZ" ? "Merkez" : "Şube"})</option>`
            ).join("");
            return;
        }
    } catch (e) {
        console.warn("getCompanies endpoint hatası, kullanıcı profillerinden şube bilgisi alınıyor:", e.message);
    }

    // Fallback: mevcut kullanıcıların companyId'lerinden şube listesini çıkar
    try {
        const users = await adminApi.getProfiles();
        const userList = Array.isArray(users) ? users : (users.content || []);
        const uniqueIds = [...new Set(userList.map(u => u.companyId).filter(Boolean))];

        if (uniqueIds.length > 0) {
            _companies = uniqueIds.map(id => ({ id, name: `Şube #${id}`, branchType: "SUBE" }));
            select.innerHTML = _companies.map(c =>
                `<option value="${c.id}">${c.name}</option>`
            ).join("");
            console.warn("Şube adları alınamadı, ID ile gösteriliyor. /api/admin/companies endpoint'ini kontrol edin.");
            return;
        }
    } catch (e2) {
        console.error("Şubeler hiç yüklenemedi:", e2);
    }

    select.innerHTML = "<option value=''>Şube yüklenemedi</option>";
}

/*********************************
 * LOAD USERS
 *********************************/
async function loadUsers() {
    try {
        const tbody = document.getElementById("userTable");
        if (!tbody) return;

        const data = await adminApi.getProfiles();
        const users = Array.isArray(data) ? data : (data.content || []);

        tbody.innerHTML = "";

        users.forEach(u => {
            const tr = document.createElement("tr");
            tr.setAttribute("data-id", u.id);

            const role = u.role || "USER";
            const subeName = _companies.find(c => c.id === u.companyId)?.name || `Şube #${u.companyId}`;

            tr.innerHTML = `
                <td class="user-name">${escapeHtml(u.username) || "-"}</td>
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

            tr.querySelector(".roleSelect").addEventListener("change", async (e) => {
                try {
                    await adminApi.updateUserRole(e.target.dataset.id, e.target.value);
                    showToast("Rol güncellendi", "success");
                } catch (e) {
                    showToast("Rol güncellenemedi: " + e.message, "error");
                }
            });

            tr.querySelector(".deleteUserBtn").addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteUser(u.id);
            });

            tr.addEventListener("click", (e) => {
                if (e.target.closest(".roleSelect")) return;
                if (e.target.closest(".deleteUserBtn")) return;
                editUser(u.id, u.username);
            });

            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error("LOAD USERS ERROR:", e);
    }
}

/*********************************
 * ADD USER
 *********************************/
async function addUser() {
    const username  = document.getElementById("newUsername")?.value?.trim();
    const password  = document.getElementById("newUserPassword")?.value?.trim();
    const companyId = document.getElementById("newUserCompany")?.value;

    if (!username || !password || !companyId) {
        showToast("Kullanıcı adı, şifre ve şube zorunludur", "error");
        return;
    }

    if (!/^[0-9]{4}$/.test(password)) {
        showToast("Şifre tam olarak 4 rakam olmalıdır", "error");
        return;
    }

    try {
        await adminApi.createUser({
            username,
            password,
            companyId: Number(companyId)
        });

        showToast("Kullanıcı oluşturuldu", "success");

        document.getElementById("newUsername").value = "";
        document.getElementById("newUserPassword").value = "";

        loadUsers();

    } catch (e) {
        showToast("Kullanıcı eklenemedi: " + e.message, "error");
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
            await adminApi.deactivateUser(id);
        } catch (e) {
            showToast("Silme başarısız: " + e.message, "error");
            return;
        }
        showToast("Kullanıcı pasif yapıldı", "success");
        if (row) {
            row.style.transition = "opacity 0.35s ease, transform 0.35s ease";
            row.style.opacity = "0";
            row.style.transform = "translateX(40px)";
            setTimeout(() => row.remove(), 350);
        } else {
            loadUsers();
        }
    });
}

/*********************************
 * EDIT USER PERMISSIONS
 *********************************/
async function editUser(id, username) {
    const tbody = document.getElementById("userTable");
    const existing = document.querySelector(".permission-row");

    if (existing) {
        existing.remove();
        if (existing.dataset.userid == id) return;
    }

    const perms = await adminApi.getUserPermissions(id);

    // data-id ile bul — innerText eşleşme sorunu olmaz
    const targetRow = tbody.querySelector(`tr[data-id="${id}"]`);
    if (!targetRow) return;

    const permRow = document.createElement("tr");
    permRow.className = "permission-row";
    permRow.dataset.userid = id;
    permRow.innerHTML = `
<td colspan="4" style="padding:0;border:none">
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
<div style="margin-top:15px">
<button class="button button-primary button-sm savePermBtn">Yetkileri Kaydet</button>
</div>
</div>
</td>`;

    targetRow.after(permRow);
    setTimeout(() => permRow.classList.add("show"), 10);
    permRow.querySelector(".savePermBtn").addEventListener("click", () => savePermissions(id));
}

function checkbox(code, perms) {
    const labels = {
        "KASA": "Kasa", "CEK": "Çek", "SENET": "Senet",
        "MASRAF": "Masraf", "KREDILER": "Krediler",
        "BANKA": "Banka", "KULLANICI_YONETIMI": "Kullanıcı Yönetimi"
    };
    return `<label style="margin-right:20px">
<input type="checkbox" value="${code}" ${perms.includes(code) ? "checked" : ""}>
${labels[code]}</label>`;
}

async function savePermissions(userId) {
    const row = document.querySelector(".permission-row");
    if (!row) return;
    const perms = [...row.querySelectorAll("input[type=checkbox]")]
        .filter(c => c.checked).map(c => c.value);
    try {
        await adminApi.setUserPermissions(userId, perms);
        showToast("Yetkiler kaydedildi", "success");
    } catch (e) {
        showToast("Yetkiler kaydedilemedi: " + e.message, "error");
    }
}
