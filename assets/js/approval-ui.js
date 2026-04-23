const VISIBLE_FIELDS = {
    amount:          "Tutar",
    description:     "Açıklama",
    type:            "İşlem Türü",
    transactionDate: "Tarih",
    // Çek
    checkNo:         "Çek No",
    bank:            "Banka",
    dueDate:         "Vade Tarihi",
    // Senet
    noteNo:          "Senet No",
    debtor:          "Borçlu",
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

// BANK_LABELS → core.js'de tanımlı

function parseRaw(raw) {
    if (!raw) return {};
    if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return {}; } }
    return raw;
}

function formatVal(k, v) {
    if (v === null || v === undefined) return "-";
    if (k === "amount")          return Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
    if (k === "transactionDate") return new Date(v).toLocaleString("tr-TR");
    if (k === "dueDate")         return new Date(v).toLocaleDateString("tr-TR");
    if (k === "type")            return TYPE_LABELS[v] || v;
    if (k === "bank")            return BANK_LABELS[v] || v;
    return String(v);
}

// Sabit sıra — her zaman aynı sırada göster
const FIELD_ORDER = ["checkNo", "noteNo", "bank", "dueDate", "amount", "description", "type", "transactionDate", "debtor"];

function buildAlignedColumns(oldRaw, newRaw) {
    const o = parseRaw(oldRaw);
    const n = parseRaw(newRaw);

    // Birleşik key listesi, FIELD_ORDER'a göre sırala
    const allKeys = [...new Set([...FIELD_ORDER, ...Object.keys(o), ...Object.keys(n)])]
        .filter(k => VISIBLE_FIELDS[k] && (k in o || k in n));

    let oldCol = "";
    let newCol = "";

    allKeys.forEach(k => {
        const label = VISIBLE_FIELDS[k];
        const oldVal = escapeHtml(formatVal(k, o[k]));
        const newVal = escapeHtml(formatVal(k, n[k]));
        const changed = formatVal(k, o[k]) !== formatVal(k, n[k]);

        const row = (val, isNew) => `
            <div style="margin-bottom:6px">
                <span style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px">${label}</span>
                <span class="approval-field-val${isNew && changed ? " approval-field-changed" : ""}">${val}</span>
            </div>`;

        oldCol += row(oldVal, false);
        newCol += row(newVal, true);
    });

    return { oldCol: oldCol || "-", newCol: newCol || "-" };
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

        const { oldCol, newCol } = buildAlignedColumns(item.oldData, item.newData);

        tr.dataset.requestId = item.id;
        tr.innerHTML = `
      <td style="white-space:nowrap">${escapeHtml(date)}</td>
      <td>${requester}</td>
      <td><span class="badge badge-primary">${typeLabel}</span></td>
      <td>${oldCol}</td>
      <td>${newCol}</td>
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

function _removeApprovalRow(id) {
  const row = document.querySelector(`tr[data-request-id="${id}"]`);
  if (!row) return;
  row.style.transition = "opacity .25s, transform .25s";
  row.style.opacity = "0";
  row.style.transform = "translateX(20px)";
  setTimeout(() => {
    row.remove();
    const tbody = document.getElementById("approvalTableBody");
    if (tbody && tbody.querySelectorAll("tr").length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Bekleyen istek yok</td></tr>`;
    }
  }, 260);
}

function approve(id) {
    showConfirmToast("Bu işlemi onaylamak istediğinize emin misiniz?", async () => {
        try {
            await changeRequestApi.approve(id);
            showToast("Onaylandı", "success");
            _removeApprovalRow(id);
        } catch (err) {
            console.error("[approve] Hata:", err);
            showToast(err.message || "Onaylama başarısız", "error");
        }
    });
}

function reject(id) {
    showConfirmToast("Bu işlemi reddetmek istediğinize emin misiniz?", async () => {
        try {
            await changeRequestApi.reject(id);
            showToast("Reddedildi", "error");
            _removeApprovalRow(id);
        } catch (err) {
            console.error("[reject] Hata:", err);
            showToast(err.message || "Reddetme başarısız", "error");
        }
    });
}

window.initApprovalsPage = loadApprovals;
