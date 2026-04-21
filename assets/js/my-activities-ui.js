const CHANGE_REQUEST_ACTIONS = [
    "CASH_UPDATE_REQUEST",
    "CHECK_UPDATE_REQUEST",
    "NOTE_UPDATE_REQUEST",
    "LOAN_UPDATE_REQUEST",
    "CHANGE_REQUEST",
    "PENDING",
];

function isChangeRequestItem(item) {
    return CHANGE_REQUEST_ACTIONS.includes(item.action)
        || item.source === "CHANGE_REQUEST";
}

function renderMyActivities(list) {

    const tbody = document.getElementById("myActivitiesTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    list.forEach(item => {

        const tr = document.createElement("tr");

        const isChangeReq = isChangeRequestItem(item);
        const isPending   = isChangeReq && item.status === "PENDING";
        const isApproved  = isChangeReq && item.status === "APPROVED";
        const isRejected  = isChangeReq && item.status === "REJECTED";

        const isIncome = item.action === "CASH_INCOME"
            || item.action === "CHECK_IN"
            || item.action === "CHECK_COLLECT"
            || item.action === "NOTE_IN"
            || item.action === "NOTE_COLLECT"
            || item.action === "LOAN_CREATE";

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
  <td style="font-weight:700">${date}</td>
  <td>${actionCell}</td>
  <td>${item.description || item.newDescription || "-"}</td>
  <td class="text-end">${amountCell}</td>
  <td class="text-center">${statusCell}</td>
`;
        if (!isChangeReq) {
            const btn = tr.querySelector("button");
            if (btn) {
                btn.dataset.description = item.description || "";
                btn.addEventListener("click", function () {
                    openEditModal(
                        this.dataset.entityId,
                        this.dataset.action,
                        this.dataset.description,
                        this.dataset.amount
                    );
                });
            }
        }

        tbody.appendChild(tr);
    });
}

async function initMyActivitiesPage() {
    const data = await myActivityStore.load();
    renderMyActivities(data);
}

let currentEditId = null;
let currentEditType = null;

function openEditModal(id, action, desc, amount) {
    currentEditId = id;
    currentEditType = action;
    document.getElementById("editAmount").value = amount || "";
    document.getElementById("editDesc").value = desc || "";
    document.getElementById("editModal").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("active");
}

async function submitEditRequest() {

    const amountRaw = document.getElementById("editAmount").value;
    const desc = document.getElementById("editDesc").value.trim();
    const amount = parseFloat(amountRaw);

    if (!amountRaw || isNaN(amount) || amount <= 0) {
        showToast("Geçerli bir tutar giriniz", "error");
        return;
    }

    try {
        const result = await myActivityApi.submitUpdateRequest(
            currentEditId,
            currentEditType,
            { amount, description: desc }
        );

        console.log("[submitEditRequest] Sunucu yanıtı:", result);
        showToast("İstek gönderildi", "success");
        closeEditModal();

        const data = await myActivityStore.load();
        renderMyActivities(data);

    } catch (err) {
        console.error("[submitEditRequest] Hata:", err);
        showToast(err.message || "Hata oluştu", "error");
    }
}

window.initMyActivitiesPage = initMyActivitiesPage;
