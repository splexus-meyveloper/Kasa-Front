if (!authStore.isLoggedIn()) {
    window.location.href = "login.html";
}

/*********************************
 * USERS PAGE INIT
 *********************************/
function initUsersPage() {

    loadUsers();

    return function destroyUsersPage(){
        const tbody = document.getElementById("userTable");
        if(tbody) tbody.innerHTML = "";
    };

}


/*********************************
 * LOAD USERS
 *********************************/
async function loadUsers(){

    console.log("LOAD USERS ÇALIŞTI");

    try {

        const tbody = document.getElementById("userTable");
        if(!tbody){
            console.error("TABLO YOK");
            return;
        }

        console.log("FETCH ÖNCESİ");

        const data = await adminApi.getProfiles();

        console.log("FETCH SONRASI");
        console.log("DATA:", data);

        const users = Array.isArray(data) ? data : (data.content || []);

        console.log("USERS:", users);

        tbody.innerHTML = "";

        users.forEach(u => {

            const tr = document.createElement("tr");
            tr.setAttribute("data-id", u.id);

            const role = u.role || "USER";

            tr.innerHTML = `
                <td class="user-name">${escapeHtml(u.username) || "-"}</td>
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
                const newRole = e.target.value;
                const userId = e.target.dataset.id;

                try {
                    await adminApi.updateUserRole(userId, newRole);
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

    } catch(e) {
        console.error("LOAD USERS ERROR:", e);
    }
}

/*********************************
 * ADD USER
 *********************************/
async function addUser(){

    const username =
        document.getElementById("newUsername")?.value;

    const password =
        document.getElementById("newUserPassword")?.value;

    if(!username || !password){

        showToast("Alanlar boş","error");
        return;

    }

    try {
        await authApi.registerUser({
            username,
            password
        });

        showToast("Kullanıcı eklendi","success");
        loadUsersSafe();

    } catch(e){
        showToast("Kullanıcı eklenemedi: " + e.message,"error");
    }
}
  


/*********************************
 * DELETE USER
 *********************************/
async function deleteUser(id){

    showConfirmToast(
        "Kullanıcı silinsin mi?",
        async () => {

            const tbody = document.querySelector("#pageContent #userTable");
            const row = tbody ? tbody.querySelector(`tr[data-id="${id}"]`) : null;

            console.log("SILINECEK ROW:", row);

            try {
                await adminApi.deactivateUser(id);
            } catch(e){
                showToast("Silme başarısız: " + e.message,"error");
                return;
            }

            showToast("Kullanıcı pasif yapıldı","success");

            if(row){
                row.style.transition = "opacity 0.35s ease, transform 0.35s ease";
                row.style.opacity = "0";
                row.style.transform = "translateX(40px)";

                setTimeout(() => {
                    row.remove();
                }, 350);
            } else {
                loadUsersSafe();
            }
        }
    );
}

/*********************************
 * EDIT USER PERMISSIONS
 *********************************/
async function editUser(id, username){

    const tbody = document.getElementById("userTable");
    const rows = tbody.querySelectorAll("tr");

    const existing =
        document.querySelector(".permission-row");

    if(existing){

        existing.remove();

        if(existing.dataset.userid == id)
            return;

    }

    const perms = await adminApi.getUserPermissions(id);

    let targetRow = null;

    rows.forEach(r => {

        if(r.querySelector(".user-name")?.innerText === username){
            targetRow = r;
        }

    });

    if(!targetRow) return;

    const permRow = document.createElement("tr");
    permRow.className = "permission-row";
    permRow.dataset.userid = id;

    permRow.innerHTML = `
<td colspan="3" style="padding:0;border:none">

<div class="permission-content">

<div class="permission-grid">

${checkbox("KASA",perms)}
${checkbox("CEK",perms)}
${checkbox("SENET",perms)}
${checkbox("MASRAF",perms)}
${checkbox("KREDILER",perms)}
${checkbox("KULLANICI_YONETIMI",perms)}

</div>

<div style="margin-top:15px">

<button class="button button-primary button-sm savePermBtn">
Yetkileri Kaydet
</button>

</div>

</div>

</td>
`;

    targetRow.after(permRow);

setTimeout(()=>{
    permRow.classList.add("show");
},10);

permRow.querySelector(".savePermBtn")
    .addEventListener("click", () => {
        savePermissions(id);
    });

}


/*********************************
 * CHECKBOX HELPER
 *********************************/
function checkbox(code, perms){

    const labels = {
        "KASA":"Kasa",
        "CEK":"Çek",
        "SENET":"Senet",
        "MASRAF":"Masraf",
        "KREDILER":"Krediler",
        "KULLANICI_YONETIMI":"Kullanıcı Yönetimi"
    };

    const checked =
        perms.includes(code) ? "checked" : "";

    return `
<label style="margin-right:20px">
<input type="checkbox" value="${code}" ${checked}>
${labels[code]}
</label>
`;

}


/*********************************
 * SAVE PERMISSIONS
 *********************************/
async function savePermissions(userId){

    const row =
        document.querySelector(".permission-row");

    if(!row) return;

    const checkboxes =
        row.querySelectorAll("input[type=checkbox]");

    const perms = [];

    checkboxes.forEach(c => {
        if(c.checked) perms.push(c.value);
    });

    try {
    await adminApi.setUserPermissions(userId, perms);
} catch(e){
    showToast("Yetkiler kaydedilemedi: " + e.message,"error");
    return;
}

    showToast("Yetkiler kaydedildi","success");
}
