function actionBadge(action){

const map = {

CASH_INCOME: '<span class="badge badge-success">Kasa Giriş</span>',
CASH_EXPENSE: '<span class="badge badge-danger">Kasa Çıkış</span>',

CHECK_IN: '<span class="badge badge-primary">Çek Giriş</span>',
CHECK_COLLECT: '<span class="badge badge-success">Çek Tahsil</span>',
CHECK_ENDORSE: '<span class="badge badge-warning">Çek Ciro</span>',
CHECK_OUT: '<span class="badge badge-warning">Çek Ödendi</span>',

NOTE_IN: '<span class="badge badge-primary">Senet Giriş</span>',
NOTE_COLLECT: '<span class="badge badge-success">Senet Tahsil</span>',
NOTE_ENDORSE: '<span class="badge badge-warning">Senet Ciro</span>',

LOAN_CREATE: '<span class="badge badge-primary">Kredi Ekleme</span>',

EXPENSE_ADD: '<span class="badge badge-danger">Masraf</span>',

CASH_UPDATE_REQUEST:  '<span class="badge badge-warning">Kasa Düzenleme</span>',
CHECK_UPDATE_REQUEST: '<span class="badge badge-warning">Çek Düzenleme</span>',
NOTE_UPDATE_REQUEST:  '<span class="badge badge-warning">Senet Düzenleme</span>',
LOAN_UPDATE_REQUEST:  '<span class="badge badge-warning">Kredi Düzenleme</span>'

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
        CHECK_OUT: "Çek Ödendi",

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

    // "Düzenlemeler" filtresi → ayrı endpoint
    if(action === "CASH_UPDATE_REQUEST"){
        return loadChangeRequests(token);
    }

    if(action === "LOAN_INSTALLMENT"){
        action = "CASH_EXPENSE";
        q = "kredi taksiti";
    }

    let url = `${API_BASE}/audit-logs?page=${page}&size=100`;

    if(start) url += `&start=${start}T00:00:00`;
    if(end) url += `&end=${end}T23:59:59`;
    if(action) url += `&action=${action}`;
    if(username) url += `&username=${username}`;
    if(q) url += `&q=${q}`;

    const res = await fetch(url,{
        headers:{ "Authorization":"Bearer " + token }
    });

    const data = await res.json();

    renderTable(data.content || data.data || []);
}

async function loadChangeRequests(token){

    const res = await fetch(`${API_BASE}/change-requests/all`, {
        headers:{ "Authorization":"Bearer " + token }
    });

    if(!res.ok){
        renderTable([]);
        return;
    }

    const list = await res.json();

    // audit-log formatına dönüştür
    const mapped = list.map(item => ({
        createdAt:   item.requestedAt,
        username:    item.requestedByUsername || ("ID:" + item.requestedBy),
        action:      item.entityType ? item.entityType + "_UPDATE_REQUEST" : "CASH_UPDATE_REQUEST",
        description: "Düzenleme isteği → " + (item.status || ""),
        amount:      null,
        _isChangeReq: true,
        _status:     item.status,
    }));

    renderTable(mapped);
}

const STATUS_BADGE = {
    PENDING:  '<span class="badge badge-warning">Beklemede</span>',
    APPROVED: '<span class="badge badge-success">Onaylandı</span>',
    REJECTED: '<span class="badge badge-danger">Reddedildi</span>',
};

function renderTable(list){

if(!list) return;

const tbody = document.getElementById("kasaTableBody");

tbody.innerHTML = "";

if(list.length === 0){
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:20px">Kayıt bulunamadı</td></tr>`;
    return;
}

list.forEach(item => {

    const tr = document.createElement("tr");
    tr.classList.add("user-row");

    const isChangeReq = !!item._isChangeReq;

    const isIncome = !isChangeReq && (
              item.action === "CASH_INCOME"
              || item.action === "CHECK_IN"
              || item.action === "CHECK_COLLECT"
              || item.action === "NOTE_IN"
              || item.action === "NOTE_COLLECT"
              || item.action === "LOAN_CREATE");

    const amountClass = isIncome ? "text-success" : "text-danger";

    const amountCell = isChangeReq
        ? (STATUS_BADGE[item._status] || "-")
        : `${isIncome ? "+" : "-"}${Number(item.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits:2 })} TL`;

    const date = new Date(item.createdAt).toLocaleString("tr-TR");

    tr.innerHTML = `
        <td>${date}</td>
        <td>${escapeHtml(item.username)}</td>
        <td>${actionBadge(item.action)}</td>
        <td>${escapeHtml(item.description) ?? "-"}</td>
        <td class="text-end ${isChangeReq ? "" : amountClass}">
            ${amountCell}
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

    const res = await fetch(API_BASE + "/admin/profiles", {
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

