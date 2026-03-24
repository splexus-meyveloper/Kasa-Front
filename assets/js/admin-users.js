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

        const res = await fetch(
            "http://localhost:8080/api/admin/profiles",
            {
                headers:{
                    "Authorization":"Bearer " + localStorage.getItem("token")
                }
            }
        );

        console.log("FETCH SONRASI");

        if(!res.ok){
            console.error("API HATA:", res.status);
            return;
        }

        const data = await res.json();

        console.log("DATA:", data);

        const users = Array.isArray(data) ? data : (data.content || []);

        console.log("USERS:", users);

        tbody.innerHTML = "";

        users.forEach(u => {

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${u.username || "-"}</td>
                <td>${u.role || "USER"}</td>
                <td>X</td>
            `;

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

    loadUsersSafe();

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

            const res = await fetch(
                `http://localhost:8080/api/admin/users/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization":"Bearer " + localStorage.getItem("token")
                    }
                }
            );

            if(!res.ok){
                showToast("Silme başarısız","error");
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
                // satır bulunamazsa güvenli fallback
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