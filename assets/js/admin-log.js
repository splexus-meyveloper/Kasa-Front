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
POS_LOG: '<span class="badge badge-primary">Kredi Kartı</span>',

CASH_UPDATE_REQUEST:           '<span class="badge badge-warning">Kasa Düzenleme</span>',
CASH_UPDATE_REQUEST_CREATED:   '<span class="badge badge-warning">Düzenleme Talebi</span>',
CASH_UPDATE_REQUEST_APPROVED:  '<span class="badge badge-success">Düzenleme Onaylandı</span>',
CASH_UPDATE_REQUEST_REJECTED:  '<span class="badge badge-danger">Düzenleme Reddedildi</span>',

CHECK_UPDATE_REQUEST:           '<span class="badge badge-warning">Çek Düzenleme</span>',
CHECK_UPDATE_REQUEST_CREATED:   '<span class="badge badge-warning">Çek Düzenleme Talebi</span>',
CHECK_UPDATE_REQUEST_APPROVED:  '<span class="badge badge-success">Çek Düzenleme Onaylandı</span>',
CHECK_UPDATE_REQUEST_REJECTED:  '<span class="badge badge-danger">Çek Düzenleme Reddedildi</span>',

NOTE_UPDATE_REQUEST:            '<span class="badge badge-warning">Senet Düzenleme</span>',
NOTE_UPDATE_REQUEST_CREATED:    '<span class="badge badge-warning">Senet Düzenleme Talebi</span>',
NOTE_UPDATE_REQUEST_APPROVED:   '<span class="badge badge-success">Senet Düzenleme Onaylandı</span>',
NOTE_UPDATE_REQUEST_REJECTED:   '<span class="badge badge-danger">Senet Düzenleme Reddedildi</span>',

LOAN_UPDATE_REQUEST:            '<span class="badge badge-warning">Kredi Düzenleme</span>',
LOAN_UPDATE_REQUEST_CREATED:    '<span class="badge badge-warning">Kredi Düzenleme Talebi</span>',
LOAN_UPDATE_REQUEST_APPROVED:   '<span class="badge badge-success">Kredi Düzenleme Onaylandı</span>',
LOAN_UPDATE_REQUEST_REJECTED:   '<span class="badge badge-danger">Kredi Düzenleme Reddedildi</span>'

};

return map[action] || `<span class="badge">${escapeHtml(String(action || ""))}</span>`;

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
        POS_LOG: "Kredi Kartı",

    };

    return map[action] || action;

}



async function loadMovements(page = 0, start = "", end = "", action = "", username = "", q = "", masrafTuru = ""){

    const token   = sessionStorage.getItem("token");
    const isAdmin = sessionStorage.getItem("role") === "ADMIN";

    // "Düzenlemeler" filtresi → ayrı endpoint
    if(action === "CASH_UPDATE_REQUEST"){
        return loadChangeRequests(token);
    }

    // POS filtresi → ayrı render
    if(action === "POS_LOG"){
        const posTipi = document.getElementById("filterPosTipi")?.value || "";
        return loadAndRenderPosLogs({ startDate: start, endDate: end, user: username, posTipi });
    }

    if(action === "LOAN_INSTALLMENT"){
        action = "CASH_EXPENSE";
        q = "kredi taksiti";
    }

    let url;
    if (isAdmin) {
        url = `${API_BASE}/audit-logs?page=${page}&size=100`;
        if (start)    url += `&start=${start}T00:00:00`;
        if (end)      url += `&end=${end}T23:59:59`;
        if (action)   url += `&action=${action}`;
        if (username) url += `&username=${username}`;
        if (q)        url += `&q=${q}`;
    } else {
        url = `${API_BASE}/audit-logs/my-actions?page=${page}&size=100`;
    }

    try {
        const res = await fetch(url,{
            headers:{ "Authorization":"Bearer " + token }
        });
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.content || data.data || []);

        // Masraf türü alt filtresi — sadece admin + client-side
        let filtered = rows;
        if (isAdmin && masrafTuru && action === "EXPENSE_ADD") {
            filtered = rows.filter(item => {
                const raw = item.detailsJson || item.details || {};
                const dj  = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
                const pl  = dj.payload || {};
                return pl.expenseType === masrafTuru;
            });
        }

        renderTable(filtered);
    } catch(err) {
        console.error("[loadMovements] Hata:", err);
        renderTable([]);
    }
}

async function loadChangeRequests(token){

    // Önce tüm change-request'leri (onaylananlar dahil) getirmeyi dene
    let list = await changeRequestApi.getAll();
    let onlyPending = false;

    if (list === null) {
        // Tüm endpointler başarısız — sadece bekleyenleri göster
        onlyPending = true;
        try {
            const res = await fetch(`${API_BASE}/change-requests/pending`, {
                headers:{ "Authorization":"Bearer " + token }
            });
            if (res.ok) {
                const data = await res.json();
                list = Array.isArray(data) ? data
                     : Array.isArray(data?.content) ? data.content
                     : Array.isArray(data?.data)    ? data.data
                     : [];
            } else {
                list = [];
            }
        } catch(err) {
            console.error("[loadChangeRequests] Hata:", err);
            list = [];
        }
    }

    if (onlyPending) {
        showToast("Sadece bekleyen düzenleme talepleri gösteriliyor (tüm kayıtlara erişim yok)", "warning");
    }


    const mapped = list.map(item => ({
        createdAt:   item.requestedAt || item.createdAt,
        username:    item.requestedByUsername || item.username || ("ID:" + item.requestedBy),
        action:      item.entityType ? item.entityType + "_UPDATE_REQUEST" : "CASH_UPDATE_REQUEST",
        description: item.description || ("Düzenleme → " + (item.status || "")),
        amount:      null,
        _isChangeReq: true,
        _status:     item.status,
        _oldData:    item.oldData,
        _newData:    item.newData,
        _entityType: item.entityType,
    }));

    renderTable(mapped);
}

const POS_TYPE_LABELS = {
    ALTIKARDESLER_POS: "ALTIKARDEŞLER POS",
    TEDARIKCI_POS:     "TEDARİKÇİ POS",
};

const PLAKA_LABELS = {
    P_16_AHD_464: "16 AHD 464",
    P_16_BVL_436: "16 BVL 436",
    P_16_AEA_555: "16 AEA 555",
    P_16_ANS_605: "16 ANS 605",
    P_16_GD_606:  "16 GD 606",
    P_16_E_0207:  "16 E 0207",
    P_16_JUT_88:  "16 JUT 88",
    P_16_BBR_666: "16 BBR 666",
};

function prettifyDesc(desc) {
    if (!desc) return "-";
    // "P_16_GD_606 — açıklama" → "16 GD 606 — açıklama"
    return desc.replace(/P_\d+_[A-Z0-9_]+/g, m => PLAKA_LABELS[m] || m);
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
    updateAdminTotals(0, 0);
    return;
}

let totalIncome = 0, totalExpense = 0;

list.forEach(item => {

    const tr = document.createElement("tr");
    tr.classList.add("user-row");

    const isChangeReq = !!item._isChangeReq
        || (item.action || "").includes("UPDATE_REQUEST");

    // detailsJson string veya object olarak gelebilir
    const detailsRaw  = item.detailsJson || item.details || {};
    const detailsJson = typeof detailsRaw === "string" ? (() => { try { return JSON.parse(detailsRaw); } catch { return {}; } })() : detailsRaw;
    const payload     = detailsJson.payload || {};
    const oldData     = payload.oldData || item._oldData || null;
    const newData     = payload.newData || item._newData || null;
    const entityType  = item.entityType || detailsJson.entityType || item._entityType || null;
    const hasDetail   = !!(oldData || newData);

    const isIncome = !isChangeReq && (
              item.action === "CASH_INCOME"
              || item.action === "CHECK_IN"
              || item.action === "CHECK_COLLECT"
              || item.action === "NOTE_IN"
              || item.action === "NOTE_COLLECT"
              || item.action === "LOAN_CREATE"
              || item.action === "POS_LOG");

    if (!isChangeReq) {
        const amount = Number(item.amount || 0);
        if (isIncome) totalIncome += amount;
        else totalExpense += amount;
    }

    const amountClass = isIncome ? "text-success" : "text-danger";

    const changeReqStatus = item._status || item.status;
    const amountCell = isChangeReq
        ? (STATUS_BADGE[changeReqStatus] || '<span style="color:#94a3b8;font-size:12px">—</span>')
        : `${isIncome ? "+" : "-"}${Number(item.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits:2 })} TL`;

    const date = item.createdAt ? formatDateTime(item.createdAt) : "—";

    // Sadece oldData/newData varsa Detay butonu göster
    let descCell;
    if (isChangeReq && hasDetail) {
        descCell = `<button class="cr-detail-btn"><i class="zmdi zmdi-info-outline"></i> Detay</button>`;
    } else {
        descCell = `<span class="td-desc">${escapeHtml(prettifyDesc(item.description))}</span>`;
    }

    const showUser = sessionStorage.getItem("role") === "ADMIN";
    tr.innerHTML = `
        <td style="vertical-align:middle">${date}</td>
        ${showUser ? `<td style="vertical-align:middle">${escapeHtml(item.username)}</td>` : ""}
        <td class="text-center" style="vertical-align:middle">${actionBadge(item.action)}</td>
        <td style="vertical-align:middle">${descCell}</td>
        <td class="text-end" style="vertical-align:middle">
            <span class="${isChangeReq ? "" : amountClass}" style="font-weight:600">${amountCell}</span>
        </td>
    `;

    if (isChangeReq && hasDetail) {
        const btn = tr.querySelector(".cr-detail-btn");
        btn.addEventListener("click", function () {
            showChangeDetail(oldData, newData, entityType, item);
        });
    }

    tbody.appendChild(tr);

});

updateAdminTotals(totalIncome, totalExpense);

}

const FIELD_LABELS = {
    amount:          "Tutar",
    description:     "Açıklama",
    type:            "İşlem Türü",
    transactionDate: "Tarih",
    dueDate:         "Vade Tarihi",
    checkNo:         "Çek No",
    checkType:       "Çek Tipi",
    bank:            "Banka",
    bankName:        "Banka",
    noteNo:          "Senet No",
    monthlyPayment:  "Aylık Ödeme",
    remainingDebt:   "Kalan Borç",
    paymentDay:      "Ödeme Günü",
    status:          "Durum",
    username:        "Kullanıcı",
    userId:          "Kullanıcı",
};

// Gösterilmeyecek alanlar
const SKIP_FIELDS = new Set(["id", "active", "companyId", "createdAt", "updatedAt", "createdBy"]);

// Değer çevirileri
const VALUE_LABELS = {
    INCOME:  "Kasa Giriş",
    EXPENSE: "Kasa Çıkış",
    CHECK:   "Çek",
    NOTE:    "Senet",
    LOAN:    "Kredi",
    true:    "Aktif",
    false:   "Pasif",
    PENDING:   "Beklemede",
    APPROVED:  "Onaylandı",
    REJECTED:  "Reddedildi",
    PORTFOYDE: "Kasada",
    TAHSIL_EDILDI: "Tahsil Edildi",
    CIRO_EDILDI:   "Ciro Edildi",
    ODENDI:        "Ödendi",
    MUSTERI: "Müşteri",
    KENDI:   "Kendi",
};

// BANK_LABELS → core.js'de tanımlı

// Tarih alanlarını normalize et (karşılaştırma için milisaniye/zaman dilimine dikkat)
const DATE_FIELDS = new Set(["transactionDate", "dueDate", "createdAt", "updatedAt"]);

function parseData(raw) {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
        const p = JSON.parse(raw);
        return typeof p === "string" ? JSON.parse(p) : p;
    } catch { return {}; }
}

function formatFieldValue(key, val) {
    if (val === null || val === undefined) return "-";
    if (key === "amount" || key === "monthlyPayment" || key === "remainingDebt") {
        return Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
    }
    if (key === "userId") {
        return escapeHtml(userIdMap[val] || String(val));
    }
    if (key === "bank" || key === "bankName") {
        return escapeHtml(BANK_LABELS[String(val)] || String(val));
    }
    if (DATE_FIELDS.has(key)) {
        return formatDateTime(val);
    }
    const strVal = String(val);
    return escapeHtml(VALUE_LABELS[strVal] ?? strVal);
}

function normalizeForCompare(key, val) {
    if (val === null || val === undefined) return "";
    if (DATE_FIELDS.has(key)) {
        try { return new Date(val).toLocaleDateString("tr-TR"); } catch { return String(val); }
    }
    return String(val);
}

function showChangeDetail(oldData, newData, entityType, item) {
    try {
        const o = parseData(oldData);
        const n = parseData(newData);

        // Tüm alanları göster: newData + oldData key birleşimi
        const allKeys = [...new Set([...Object.keys(n), ...Object.keys(o)])];

        let rows = "";
        let hasAnyRow = false;

        allKeys.forEach(k => {
            if (SKIP_FIELDS.has(k)) return;

            // newData'da yoksa bu alan değişmemiştir
            const changed = n[k] !== undefined
                && normalizeForCompare(k, o[k]) !== normalizeForCompare(k, n[k]);
            const oldVal  = formatFieldValue(k, o[k]);
            const newVal  = formatFieldValue(k, n[k]);
            hasAnyRow = true;
            const label = FIELD_LABELS[k] || k;

            if (changed) {
                rows += `
                    <div class="detail-popup-row detail-changed">
                        <span class="detail-popup-label">${label}</span>
                        <span class="detail-popup-vals">
                            <span class="detail-old">${oldVal}</span>
                            <i class="zmdi zmdi-long-arrow-right" style="margin:0 8px;color:#64748b"></i>
                            <span class="detail-new detail-new-highlight">${newVal}</span>
                        </span>
                    </div>`;
            } else {
                rows += `
                    <div class="detail-popup-row">
                        <span class="detail-popup-label">${label}</span>
                        <span class="detail-popup-vals">
                            <span class="detail-new">${oldVal}</span>
                        </span>
                    </div>`;
            }
        });

        if (!hasAnyRow) {
            rows = `<div style="color:#94a3b8;font-size:13px;padding:12px 0">Değişen alan bulunamadı.</div>`;
        }

        const entityTypeLabel = { CASH: "Kasa", CHECK: "Çek", NOTE: "Senet", LOAN: "Kredi" };
        const subtitle = entityTypeLabel[entityType] || entityType || "";
        const dateStr  = item?.createdAt ? formatDateTime(item.createdAt) : "";

        const username = item?.username;
        if (username) {
            rows = `
                <div class="detail-popup-row">
                    <span class="detail-popup-label">Düzenleyen</span>
                    <span class="detail-popup-vals">
                        <span class="detail-new" style="font-weight:600">${escapeHtml(username)}</span>
                    </span>
                </div>` + rows;
        }

        document.getElementById("crDetailPopup")?.remove();

        const popup = document.createElement("div");
        popup.id = "crDetailPopup";
        popup.className = "kasa-modal active";
        popup.innerHTML = `
            <div class="kasa-modal-overlay" onclick="document.getElementById('crDetailPopup').remove()"></div>
            <div class="kasa-modal-card" style="max-width:520px">
                <button class="kasa-modal-close" onclick="document.getElementById('crDetailPopup').remove()">×</button>
                <div class="kasa-modal-header">
                    <div class="kasa-modal-icon"><i class="zmdi zmdi-edit"></i></div>
                    <div>
                        <h3 class="kasa-modal-title">Düzenleme Detayı</h3>
                        <div class="kasa-modal-subtitle">${subtitle ? subtitle + " kaydı" : ""}${dateStr ? " &nbsp;·&nbsp; " + dateStr : ""}</div>
                    </div>
                </div>
                <div class="detail-popup">${rows}</div>
            </div>`;
        document.body.appendChild(popup);
    } catch(e) {
        console.error("[showChangeDetail] Hata:", e);
        showToast("Detay gösterilemedi", "error");
    }
}

function updateAdminTotals(income, expense) {
    const bar = document.getElementById("adminTotals");
    if (!bar) return;
    const net = income - expense;
    const fmt = v => Math.abs(v).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
    document.getElementById("adminTotalIncome").textContent  = "+" + fmt(income);
    document.getElementById("adminTotalExpense").textContent = "-" + fmt(expense);
    const netEl = document.getElementById("adminTotalNet");
    netEl.textContent = (net >= 0 ? "+" : "-") + fmt(net);
    netEl.className = "summary-value " + (net >= 0 ? "summary-pos" : "summary-neg");
    bar.style.display = "flex";
}


function applyFilter(){
    if (sessionStorage.getItem("role") !== "ADMIN") return;

    const startDate  = document.getElementById("filterStartDate").value;
    const endDate    = document.getElementById("filterEndDate").value;
    const type       = document.getElementById("filterType").value;
    const user       = document.getElementById("filterUser").value;
    const masrafTuru = document.getElementById("filterMasrafTuru")?.value || "";
    const posTipi    = document.getElementById("filterPosTipi")?.value   || "";

    if (!type) {
        loadMovementsAndPos(startDate, endDate, user);
        return;
    }
    if (type === "POS_LOG") {
        loadAndRenderPosLogs({ startDate, endDate, user, posTipi });
        return;
    }
    loadMovements(0, startDate, endDate, type, user, "", masrafTuru);
}

function clearFilter(){
    if (sessionStorage.getItem("role") !== "ADMIN") return;

    document.getElementById("filterStartDate").value = "";
    document.getElementById("filterEndDate").value   = "";
    document.getElementById("filterType").value      = "";
    document.getElementById("filterUser").value      = "";

    const masrafEl = document.getElementById("filterMasrafTuru");
    if (masrafEl) masrafEl.value = "";
    const posTipiEl = document.getElementById("filterPosTipi");
    if (posTipiEl) posTipiEl.value = "";

    const masrafWrapper = document.getElementById("masrafTuruWrapper");
    if (masrafWrapper) masrafWrapper.style.display = "none";
    const posTipiWrapper = document.getElementById("posTipiWrapper");
    if (posTipiWrapper) posTipiWrapper.style.display = "none";

    loadMovementsAndPos();
}

function onAdminFilterTypeChange() {
    const type          = document.getElementById("filterType")?.value || "";
    const masrafWrapper = document.getElementById("masrafTuruWrapper");
    const posTipiWrapper = document.getElementById("posTipiWrapper");
    if (masrafWrapper)  masrafWrapper.style.display  = type === "EXPENSE_ADD" ? "" : "none";
    if (posTipiWrapper) posTipiWrapper.style.display = type === "POS_LOG"     ? "" : "none";
}

window.onAdminFilterTypeChange = onAdminFilterTypeChange;

function _parsePosDateAdmin(l) {
    // logDate öncelikli — backend bu alanı kullanıyor
    const raw = l.logDate ?? l.createdAt ?? l.date ?? l.timestamp ?? l.createdDate ?? l.transactionDate ?? null;
    if (raw == null) return null;
    if (Array.isArray(raw)) {
        const [y, mo, d, h = 0, mi = 0, s = 0] = raw;
        const dt = new Date(y, mo - 1, d, h, mi, s);
        return isNaN(dt.getTime()) ? null : dt.toISOString();
    }
    if (typeof raw === "number") {
        const dt = new Date(raw);
        return isNaN(dt.getTime()) ? null : dt.toISOString();
    }
    // "dd-MM-yyyy HH:mm:ss" formatı → ISO'ya çevir (sort için)
    if (typeof raw === "string" && /^\d{2}-\d{2}-\d{4}/.test(raw)) {
        const [datePart, timePart = "00:00:00"] = raw.split(" ");
        const [dd, mm, yyyy] = datePart.split("-");
        const dt = new Date(`${yyyy}-${mm}-${dd}T${timePart}`);
        return isNaN(dt.getTime()) ? null : dt.toISOString();
    }
    const dt = new Date(raw);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
}

function _posToRow(l) {
    const isoDate = _parsePosDateAdmin(l);
    const posLabel = POS_TYPE_LABELS[l.posType] || l.posType || "";
    return {
        createdAt:   isoDate || null,
        username:    l.username || l.user || "-",
        action:      "POS_LOG",
        description: [posLabel, l.terminal].filter(Boolean).join(" — ") + (l.description ? " | " + prettifyDesc(l.description) : ""),
        amount:      l.amount || 0,
    };
}

async function _fetchPosRows(filters = {}) {
    const token = sessionStorage.getItem("token");
    let url = `${API_BASE}/pos/logs`;
    const params = [];
    if (filters.startDate) params.push(`start=${filters.startDate}T00:00:00`);
    if (filters.endDate)   params.push(`end=${filters.endDate}T23:59:59`);
    if (params.length) url += "?" + params.join("&");

    const res = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
    if (!res.ok) { console.warn("[_fetchPosRows] API yanıt:", res.status); return []; }
    const data = await res.json();
    let logs = Array.isArray(data) ? data : (data.content || data.data || []);

    if (filters.posTipi) logs = logs.filter(l => l.posType === filters.posTipi);
    if (filters.user)    logs = logs.filter(l => (l.username || l.user || "") === filters.user);

    return logs.map(_posToRow);
}

async function loadAndRenderPosLogs(filters = {}) {
    const tbody = document.getElementById("kasaTableBody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:20px">Yükleniyor...</td></tr>`;
    try {
        renderTable(await _fetchPosRows(filters));
    } catch(e) {
        console.error("[loadAndRenderPosLogs] Hata:", e);
        renderTable([]);
    }
}

async function loadMovementsAndPos(start = "", end = "", username = "") {
    const tbody = document.getElementById("kasaTableBody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:20px">Yükleniyor...</td></tr>`;

    const token   = sessionStorage.getItem("token");
    const isAdmin = sessionStorage.getItem("role") === "ADMIN";

    let auditUrl;
    if (isAdmin) {
        auditUrl = `${API_BASE}/audit-logs?page=0&size=100`;
        if (start)    auditUrl += `&start=${start}T00:00:00`;
        if (end)      auditUrl += `&end=${end}T23:59:59`;
        if (username) auditUrl += `&username=${username}`;
    } else {
        auditUrl = `${API_BASE}/audit-logs/my-actions?page=0&size=100`;
    }

    let auditRows = [];
    try {
        const res = await fetch(auditUrl, { headers: { "Authorization": "Bearer " + token } });
        const d   = await res.json();
        auditRows = Array.isArray(d) ? d : (d.content || d.data || []);
    } catch(e) {
        console.error("[loadMovementsAndPos] audit hata:", e);
    }

    let posRows = [];
    try {
        posRows = await _fetchPosRows({ startDate: start, endDate: end, user: username });
    } catch(e) {
        console.error("[loadMovementsAndPos] POS hata:", e);
    }

    const all = [...auditRows, ...posRows].sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    renderTable(all);
}

function initAdminLogs(){

    const table = document.getElementById("kasaTableBody");
    if(!table) return;

    const isAdmin = sessionStorage.getItem("role") === "ADMIN";

    if (!isAdmin) {
        // Normal kullanıcı: filtreler çalışmaz, gizle
        const adminOnlyFilters = ["filterUser", "filterType", "filterStartDate", "filterEndDate"];
        adminOnlyFilters.forEach(id => {
            const el = document.getElementById(id);
            if (el?.closest(".col-md-3")) el.closest(".col-md-3").style.display = "none";
        });
        // Filtre butonlarını gizle
        const filterBtns = document.querySelector(".col-12.mt-15.d-flex.gap-2");
        if (filterBtns) filterBtns.style.display = "none";
        // Kullanıcı sütununu gizle
        const userTh = document.querySelector("#kasaTable thead th:nth-child(2)");
        if (userTh) userTh.style.display = "none";
    } else {
        loadUsersForFilter();
    }

    loadMovementsAndPos();
}

window.initAdminLogs = initAdminLogs;

const userIdMap = {}; // { userId: username }

async function loadUsersForFilter() {
    try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(API_BASE + "/admin/profiles", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) return;

        const data = await res.json();
        const users = Array.isArray(data) ? data : (data.content || data.data || []);

        users.forEach(u => {
            if (u.id) userIdMap[u.id] = u.username;
        });

        const select = document.getElementById("filterUser");
        if (!select) return;

        select.innerHTML = '<option value="">Tümü</option>';
        users.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u.username;
            opt.textContent = u.username;
            select.appendChild(opt);
        });
    } catch(e) {
        console.error("[loadUsersForFilter] Hata:", e);
    }
}

