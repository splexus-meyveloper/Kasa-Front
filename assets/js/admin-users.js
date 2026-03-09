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

    const tbody = document.getElementById("userTable");
    if(!tbody) return;

    const res = await fetch(
        "http://localhost:8080/api/admin/profiles",
        {
            headers:{
                "Authorization":"Bearer " + localStorage.getItem("token")
            }
        }
    );

    if(!res.ok){
        showToast("Kullanıcılar yüklenemedi","error");
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
<button class="button button-danger button-sm deleteUserBtn">
Sil
</button>
</td>
`;

        // kullanıcıya tıklayınca permission panel
        tr.addEventListener("click", () => {
            editUser(u.id, u.username);
        });

        // sil butonu
        tr.querySelector(".deleteUserBtn").addEventListener("click", e => {

            e.stopPropagation();
            deleteUser(u.id);

        });

        tbody.appendChild(tr);

    });

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

    const res = await fetch(
        "http://localhost:8080/api/auth/register",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer " + localStorage.getItem("token")
            },
            body:JSON.stringify({
                username,
                password
            })
        }
    );

    if(!res.ok){

        showToast("Kullanıcı eklenemedi","error");
        return;

    }

    showToast("Kullanıcı eklendi","success");

    loadUsers();

}


/*********************************
 * DELETE USER
 *********************************/
async function deleteUser(id){

    showConfirmToast(
        "Kullanıcı silinsin mi?",
        async () => {

            const res = await fetch(
                `http://localhost:8080/api/admin/users/${id}`,
                {
                    method:"DELETE",
                    headers:{
                        "Authorization":"Bearer " + localStorage.getItem("token")
                    }
                }
            );

            if(!res.ok){

                showToast("Silme başarısız","error");
                return;

            }

            showToast("Kullanıcı pasif yapıldı","success");

            loadUsers();

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

    const res = await fetch(
        `http://localhost:8080/api/admin/users/${id}/permissions`,
        {
            headers:{
                "Authorization":"Bearer " + localStorage.getItem("token")
            }
        }
    );

    const perms = await res.json();

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

    const res = await fetch(
        `http://localhost:8080/api/admin/users/${userId}/permissions`,
        {
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                permissions: perms
            })
        }
    );

    if(!res.ok){
        showToast("Yetkiler kaydedilemedi","error");
        return;
    }

    showToast("Yetkiler kaydedildi","success");
}