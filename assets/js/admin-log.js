function actionBadge(action){

const map = {

CASH_INCOME: '<span class="badge badge-success">Kasa Giriş</span>',
CASH_EXPENSE: '<span class="badge badge-danger">Kasa Çıkış</span>',

CHECK_IN: '<span class="badge badge-primary">Çek Giriş</span>',
CHECK_COLLECT: '<span class="badge badge-success">Çek Tahsil</span>',
CHECK_ENDORSE: '<span class="badge badge-warning">Çek Ciro</span>',

NOTE_IN: '<span class="badge badge-primary">Senet Giriş</span>',
NOTE_COLLECT: '<span class="badge badge-success">Senet Tahsil</span>',
NOTE_ENDORSE: '<span class="badge badge-warning">Senet Ciro</span>',

LOAN_CREATE: '<span class="badge badge-primary">Kredi Ekleme</span>',

EXPENSE_ADD: '<span class="badge badge-danger">Masraf</span>'

};

return map[action] || action;

}

function translateAction(action){

    const map = {

        CASH_INCOME: "Kasa Giriş",
        CASH_EXPENSE: "Kasa Çıkış",

        CHECK_IN: "Çek Giriş",
        CHECK_COLLECT: "Çek Tahsil Edildi",
        CHECK_ENDORSE: "Çek Ciro Edildi",

        NOTE_IN: "Senet Giriş",
        NOTE_COLLECT: "Senet Tahsil Edildi",
        NOTE_ENDORSE: "Çek Ciro Edildi",

        LOAN_CREATE: "Kredi Ekleme",
        LOAN_INSTALLMENT: "Kredi Ödeme",
        EXPENSE_ADD: "Masraf",

    };

    return map[action] || action;

}

console.log("ADMIN LOG JS YÜKLENDİ");

function initAdminLogs(){

    const table = document.getElementById("kasaTableBody");

    if(!table) return;

    console.log("KASA TABLE BULUNDU");

    loadMovements();

}

async function loadMovements(page = 0, start = "", end = "", action = "", username = "", q = ""){

    const token = localStorage.getItem("token");

    if(action === "LOAN_INSTALLMENT"){
        action = "CASH_EXPENSE";
        q = "kredi taksiti";
    }

    let url = `http://localhost:8080/api/audit-logs?page=${page}&size=20`;

    if(start) url += `&start=${start}T00:00:00`;
    if(end) url += `&end=${end}T23:59:59`;
    if(action) url += `&action=${action}`;
    if(username) url += `&username=${username}`;
    if(q) url += `&q=${q}`;

    const res = await fetch(url,{
        headers:{
            "Authorization":"Bearer " + token
        }
    });

    const data = await res.json();

    renderTable(data.content || data.data || []);
}

function renderTable(list){

if(!list) return;

const tbody = document.getElementById("kasaTableBody");

tbody.innerHTML = "";

list.forEach(item => {

    const tr = document.createElement("tr");

    const isIncome = item.action === "CASH_INCOME"
              || item.action === "CHECK_IN"
              || item.action === "CHECK_COLLECT"
              || item.action === "NOTE_IN"
              || item.action === "NOTE_COLLECT"
              || item.action === "LOAN_CREATE";

const icon = isIncome ? "▲" : "▼";

const amountClass = isIncome ? "text-success" : "text-danger";

    const formattedAmount =
    (isIncome ? "+" : "-") +
    Number(item.amount).toLocaleString("tr-TR", {
        minimumFractionDigits:2
    }) + " TL";

    const date =
        new Date(item.createdAt)
        .toLocaleString("tr-TR");

    tr.innerHTML = `
        <td>${date}</td>
        <td>${item.username}</td>
        <td>${actionBadge(item.action)}</td>
        <td>${item.description ?? "-"}</td>
        <td class="text-end ${amountClass}">
            ${icon} ${formattedAmount}
        </td>
    `;

    tbody.appendChild(tr);

});

}

let adminLogsLoaded = false;

const adminLogInterval = setInterval(() => {
    const table = document.getElementById("kasaTableBody");

    if (table && !adminLogsLoaded) {
        adminLogsLoaded = true;
        console.log("KASA TABLE BULUNDU");
        loadMovements();
        clearInterval(adminLogInterval);
    }
}, 500);

function applyFilter(){

    const startDate = document.getElementById("filterStartDate").value;
    const endDate = document.getElementById("filterEndDate").value;
    const type = document.getElementById("filterType").value;
    const user = document.getElementById("filterUser").value;

    loadMovements(0, startDate, endDate, type, user);
}

function clearFilter(){

    document.getElementById("filterStartDate").value = "";
    document.getElementById("filterEndDate").value = "";
    document.getElementById("filterType").value = "";
    document.getElementById("filterUser").value = "";

    loadMovements();
}

function initAdminLogs(){

    const table = document.getElementById("kasaTableBody");

    if(!table) return;

    if(table.dataset.loaded === "true") return;

    table.dataset.loaded = "true";

    loadMovements();
    loadUsers(); // 🔥 kullanıcı dropdownu doldur

}

setInterval(initAdminLogs, 300);

async function loadUsers() {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:8080/api/admin/profiles", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const users = await res.json();

    const select = document.getElementById("filterUser");
    if (!select) return;

    select.innerHTML = '<option value="">Tümü</option>';

    users.forEach(u => {
        
        const option = document.createElement("option");
        option.value = u.username;
        option.textContent = u.username;
        select.appendChild(option);
    });
    
}

