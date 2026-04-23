function actionBadge(action) {
    const map = {
        CASH_INCOME:  '<span class="badge badge-success">Kasa Giriş</span>',
        CASH_EXPENSE: '<span class="badge badge-danger">Kasa Çıkış</span>',
        CHECK_IN:     '<span class="badge badge-primary">Çek Giriş</span>',
        CHECK_COLLECT:'<span class="badge badge-success">Çek Tahsil</span>',
        CHECK_ENDORSE:'<span class="badge badge-warning">Çek Ciro</span>',
        CHECK_OUT:    '<span class="badge badge-warning">Çek Ödendi</span>',
        NOTE_IN:      '<span class="badge badge-primary">Senet Giriş</span>',
        NOTE_COLLECT: '<span class="badge badge-success">Senet Tahsil</span>',
        NOTE_ENDORSE: '<span class="badge badge-warning">Senet Ciro</span>',
        LOAN_CREATE:  '<span class="badge badge-primary">Kredi Ekleme</span>',
        EXPENSE_ADD:  '<span class="badge badge-danger">Masraf</span>',
    };
    return map[action] || `<span class="badge">${action}</span>`;
}

const CHANGE_REQUEST_ACTIONS = [
    "CASH_UPDATE_REQUEST",
    "CASH_UPDATE_REQUEST_CREATED",
    "CASH_UPDATE_REQUEST_APPROVED",
    "CASH_UPDATE_REQUEST_REJECTED",
    "CHECK_UPDATE_REQUEST",
    "CHECK_UPDATE_REQUEST_CREATED",
    "CHECK_UPDATE_REQUEST_APPROVED",
    "CHECK_UPDATE_REQUEST_REJECTED",
    "NOTE_UPDATE_REQUEST",
    "NOTE_UPDATE_REQUEST_CREATED",
    "NOTE_UPDATE_REQUEST_APPROVED",
    "NOTE_UPDATE_REQUEST_REJECTED",
    "LOAN_UPDATE_REQUEST",
    "LOAN_UPDATE_REQUEST_CREATED",
    "LOAN_UPDATE_REQUEST_APPROVED",
    "LOAN_UPDATE_REQUEST_REJECTED",
    "CHANGE_REQUEST",
    "PENDING",
];

function isChangeRequestItem(item) {
    if (item.source === "CHANGE_REQUEST") return true;
    if (!item.action) return false;
    return CHANGE_REQUEST_ACTIONS.includes(item.action)
        || item.action.includes("UPDATE_REQUEST");
}

const NORMAL_ACTIONS = new Set([
    "CASH_INCOME", "CASH_EXPENSE",
    "CHECK_IN", "CHECK_COLLECT", "CHECK_ENDORSE", "CHECK_OUT",
    "NOTE_IN", "NOTE_COLLECT", "NOTE_ENDORSE",
    "LOAN_CREATE", "EXPENSE_ADD",
]);

function renderMyActivities(list) {

    const tbody = document.getElementById("myActivitiesTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    // Audit kaydı (CASH_UPDATE_REQUEST_CREATED vb.) ile aynı entityId için
    // zaten CHANGE_REQUEST kaydı geliyor — audit kopyasını gizle.
    const filtered = list.filter(item =>
        !(item.source === "AUDIT" && (item.action || "").includes("UPDATE_REQUEST"))
    );

    let totalIncome = 0, totalExpense = 0;

    filtered.forEach(item => {

        const tr = document.createElement("tr");
        tr.classList.add("user-row");

        const isChangeReq = isChangeRequestItem(item);
        const isPending   = isChangeReq && (item.status === "PENDING"  || (item.action || "").includes("CREATED"));
        const isApproved  = isChangeReq && (item.status === "APPROVED" || (item.action || "").includes("APPROVED"));
        const isRejected  = isChangeReq && (item.status === "REJECTED" || (item.action || "").includes("REJECTED"));

        const isIncome = item.action === "CASH_INCOME"
            || item.action === "CHECK_IN"
            || item.action === "CHECK_COLLECT"
            || item.action === "NOTE_IN"
            || item.action === "NOTE_COLLECT"
            || item.action === "LOAN_CREATE";

        if (!isChangeReq) {
            const amount = Number(item.amount || 0);
            if (isIncome) totalIncome += amount;
            else totalExpense += amount;
        }

        // Düzenleme isteklerinde tutar gösterme — 0 TL sırıtmasın
        const amountCell = isChangeReq
            ? '<span style="color:#94a3b8;font-size:12px">—</span>'
            : `<span class="${isIncome ? "text-success" : "text-danger"}">
                 ${(isIncome ? "+" : "-") + Number(item.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
               </span>`;

        const date = new Date(item.createdAt || item.date || item.requestedAt).toLocaleString("tr-TR");

        let actionCell;
        if (isPending)       actionCell = '<span class="badge badge-warning">Onay Bekliyor</span>';
        else if (isApproved) actionCell = '<span class="badge badge-success">Onaylandı</span>';
        else if (isRejected) actionCell = '<span class="badge badge-danger">Reddedildi</span>';
        else                 actionCell = actionBadge(item.action);

        let statusCell;
        if (isPending)       statusCell = '<span class="badge badge-warning" style="font-size:11px">Beklemede</span>';
        else if (isApproved) statusCell = '<span class="badge badge-success" style="font-size:11px">Onaylandı</span>';
        else if (isRejected) statusCell = '<span class="badge badge-danger"  style="font-size:11px">Reddedildi</span>';
        else statusCell = `<button class="btn-modern btn-sm"
                             data-entity-id="${item.entityId}"
                             data-action="${item.action}"
                             data-amount="${item.amount}">
                             Düzenle
                           </button>`;

        tr.innerHTML = `
  <td style="font-weight:700;vertical-align:middle">${date}</td>
  <td class="text-center" style="vertical-align:middle">${actionCell}</td>
  <td class="td-desc" style="vertical-align:middle">${item.description || item.newDescription || "-"}</td>
  <td class="text-end" style="vertical-align:middle">${amountCell}</td>
  <td class="text-center" style="vertical-align:middle">${statusCell}</td>
`;
        if (!isChangeReq) {
            const btn = tr.querySelector("button");
            if (btn) {
                btn._item = item;
                btn.addEventListener("click", function () {
                    openEditModal(this._item);
                });
            }
        }

        tbody.appendChild(tr);
    });

    updateMyTotals(totalIncome, totalExpense);
}

function updateMyTotals(income, expense) {
    const bar = document.getElementById("myActivitiesTotals");
    if (!bar) return;
    const net = income - expense;
    const fmt = v => Math.abs(v).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
    document.getElementById("myTotalIncome").textContent  = "+" + fmt(income);
    document.getElementById("myTotalExpense").textContent = "-" + fmt(expense);
    const netEl = document.getElementById("myTotalNet");
    netEl.textContent = (net >= 0 ? "+" : "-") + fmt(net);
    netEl.className = "summary-value " + (net >= 0 ? "summary-pos" : "summary-neg");
    bar.style.display = "flex";
}

async function initMyActivitiesPage() {
    const data = await myActivityStore.load();
    renderMyActivities(data);
}

let currentEditId   = null;
let currentEditType = null;

const CHECK_ACTIONS = new Set(["CHECK_IN", "CHECK_COLLECT", "CHECK_ENDORSE", "CHECK_OUT"]);
const NOTE_ACTIONS  = new Set(["NOTE_IN",  "NOTE_COLLECT",  "NOTE_ENDORSE"]);

function openEditModal(item) {
    currentEditId   = item.entityId || item.id;
    currentEditType = item.action;

    const isCheck = CHECK_ACTIONS.has(item.action);
    const isNote  = NOTE_ACTIONS.has(item.action);

    // Başlık
    const title = document.getElementById("editModalTitle");
    if (title) title.textContent = isCheck ? "Çek Düzenle" : isNote ? "Senet Düzenle" : "İşlem Düzenle";

    // Alanları göster/gizle
    document.getElementById("editCheckFields").style.display = isCheck ? "" : "none";
    document.getElementById("editNoteFields").style.display  = isNote  ? "" : "none";

    // Ortak alanlar
    document.getElementById("editAmount").value = item.amount || "";
    document.getElementById("editDesc").value   = item.description || "";

    // Çek alanları
    if (isCheck) {
        document.getElementById("editCheckNo").value  = item.checkNo  || "";
        document.getElementById("editBank").value     = item.bank     || "";
        document.getElementById("editDueDate").value  = item.dueDate  || "";
    }

    // Senet alanları
    if (isNote) {
        document.getElementById("editNoteNo").value       = item.noteNo  || "";
        document.getElementById("editNoteDueDate").value  = item.dueDate || "";
    }

    document.getElementById("editModal").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("active");
}

async function submitEditRequest() {
    const amountRaw = document.getElementById("editAmount").value;
    const amount    = parseFloat(amountRaw);
    const desc      = document.getElementById("editDesc").value.trim();

    if (!amountRaw || isNaN(amount) || amount <= 0) {
        showToast("Geçerli bir tutar giriniz", "error");
        return;
    }

    const isCheck = CHECK_ACTIONS.has(currentEditType);
    const isNote  = NOTE_ACTIONS.has(currentEditType);

    let data = { amount, description: desc };

    if (isCheck) {
        data.checkNo = document.getElementById("editCheckNo").value.trim();
        data.bank    = document.getElementById("editBank").value.trim();
        data.dueDate = document.getElementById("editDueDate").value;
    }

    if (isNote) {
        data.noteNo  = document.getElementById("editNoteNo").value.trim();
        data.dueDate = document.getElementById("editNoteDueDate").value;
    }

    try {
        await myActivityApi.submitUpdateRequest(currentEditId, currentEditType, data);
        showToast("İstek gönderildi, onay bekleniyor", "success");
        closeEditModal();

        // Sadece o satırın butonunu "Onay Bekliyor" badge'ine çevir — full reload yok
        const editedBtn = document.querySelector(
            `button[data-entity-id="${currentEditId}"][data-action="${currentEditType}"]`
        );
        if (editedBtn) {
            editedBtn.replaceWith(
                Object.assign(document.createElement("span"), {
                    className: "badge badge-warning",
                    style:     "font-size:11px",
                    textContent: "Onay Bekliyor"
                })
            );
        }
    } catch (err) {
        console.error("[submitEditRequest] Hata:", err);
        showToast(err.message || "Hata oluştu", "error");
    }
}

window.initMyActivitiesPage = initMyActivitiesPage;
