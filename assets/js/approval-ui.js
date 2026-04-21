const VISIBLE_FIELDS = {
    amount:          "Tutar",
    description:     "Açıklama",
    type:            "İşlem Türü",
    transactionDate: "Tarih",
};

const TYPE_LABELS = {
    INCOME:  "Kasa Giriş",
    EXPENSE: "Kasa Çıkış",
    CHECK_IN:      "Çek Giriş",
    CHECK_COLLECT: "Çek Tahsil",
    NOTE_IN:       "Senet Giriş",
    NOTE_COLLECT:  "Senet Tahsil",
    LOAN_CREATE:   "Kredi Ekleme",
};

function formatData(raw) {
    if (!raw) return "-";

    let obj = raw;
    if (typeof raw === "string") {
        try { obj = JSON.parse(raw); } catch { return escapeHtml(raw); }
    }

    const entries = Object.entries(obj)
        .filter(([k]) => VISIBLE_FIELDS[k])
        .map(([k, v]) => {
            const label = VISIBLE_FIELDS[k];
            let val = v;
            if (k === "amount") val = Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
            if (k === "transactionDate") val = new Date(v).toLocaleString("tr-TR");
            if (k === "type") val = TYPE_LABELS[v] || v;
            return `
              <div style="margin-bottom:3px">
                <span style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px">${label}</span>
                <span style="display:block;font-weight:600;color:#1e293b">${escapeHtml(String(val))}</span>
              </div>`;
        });

    return entries.length ? entries.join("") : "-";
}

const entityTypeLabel = {
    CASH:  "Kasa",
    CHECK: "Çek",
    NOTE:  "Senet",
    LOAN:  "Kredi",
};

async function loadApprovals() {
    console.log("[loadApprovals] İstekler yükleniyor...");
    try {
        const list = await changeRequestApi.getPending();
        console.log("[loadApprovals] Sunucudan gelen liste:", list);
        renderApprovals(list);
    } catch (err) {
        console.error("[loadApprovals] Hata:", err);
        showToast("Onay listesi yüklenemedi: " + (err.message || ""), "error");
    }
}

function renderApprovals(list) {

    const tbody = document.getElementById("approvalTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Bekleyen istek yok</td></tr>`;
        return;
    }

    list.forEach(item => {

        const tr = document.createElement("tr");
        tr.classList.add("user-row");

        const date = item.requestedAt
            ? new Date(item.requestedAt).toLocaleString("tr-TR")
            : "-";

        const typeLabel = entityTypeLabel[item.entityType] || escapeHtml(item.entityType || "-");

        const requester = item.requestedByUsername
            ? escapeHtml(item.requestedByUsername)
            : item.requestedBy
                ? `<span style="opacity:.6;font-size:11px">ID:</span> <strong>${item.requestedBy}</strong>`
                : "-";

        tr.innerHTML = `
      <td style="white-space:nowrap">${escapeHtml(date)}</td>
      <td>${requester}</td>
      <td><span class="badge badge-primary">${typeLabel}</span></td>
      <td>${formatData(item.oldData)}</td>
      <td>${formatData(item.newData)}</td>
      <td style="white-space:nowrap">
        <button class="btn-modern" data-id="${item.id}" data-action="approve">Onayla</button>
        <button class="btn-delete" data-id="${item.id}" data-action="reject">Reddet</button>
      </td>
    `;

        tr.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", function () {
                if (this.dataset.action === "approve") approve(this.dataset.id);
                else reject(this.dataset.id);
            });
        });

        tbody.appendChild(tr);
    });
}

async function approve(id) {
    if (!confirm("Bu işlemi onaylamak istediğinize emin misiniz?")) return;
    try {
        await changeRequestApi.approve(id);
        showToast("Onaylandı", "success");
        loadApprovals();
    } catch (err) {
        console.error("[approve] Hata:", err);
        showToast(err.message || "Onaylama başarısız", "error");
    }
}

async function reject(id) {
    if (!confirm("Bu işlemi reddetmek istediğinize emin misiniz?")) return;
    try {
        await changeRequestApi.reject(id);
        showToast("Reddedildi", "error");
        loadApprovals();
    } catch (err) {
        console.error("[reject] Hata:", err);
        showToast(err.message || "Reddetme başarısız", "error");
    }
}

window.initApprovalsPage = loadApprovals;
