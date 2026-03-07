/*********************************
 * GLOBAL CONFIG
 *********************************/
const API_BASE = "http://localhost:8080";

function getToken() {
    return localStorage.getItem("token");
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
    };
}


/*********************************
 * SPA PAGE LOADER
 *********************************/
async function loadPage(page) {

    const content = document.getElementById("pageContent");
    if (!content) return;

    /* önce eski sayfayı temizle */
    if (typeof currentPageDestroy === "function") {
        try {
            currentPageDestroy();
        } catch (err) {
            console.warn("Page destroy error:", err);
        }
        currentPageDestroy = null;
    }

    /* fade out */
    content.style.opacity = "0";

    const res = await fetch(page);
    const html = await res.text();

    /* yeni sayfayı yükle */
    content.innerHTML = html;

    /* fade in */
    requestAnimationFrame(() => {
        content.style.opacity = "1";
    });

    /* sayfa init */
    if (page.includes("kullanicilar")) {
        currentPageDestroy = initUsersPage();
    }

    if (page.includes("krediler")) {
        currentPageDestroy = initKredilerPage();
    }

}

/*********************************
 * MENU (TEK SEFER)
 *********************************/
async function loadMenuOnce() {
    if (menuLoaded) return;

    const res = await fetch("menu.html");
    const html = await res.text();
    document.getElementById("menuContainer").innerHTML = html;

    // 🔥 MENÜ EVENTLERİ
    bindMenuEvents();

    menuLoaded = true;
}

    // 🔁 SPA LINKLER
    document.querySelectorAll("a[data-page]").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();
            loadPage(a.getAttribute("data-page"));
        });
    });



/*********************************
 * USERS
 *********************************/
function initUsersPage() {

    loadUsers();

    return function destroyUsersPage() {
        const tbody = document.getElementById("userTable");
        if (tbody) tbody.innerHTML = "";
    };

}

async function loadUsers() {
    const tbody = document.getElementById("userTable");
    if (!tbody) return;

    const res = await fetch(`${API_BASE}/api/admin/profiles`, {
        headers: authHeaders()
    });

    if (!res.ok) {
        showToast("Kullanıcılar yüklenemedi.","error");
        return;
    }

    const users = await res.json();
    tbody.innerHTML = "";

    users.forEach(u => {
        const tr = document.createElement("tr");
        tr.className = "user-row";

        tr.innerHTML = `
<td class="user-name">${u.username}</td>

<td>
<span class="role-badge ${u.role === "ADMIN" ? "role-admin" : "role-user"}">
${u.role}
</span>
</td>

<td>
<button class="button button-danger button-sm">Sil</button>
</td>
`;

        tr.addEventListener("click", () => editUser(u.id, u.username));

        tr.querySelector("button").addEventListener("click", e => {
            e.stopPropagation();
            deleteUser(u.id);
        });

        tbody.appendChild(tr);
    });
}

async function addUser() {
    const username = document.getElementById("newUsername")?.value;
    const password = document.getElementById("newUserPassword")?.value;

    if (!username || !password) {
        showToast("Alanlar boş.","error");
        return;
    }

    const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            username: username,
            password: password
        })
    });

    if (!res.ok) {
        showToast("Kullanıcı eklenemedi.","error");
        return;
    }

    showToast("Kullanıcı eklendi.", "success");
    loadUsers();
}


async function editUser(id, username) {

    editingUserId = id;

    const tbody = document.getElementById("userTable");
    const rows = tbody.querySelectorAll("tr");

    // Önce açık permission satırı varsa kapat
    const existing = document.querySelector(".permission-row");

if (existing) {

    const sameUser = existing.dataset.userid == id;

    // animasyonu başlat
    existing.classList.remove("show");

    setTimeout(() => {
        existing.remove();

        // Eğer aynı kullanıcıya tıklanmışsa sadece kapat
        if (sameUser) return;

        // Eğer farklı kullanıcıysa yeni panel açılacak
        createPermissionRow();
    }, 300);

    return;
}

    // Yetkileri getir
    const res = await fetch(`${API_BASE}/api/admin/users/${id}/permissions`, {
        headers: authHeaders()
    });

    const perms = await res.json();

    // Kullanıcı satırını bul
    let targetRow = null;
    rows.forEach(r => {
        if (r.querySelector("td")?.innerText === username) {
            targetRow = r;
        }
    });

    if (!targetRow) return;

    // Yeni permission satırı oluştur
    const permRow = document.createElement("tr");
    permRow.className = "permission-row";
    permRow.dataset.userid = id;

    permRow.innerHTML = `
<td colspan="3" style="padding:0; border:none;">

<div class="permission-content">

    <div class="permission-grid">

        ${checkbox("KASA", perms)}
        ${checkbox("CEK", perms)}
        ${checkbox("SENET", perms)}
        ${checkbox("MASRAF", perms)}
        ${checkbox("KREDILER", perms)}
        ${checkbox("KULLANICI_YONETIMI", perms)}

    </div>

    <div class="permission-actions">
        <button class="button button-primary button-sm">
            Yetkileri Kaydet
        </button>
    </div>

</div>

</td>
`;

    targetRow.after(permRow);

    setTimeout(() => {
    permRow.classList.add("show");
}, 10);

    permRow.querySelector("button").addEventListener("click", async () => {

        const selected = [];
        permRow.querySelectorAll("input[type=checkbox]").forEach(cb => {
            if (cb.checked) selected.push(cb.value);
        });

        await fetch(`${API_BASE}/api/admin/users/${id}/permissions`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ permissions: selected })
        });

        showToast("Yetkiler kaydedildi.","success");
    });
}

function checkbox(code, perms) {

    const permissionLabels = {
        "KASA": "Kasa",
        "CEK": "Çek",
        "SENET": "Senet",
        "MASRAF": "Masraf",
        "KREDILER": "Krediler",
        "KULLANICI_YONETIMI": "Kullanıcı Yönetimi"
    };

    const checked = perms.includes(code) ? "checked" : "";
    const label = permissionLabels[code] || code;

    return `
        <label style="margin-right:25px;">
            <input type="checkbox" value="${code}" ${checked}>
            ${label}
        </label>
    `;
}

async function deleteUser(id){

    showConfirmToast(
        "Kullanıcı pasif yapılsın mı?",
        async ()=>{

            try{
                const res = await fetch(
                    `${API_BASE}/api/admin/users/${id}`,
                    {
                        method:"DELETE",
                        headers:authHeaders()
                    }
                );

                if(!res.ok){
                    showToast("Silme başarısız.","error");
                    return;
                }

                showToast("Kullanıcı pasif yapıldı.","success");
                loadUsers();

            }catch(err){
                showToast("Sunucuya ulaşılamıyor.","error");
            }
        }
    );
}



/*********************************
 * KREDİLER (şimdilik init)
 *********************************/
function initKredilerPage() {
    console.log("Krediler sayfası yüklendi");
}
