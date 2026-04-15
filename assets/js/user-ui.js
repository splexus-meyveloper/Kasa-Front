function loadUsersSafe(){

    console.log("SAFE LOAD USERS");

    const container = document.getElementById("pageContent");
    if(!container){
        console.error("PAGE CONTENT YOK");
        return;
    }

    const tbody = container.querySelector("#userTable");
    if(!tbody){
        console.error("TBODY BULUNAMADI");
        return;
    }

    fetch("http://localhost:8080/api/admin/profiles", {
        headers:{
            "Authorization":"Bearer " + localStorage.getItem("token")
        }
    })
    .then(async res => {
        if(!res.ok){
            throw new Error("API hata: " + res.status);
        }
        return res.json();
    })
    .then(data => {

        const users = Array.isArray(data) ? data : (Array.isArray(data.content) ? data.content : []);

        console.log("USERS:", users);

        tbody.innerHTML = "";

        users.forEach(u => {

            const tr = document.createElement("tr");
            tr.className = "user-row";
            tr.dataset.id = String(u.id);   // KRİTİK

            const username = u.username || u.userName || "-";
            const role = u.role || "USER";

            tr.innerHTML = `
                <td class="user-name">${username}</td>
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

    const res = await fetch(`${API_BASE}/admin/users/${userId}/role?role=${newRole}`, {
        method: "PUT",
        headers: {
            "Authorization":"Bearer " + localStorage.getItem("token")
        }
    });

    if (res.ok) {
        showToast("Rol güncellendi","success");
    } else {
        showToast("Rol güncellenemedi","error");
    }
});

            tr.addEventListener("click", (e) => {

    if (e.target.closest(".roleSelect")) return;
    if (e.target.closest(".deleteUserBtn")) return;

    editUser(u.id, username);
});

            tr.querySelector(".deleteUserBtn").addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteUser(u.id);
            });

            tbody.appendChild(tr);
        });
    })
    .catch(err => {
        console.error("LOAD USERS SAFE ERROR:", err);
        showToast("Kullanıcılar yüklenemedi","error");
    });
}

// ==============================
// ENTER FUNCTİON
// ==============================

document.addEventListener("keydown", function(e){

    if(e.key !== "Enter") return;

    const target = e.target;

    // 🔥 SADECE kullanıcı sayfasında çalış
    const userPage = document.getElementById("kullanicilarPage");

    if(userPage){

        if(
            target.id === "newUsername" ||
            target.id === "newUserPassword"
        ){
            e.preventDefault();
            addUser();
        }

    } else {

        // 🔥 DİĞER SAYFALARDA FORM SUBMIT ENGELLE
        if(target.tagName === "INPUT"){
            e.preventDefault();
        }

    }

});

window.loadUsersSafe = loadUsersSafe;