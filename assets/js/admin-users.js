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

    content.style.opacity = "0";

    const res = await fetch(page);
    const html = await res.text();
    content.innerHTML = html;

    requestAnimationFrame(() => {
        content.style.opacity = "1";
    });

    // Sayfaya özel init
    if (page.includes("kullanicilar")) initUsersPage();
    if (page.includes("krediler")) initKredilerPage();
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
function bindMenuEvents() {

    // SUB MENU AÇ / KAPA
    document.querySelectorAll(".has-sub-menu > a").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();
            const li = a.parentElement;
            li.classList.toggle("open");

            const sub = li.querySelector(".side-header-sub-menu");
            if (sub) {
                sub.style.display =
                    sub.style.display === "block" ? "none" : "block";
            }
        });
    });

    // 🔁 SPA LINKLER
    document.querySelectorAll("a[data-page]").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();
            loadPage(a.getAttribute("data-page"));
        });
    });
}


/*********************************
 * USERS
 *********************************/
let editingUserId = null;

function initUsersPage() {
    loadUsers();
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
            <td>${u.username}</td>
            <td>${u.role}</td>
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

    document.getElementById("editUserBox").style.display = "block";
    document.getElementById("editUsernameTitle").innerText = username + " yetkileri";

    const res = await fetch(`${API_BASE}/api/admin/users/${id}/permissions`, {
        headers: authHeaders()
    });

    const perms = await res.json();

    setCheck("edit_kasa", perms.includes("KASA"));
    setCheck("edit_cek", perms.includes("CEK"));
    setCheck("edit_senet", perms.includes("SENET"));
    setCheck("edit_masraf", perms.includes("MASRAF"));
    setCheck("edit_krediler", perms.includes("KREDILER"));
    setCheck("edit_kullanici", perms.includes("KULLANICI_YONETIMI"));
}

function setCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = val;
}

async function savePermissions() {
    if (!editingUserId) return;

    const perms = [];
    if (edit_kasa.checked) perms.push("KASA");
    if (edit_cek.checked) perms.push("CEK");
    if (edit_senet.checked) perms.push("SENET");
    if (edit_masraf.checked) perms.push("MASRAF");
    if (edit_krediler.checked) perms.push("KREDILER");
    if (edit_kullanici.checked) perms.push("KULLANICI_YONETIMI");

    await fetch(`${API_BASE}/api/admin/users/${editingUserId}/permissions`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ permissions: perms })
    });

    showToast("Yetkiler kaydedildi.","success");
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
