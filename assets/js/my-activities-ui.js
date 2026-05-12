// ── Sabitler ────────────────────────────────────────────────
const _MY_POS_TYPE_LABELS = {
    ALTIKARDESLER_POS: "ALTIKARDEŞLER POS",
    TEDARIKCI_POS:     "TEDARİKÇİ POS",
    YAZARKASA_POS:     "Yazarkasa POS",
};

const _MY_PLAKA_LABELS = {
    P_16_AHD_464: "16 AHD 464", P_16_BVL_436: "16 BVL 436",
    P_16_AEA_555: "16 AEA 555", P_16_ANS_605: "16 ANS 605",
    P_16_GD_606:  "16 GD 606",  P_16_E_0207:  "16 E 0207",
    P_16_JUT_88:  "16 JUT 88",  P_16_BBR_666: "16 BBR 666",
};

const _MY_ACTION_LABELS = {
    CASH_INCOME: "Kasa Giriş",   CASH_EXPENSE: "Kasa Çıkış",
    CHECK_IN:    "Çek Giriş",    CHECK_COLLECT: "Çek Tahsil",
    CHECK_ENDORSE:"Çek Ciro",    CHECK_OUT: "Çek Ödendi",
    NOTE_IN:     "Senet Giriş",  NOTE_COLLECT: "Senet Tahsil",
    NOTE_ENDORSE:"Senet Ciro",   LOAN_CREATE: "Kredi Ekleme",
    EXPENSE_ADD: "Masraf",       POS_LOG: "Kredi Kartı",
};

const _MY_PDF_GROUP_ORDER = [
    { key: "Kasa Girişi", actions: ["CASH_INCOME"] },
    { key: "Çek Girişi", actions: ["CHECK_IN", "CHECK_COLLECT", "CHECK_ENDORSE"] },
    { key: "Senet Girişi", actions: ["NOTE_IN", "NOTE_COLLECT", "NOTE_ENDORSE"] },
    { key: "Kredi Kartı POS İşlemi", actions: ["POS_LOG"] },
    { key: "Kasa Çıkışı", actions: ["CASH_EXPENSE"] },
    { key: "Masraflar", actions: ["EXPENSE_ADD"] },
];

function _myTranslateAction(action) {
    return _MY_ACTION_LABELS[action] || action || "—";
}

function _myPdfGroupLabel(action) {
    const group = _MY_PDF_GROUP_ORDER.find(g => g.actions.includes(action));
    return group?.key || _myTranslateAction(action);
}

function _myPrettifyDesc(desc) {
    if (!desc) return "—";
    const replaced = desc.replace(/P_\d+_[A-Z0-9_]+/g, m => _MY_PLAKA_LABELS[m] || m);
    return escapeHtml(replaced);
}

function _myBuildDisplayDesc(item) {
    const action = item.action || "";
    if (action === "CHECK_COLLECT") {
        const ct = _extractCollectType(item);
        let desc = ct === "COLLATERAL" ? "Çek teminata çıktı"
                 : ct === "BANK"       ? "Çek bankaya tahsil edildi"
                 : "Çek kasaya tahsil edildi";
        if (item.checkNo) desc += " • " + item.checkNo;
        return escapeHtml(desc);
    }
    if (action === "NOTE_IN") {
        let desc = "Senet alındı";
        if (item.noteNo) desc += " • " + item.noteNo;
        return escapeHtml(desc);
    }
    if (action === "NOTE_COLLECT") {
        const ct = _extractCollectType(item);
        let desc = ct === "COLLATERAL" ? "Senet teminata çıktı"
                 : ct === "BANK"       ? "Senet bankaya tahsil edildi"
                 : "Senet kasaya tahsil edildi";
        if (item.noteNo) desc += " • " + item.noteNo;
        return escapeHtml(desc);
    }
    if (action === "NOTE_ENDORSE") {
        let desc = "Senet ciro edildi";
        if (item.noteNo) desc += " • " + item.noteNo;
        if (item.description) desc += " • " + item.description;
        return escapeHtml(desc);
    }
    return _myPrettifyDesc(item.description || item.newDescription || "");
}

function _isIncomeAction(action) {
    return action === "CASH_INCOME"
        || action === "CHECK_IN"
        || action === "CHECK_COLLECT"
        || action === "NOTE_IN"
        || action === "NOTE_COLLECT"
        || action === "LOAN_CREATE"
        || action === "POS_LOG";
}

function _isIncome(item) {
    if (item.direction === "IN")   return true;
    if (item.direction === "OUT")  return false;
    if (item.direction === "NONE") return null;  // tarafsız — toplama dahil edilmez
    return _isIncomeAction(item.action) ? true : false;
}

function _getMyUsername() {
    try {
        const token = sessionStorage.getItem("token") || "";
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.sub || payload.username || payload.user || "";
    } catch { return ""; }
}

let _myActCurrentData = [];

// ── Badge ────────────────────────────────────────────────────
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
        POS_LOG:      '<span class="badge badge-primary">Kredi Kartı</span>',

        POS_UPDATE_REQUEST:          '<span class="badge badge-warning">POS Düzenleme</span>',
        POS_UPDATE_REQUEST_CREATED:  '<span class="badge badge-warning">POS Düzenleme Talebi</span>',
        POS_UPDATE_REQUEST_APPROVED: '<span class="badge badge-success">POS Düzenleme Onaylandı</span>',
        POS_UPDATE_REQUEST_REJECTED: '<span class="badge badge-danger">POS Düzenleme Reddedildi</span>',
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
    "POS_UPDATE_REQUEST",
    "POS_UPDATE_REQUEST_CREATED",
    "POS_UPDATE_REQUEST_APPROVED",
    "POS_UPDATE_REQUEST_REJECTED",
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
    "LOAN_CREATE", "EXPENSE_ADD", "POS_LOG",
]);

function renderMyActivities(list) {

    _myActCurrentData = list || [];

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

        const isIncome = _isIncome(item); // true=giriş, false=çıkış, null=tarafsız

        if (!isChangeReq) {
            const amount = Number(item.amount || 0);
            if (isIncome === true)  totalIncome  += amount;
            if (isIncome === false) totalExpense += amount;
            // null: toplama dahil edilmez
        }

        // Düzenleme isteklerinde tutar gösterme — 0 TL sırıtmasın
        const amountCell = isChangeReq
            ? '<span style="color:#94a3b8;font-size:12px">—</span>'
            : isIncome === null
                ? `<span style="color:#94a3b8">${Number(item.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</span>`
                : `<span class="${isIncome ? "text-success" : "text-danger"}">
                     ${(isIncome ? "+" : "-") + Number(item.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                   </span>`;

        const _dv = item.createdAt || item.date || item.requestedAt;
        const date = _dv ? formatDateTime(_dv) : "—";

        let actionCell;
        if (isPending)       actionCell = '<span class="badge badge-warning">Onay Bekliyor</span>';
        else if (isApproved) actionCell = '<span class="badge badge-success">Onaylandı</span>';
        else if (isRejected) actionCell = '<span class="badge badge-danger">Reddedildi</span>';
        else                 actionCell = _myCollectActionBadge(item);

        let statusCell;
        if (isPending)       statusCell = '<span class="badge badge-warning" style="font-size:11px">Beklemede</span>';
        else if (isApproved) statusCell = '<span class="badge badge-success" style="font-size:11px">Onaylandı</span>';
        else if (isRejected) statusCell = '<span class="badge badge-danger"  style="font-size:11px">Reddedildi</span>';
        else             statusCell = `<button class="btn-modern btn-sm"
                             data-entity-id="${item.entityId}"
                             data-action="${item.action}"
                             data-amount="${item.amount}">
                             Düzenle
                           </button>`;

        tr.innerHTML = `
  <td style="font-weight:700;vertical-align:middle">${date}</td>
  <td class="text-center" style="vertical-align:middle">${actionCell}</td>
  <td class="td-desc" style="vertical-align:middle">${_myBuildDisplayDesc(item) || "-"}${_paymentMethodBadge(item)}</td>
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

function _getMyActParams() {
    return {
        action:       document.getElementById("myActFilterType")?.value       || "",
        startDate:    document.getElementById("myActFilterStart")?.value      || "",
        endDate:      document.getElementById("myActFilterEnd")?.value        || "",
        masrafTuru:   document.getElementById("myActMasrafTuru")?.value       || "",
        masrafOdemeSekli: document.getElementById("myActMasrafOdemeSekli")?.value || "",
        tahsilatTuru: document.getElementById("myActTahsilatTuru")?.value     || "",
        posTipi:      document.getElementById("myActPosTipi")?.value          || "",
        posTerminal:  document.getElementById("myActPosTerminal")?.value      || "",
    };
}

function _getMyTerminalList(posType) {
    if (typeof _getPosTerminalList === "function") return _getPosTerminalList(posType);
    const fallback = {
        ALTIKARDESLER_POS: [
            { v: "VAKIFBANK", l: "VAKIFBANK" }, { v: "GARANTIBBVA", l: "GARANTİBBVA" },
            { v: "IS_BANKASI", l: "İŞ BANKASI" }, { v: "YAPI_KREDI", l: "YAPI KREDİ" },
            { v: "HALKBANK", l: "HALKBANK" }, { v: "TEB", l: "TEB" },
        ],
        TEDARIKCI_POS: [
            { v: "SAMPA", l: "SAMPA" }, { v: "HD_KAUCUK", l: "HD KAUÇUK" },
            { v: "INCITAS", l: "İNCİTAŞ" }, { v: "MAYSAN", l: "MAYSAN" },
            { v: "MAKPARSAN", l: "MAKPARSAN" }, { v: "ROTA", l: "ROTA" },
            { v: "OTO_KARAMAN", l: "OTO KARAMAN" },
        ],
        YAZARKASA_POS: [
            { v: "YAZARKASA_ZIRAAT", l: "Ziraat Bankası" }, { v: "YAZARKASA_TEB", l: "TEB" },
        ],
    };
    return fallback[posType] || [];
}

function onMyActPosTypeChange() {
    const posType = document.getElementById("myActPosTipi")?.value || "";
    const tw      = document.getElementById("myActPosTerminalWrapper");
    const sel     = document.getElementById("myActPosTerminal");
    if (!tw || !sel) return;
    if (!posType) {
        tw.style.display = "none";
        sel.innerHTML = '<option value="">Tümü</option>';
        return;
    }
    const terminals = _getMyTerminalList(posType);
    sel.innerHTML = '<option value="">Tümü</option>' +
        terminals.map(t => `<option value="${t.v}">${t.l}</option>`).join("");
    tw.style.display = "flex";
}
window.onMyActPosTypeChange = onMyActPosTypeChange;

function onMyActFilterTypeChange() {
    const type      = document.getElementById("myActFilterType")?.value || "";
    const mw        = document.getElementById("myActMasrafWrapper");
    const mpw       = document.getElementById("myActMasrafOdemeWrapper");
    const tw        = document.getElementById("myActTahsilatWrapper");
    const pw        = document.getElementById("myActPosTipiWrapper");
    const ptw       = document.getElementById("myActPosTerminalWrapper");
    const isCollect = type === "CHECK_COLLECT" || type === "NOTE_COLLECT";
    if (mw)  mw.style.display  = type === "EXPENSE_ADD" ? "flex" : "none";
    if (mpw) mpw.style.display = type === "EXPENSE_ADD" ? "flex" : "none";
    if (tw)  tw.style.display  = isCollect              ? "flex" : "none";
    if (pw)  pw.style.display  = type === "POS_LOG"     ? "flex" : "none";
    if (ptw) ptw.style.display = "none";
    const ptSel = document.getElementById("myActPosTipi");
    if (ptSel) ptSel.value = "";
    const termSel = document.getElementById("myActPosTerminal");
    if (termSel) termSel.innerHTML = '<option value="">Tümü</option>';
}
window.onMyActFilterTypeChange = onMyActFilterTypeChange;

function _parseDetailsJson(item) {
    const raw = item.detailsJson || item.details || {};
    return _myParseMaybeJson(raw);
}

function _myParseMaybeJson(raw) {
    if (!raw) return {};
    if (typeof raw !== "string") return raw;
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === "string" ? _myParseMaybeJson(parsed) : parsed;
    } catch {
        return {};
    }
}

function _normalizePaymentMethod(value) {
    const v = String(value || "").trim().toUpperCase();
    if (!v) return "";
    if (v === "CREDIT_CARD" || v.includes("KREDI") || v.includes("KREDİ") || v.includes("CARD")) return "CREDIT_CARD";
    if (v === "CASH" || v.includes("NAKIT") || v.includes("NAKİT")) return "CASH";
    return v;
}

function _extractExpenseMeta(item) {
    const dj = _parseDetailsJson(item);
    const payload = _myParseMaybeJson(dj?.payload);
    const request = _myParseMaybeJson(dj?.request);
    const expense = _myParseMaybeJson(dj?.expense);
    const data = _myParseMaybeJson(dj?.data);
    const newData = _myParseMaybeJson(dj?.newData);
    const candidates = [payload, request, expense, data, newData, dj, item].filter(Boolean);

    const deepFind = (source, key, seen = new Set()) => {
        if (!source || typeof source !== "object" || seen.has(source)) return "";
        seen.add(source);
        if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
        for (const value of Object.values(source)) {
            const parsed = _myParseMaybeJson(value);
            const found = deepFind(parsed, key, seen);
            if (found !== "") return found;
        }
        return "";
    };

    const first = (key) => {
        for (const source of candidates) {
            const found = deepFind(source, key);
            if (found !== "") return found;
        }
        return "";
    };

    return {
        expenseType: item.expenseType || payload.expenseType || first("expenseType"),
        paymentMethod: _normalizePaymentMethod(item.paymentMethod || payload.paymentMethod || first("paymentMethod")),
    };
}

function _expenseFilterMatches(item, filters) {
    if ((item.action || "") !== "EXPENSE_ADD") return false;
    const meta = _extractExpenseMeta(item);

    if (filters.masrafTuru && meta.expenseType !== filters.masrafTuru) return false;
    if (filters.masrafOdemeSekli && meta.paymentMethod !== filters.masrafOdemeSekli) return false;
    return true;
}

function _extractCollectType(item) {
    const dj = _myParseMaybeJson(item.detailsJson || item.details || {});
    const payload  = _myParseMaybeJson(dj?.payload);
    const request  = _myParseMaybeJson(dj?.request);
    const data     = _myParseMaybeJson(dj?.data);
    const candidates = [payload, request, data, dj, item].filter(Boolean);

    const deepFind = (source, key, seen = new Set()) => {
        if (!source || typeof source !== "object" || seen.has(source)) return "";
        seen.add(source);
        if (source[key] !== undefined && source[key] !== null && source[key] !== "") return String(source[key]);
        for (const value of Object.values(source)) {
            const parsed = _myParseMaybeJson(value);
            const found  = deepFind(parsed, key, seen);
            if (found !== "") return found;
        }
        return "";
    };

    for (const source of candidates) {
        const found = deepFind(source, "collectType");
        if (found) return found;
    }
    const desc = (item.description || "").toLowerCase();
    if (desc.includes("teminat") || desc.includes("collateral")) return "COLLATERAL";
    if (desc.includes("banka")   || desc.includes("bank"))       return "BANK";
    return "CASH";
}

function _myCollectActionBadge(item) {
    const action  = item.action || "";
    const isCheck = action === "CHECK_COLLECT";
    const isNote  = action === "NOTE_COLLECT";
    if (!isCheck && !isNote) return actionBadge(action);

    const prefix = isCheck ? "Çek" : "Senet";
    const ct = _extractCollectType(item);
    if (ct === "BANK")       return `<span class="badge" style="background:#3b82f6;color:#fff">${prefix} Bankaya Tahsil</span>`;
    if (ct === "COLLATERAL") return `<span class="badge" style="background:#f59e0b;color:#fff">${prefix} Teminata Çıktı</span>`;
    return `<span class="badge badge-success">${prefix} Kasaya Tahsil</span>`;
}

function _paymentMethodBadge(item) {
    if ((item.action || "") !== "EXPENSE_ADD") return "";
    const method = _extractExpenseMeta(item).paymentMethod;
    if (!method) return "";
    const label = method === "CREDIT_CARD" ? "Kredi Kartı" : method === "CASH" ? "Nakit" : method;
    const color = method === "CREDIT_CARD" ? "#f59e0b" : "#22c55e";
    return ` <span class="badge" style="background:${color};color:#fff;font-size:10px;margin-left:6px">${escapeHtml(label)}</span>`;
}

function _parsePosDate(l) {
    // logDate öncelikli — backend bu alanı kullanıyor
    const raw = l.logDate ?? l.createdAt ?? l.date ?? l.timestamp ?? l.createdDate ?? l.transactionDate ?? null;
    if (raw == null) return null;
    // Java LocalDateTime dizi: [year, month(1-based), day, hour, min, sec, nano?]
    if (Array.isArray(raw)) {
        const [y, mo, d, h = 0, mi = 0, s = 0] = raw;
        const dt = new Date(y, mo - 1, d, h, mi, s);
        return isNaN(dt.getTime()) ? null : dt.toISOString();
    }
    // Sayısal timestamp (ms)
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

async function _fetchMyPosRows(filters = {}) {
    const token = sessionStorage.getItem("token");
    let url = `${API_BASE}/pos/logs`;
    const params = [];
    if (filters.startDate) params.push(`start=${filters.startDate}T00:00:00`);
    if (filters.endDate)   params.push(`end=${filters.endDate}T23:59:59`);
    if (params.length) url += "?" + params.join("&");

    const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    if (!res.ok) return [];
    const data = await res.json();
    let logs = Array.isArray(data) ? data : (data.content || data.data || []);

    if (filters.posTipi)     logs = logs.filter(l => l.posType  === filters.posTipi);
    if (filters.posTerminal) logs = logs.filter(l => l.terminal === filters.posTerminal);

    return logs.map(l => {
        const iso = _parsePosDate(l);
        const posLabel = _MY_POS_TYPE_LABELS[l.posType] || l.posType || "";
        return {
            createdAt:   iso,
            action:      "POS_LOG",
            posType:     l.posType    || "",
            terminal:    l.terminal   || "",
            entityId:    l.id         || null,
            _rawDesc:    l.description || "",
            description: [posLabel, l.terminal].filter(Boolean).join(" — ") + (l.description ? " | " + l.description : ""),
            amount:      l.amount || 0,
        };
    });
}

async function loadMyActivitiesAndPos(filters = {}) {
    const tbody = document.getElementById("myActivitiesTableBody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:20px;color:#64748b">Yükleniyor...</td></tr>`;

    let auditData = [];
    try {
        const isAdmin = sessionStorage.getItem("role") === "ADMIN";

        if (filters.action === "EXPENSE_ADD" && (filters.masrafTuru || filters.masrafOdemeSekli)) {
            if (isAdmin) {
                // Admin: /audit-logs detailsJson içeriyor — kesin filtreleme
                const token    = sessionStorage.getItem("token");
                const username = _getMyUsername().toLowerCase();
                let url = `${API_BASE}/audit-logs?action=EXPENSE_ADD&size=500`;
                if (filters.startDate) url += `&start=${filters.startDate}T00:00:00`;
                if (filters.endDate)   url += `&end=${filters.endDate}T23:59:59`;
                const res  = await fetch(url, { headers: { Authorization: "Bearer " + token } });
                if (!res.ok) throw new Error("audit-logs " + res.status);
                const data = await res.json();
                const rows = Array.isArray(data) ? data : (data.content || data.data || []);
                auditData  = rows.filter(item => {
                    if (username && (item.username || "").toLowerCase() !== username) return false;
                    return _expenseFilterMatches(item, filters);
                });
            } else {
                // Normal kullanıcı: /audit-logs/my-actions detailsJson içeriyor
                const token = sessionStorage.getItem("token");
                let url = `${API_BASE}/audit-logs/my-actions?page=0&size=500`;
                const res  = await fetch(url, { headers: { Authorization: "Bearer " + token } });
                if (!res.ok) throw new Error("my-actions " + res.status);
                const data = await res.json();
                const rows = Array.isArray(data) ? data : (data.content || data.data || []);
                auditData  = rows.filter(item => {
                    return _expenseFilterMatches(item, filters);
                });
                // Tarih filtresi uygula (my-actions query param desteklemiyorsa client-side)
                if (filters.startDate || filters.endDate) {
                    const s = filters.startDate ? new Date(filters.startDate + "T00:00:00") : null;
                    const e = filters.endDate   ? new Date(filters.endDate   + "T23:59:59") : null;
                    auditData = auditData.filter(item => {
                        const d = new Date(item.createdAt || 0);
                        if (s && d < s) return false;
                        if (e && d > e) return false;
                        return true;
                    });
                }
            }
        } else if (filters.action && filters.action !== "POS_LOG") {
            const res = await myActivityApi.getFiltered({ ...filters, size: 500 });
            let rows  = Array.isArray(res) ? res : (res.content || res.data || []);
            if (filters.tahsilatTuru && (filters.action === "CHECK_COLLECT" || filters.action === "NOTE_COLLECT")) {
                rows = rows.filter(item => _extractCollectType(item) === filters.tahsilatTuru);
            }
            auditData = rows;
        } else if (filters.action !== "POS_LOG") {
            const res = await myActivityApi.getFiltered({ startDate: filters.startDate, endDate: filters.endDate, size: 500 });
            auditData = Array.isArray(res) ? res : (res.content || res.data || []);
        }
    } catch(e) {
        console.error("[loadMyActivitiesAndPos] hata:", e);
    }

    let posData = [];
    if (!filters.action || filters.action === "" || filters.action === "POS_LOG") {
        try {
            posData = await _fetchMyPosRows(filters);
        } catch(e) {
            console.error("[loadMyActivitiesAndPos] POS hata:", e);
        }
    }

    const filteredAuditData = auditData.filter(item => item.action !== "POS_LOG");
    const all = [...filteredAuditData, ...posData].sort((a, b) =>
        new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
    );

    renderMyActivities(all);
}

function _generateMyActivitiesPdf() {
    const data = _myActCurrentData;
    if (!data || !data.length) { showToast("Gösterilecek işlem yok", "error"); return; }

    const username = _getMyUsername() || sessionStorage.getItem("username") || "";
    const today    = new Date().toLocaleDateString("tr-TR");
    const fmtMoney = n => Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });

    // Güncelleme isteklerini PDF'den çıkar
    const pdfData = data.filter(item => !isChangeRequestItem(item));

    // İstenen PDF sırasına göre grupla
    const groups = {};
    pdfData.forEach(item => {
        const key = _myPdfGroupLabel(item.action);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    let totalIncome = 0, totalExpense = 0;
    let cashIncome = 0, cashExpense = 0, expenseAdd = 0;
    let rowsHtml = "";

    const orderedGroups = [
        ..._MY_PDF_GROUP_ORDER.map(g => g.key),
        ...Object.keys(groups).filter(key => !_MY_PDF_GROUP_ORDER.some(g => g.key === key)).sort((a, b) => a.localeCompare(b, "tr")),
    ];

    orderedGroups.forEach(catLabel => {
        const items = groups[catLabel] || [];
        if (!items.length) return;
        items.sort((a, b) => new Date(a.createdAt || a.date || a.requestedAt || 0) - new Date(b.createdAt || b.date || b.requestedAt || 0));

        let groupIncome = 0;
        let groupExpense = 0;
        rowsHtml += `<tr style="background:#dbe4f3"><td colspan="4" style="padding:6px 8px;font-weight:700;color:#1e3a5f;font-size:12px">${catLabel}</td></tr>`;
        items.forEach(item => {
            const isChReq = isChangeRequestItem(item);
            const _dv2 = item.createdAt || item.date || item.requestedAt || null;
            const dateStr = _dv2 ? formatDateTime(_dv2) : "—";
            const amt = Number(item.amount || 0);
            const isInc = _isIncome(item); // true | false | null
            if (!isChReq) {
                if (isInc === true)  { totalIncome  += amt; groupIncome  += amt; }
                if (isInc === false) { totalExpense += amt; groupExpense += amt; }
                if (item.action === "CASH_INCOME")  cashIncome  += amt;
                if (item.action === "CASH_EXPENSE") cashExpense += amt;
                if (item.action === "EXPENSE_ADD")  expenseAdd  += amt;
            }
            const amtStr   = isChReq ? "—" : isInc === null ? fmtMoney(amt) + " TL" : (isInc ? "+" : "-") + fmtMoney(amt) + " TL";
            const amtColor = isChReq ? "#666" : isInc === null ? "#64748b" : (isInc ? "#16a34a" : "#dc2626");
            const desc     = _myBuildDisplayDesc(item);
            rowsHtml += `<tr>
              <td>${dateStr}</td>
              <td>${catLabel}</td>
              <td>${desc}</td>
              <td style="text-align:right;color:${amtColor};font-weight:600">${amtStr}</td>
            </tr>`;
        });
        const groupNet = groupIncome - groupExpense;
        const groupTotalColor = groupNet >= 0 ? "#16a34a" : "#dc2626";
        rowsHtml += `<tr style="background:#f8fafc">
          <td colspan="3" style="text-align:right;font-weight:700;color:#1e3a5f">${catLabel} Toplamı</td>
          <td style="text-align:right;font-weight:700;color:${groupTotalColor}">${groupNet >= 0 ? "+" : "-"}${fmtMoney(Math.abs(groupNet))} TL</td>
        </tr>`;
    });

    const net = totalIncome - totalExpense;
    const netNakit = cashIncome - cashExpense - expenseAdd;
    const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"><title>İşlem Raporu</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;padding:24px}
  h1{text-align:center;font-size:20px;margin-bottom:6px}
  .sub{text-align:center;color:#555;font-size:13px;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{background:#1e3a5f;color:#fff;padding:7px 8px;text-align:left;font-size:12px}
  td{padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px}
  .sum{width:auto;margin-top:20px;margin-left:auto}
  .sum th{background:#f1f5f9;color:#1e3a5f;text-align:right}
  .sum td{text-align:right;font-weight:700;font-size:13px}
  @media print{body{padding:8px}}
</style></head><body>
<h1>İşlem Raporu</h1>
<div class="sub">Kullanıcı: ${username}</div>
<div class="sub">Tarih: ${today}</div>
<table>
  <thead><tr><th>Tarih</th><th>İşlem Türü</th><th>Açıklama</th><th style="text-align:right">Tutar</th></tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
<table class="sum">
  <tr><th colspan="2" style="text-align:center">Toplam Detay</th></tr>
  <tr><th>Toplam Giriş</th><td style="color:#16a34a">+${fmtMoney(totalIncome)} TL</td></tr>
  <tr><th>Toplam Çıkış</th><td style="color:#dc2626">-${fmtMoney(totalExpense)} TL</td></tr>
  <tr><th>Net</th><td style="color:${net>=0?"#16a34a":"#dc2626"}">${net>=0?"+":"-"}${fmtMoney(Math.abs(net))} TL</td></tr>
  <tr style="border-top:2px solid #1e3a5f">
    <th style="font-size:14px">Toplam Net Nakit</th>
    <td style="color:${netNakit>=0?"#16a34a":"#dc2626"};font-size:15px;font-weight:800">${netNakit>=0?"+":"-"}${fmtMoney(Math.abs(netNakit))} TL</td>
  </tr>
</table>
<script>setTimeout(()=>window.print(),400);</script>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w) { showToast("Popup engellendi, tarayıcı izinlerini kontrol edin", "error"); return; }
    w.document.write(html);
    w.document.close();
}

async function initMyActivitiesPage() {
    loadMyActivitiesAndPos();

    document.getElementById("btnMyActFiltrele")?.addEventListener("click", () => {
        loadMyActivitiesAndPos(_getMyActParams());
    });

    document.getElementById("btnMyActTemizle")?.addEventListener("click", () => {
        document.getElementById("myActFilterType").value  = "";
        document.getElementById("myActFilterStart").value = "";
        document.getElementById("myActFilterEnd").value   = "";
        const mt  = document.getElementById("myActMasrafTuru");        if (mt)  mt.value  = "";
        const mo  = document.getElementById("myActMasrafOdemeSekli"); if (mo)  mo.value  = "";
        const tt  = document.getElementById("myActTahsilatTuru");      if (tt)  tt.value  = "";
        const pt  = document.getElementById("myActPosTipi");            if (pt)  pt.value  = "";
        const pterm = document.getElementById("myActPosTerminal");      if (pterm) { pterm.value = ""; pterm.innerHTML = '<option value="">Tümü</option>'; }
        const mw  = document.getElementById("myActMasrafWrapper");     if (mw)  mw.style.display  = "none";
        const mpw = document.getElementById("myActMasrafOdemeWrapper"); if (mpw) mpw.style.display = "none";
        const tw  = document.getElementById("myActTahsilatWrapper");   if (tw)  tw.style.display  = "none";
        const pw  = document.getElementById("myActPosTipiWrapper");    if (pw)  pw.style.display  = "none";
        const ptw = document.getElementById("myActPosTerminalWrapper"); if (ptw) ptw.style.display = "none";
        loadMyActivitiesAndPos();
    });

    document.getElementById("btnMyActPdf")?.addEventListener("click", () => {
        _generateMyActivitiesPdf();
    });
}

let currentEditId   = null;
let currentEditType = null;

const CHECK_ACTIONS = new Set(["CHECK_IN", "CHECK_COLLECT", "CHECK_ENDORSE", "CHECK_OUT"]);
const NOTE_ACTIONS  = new Set(["NOTE_IN",  "NOTE_COLLECT",  "NOTE_ENDORSE"]);

function openEditModal(item) {
    currentEditId   = item.entityId || item.id;
    currentEditType = item.action;

    const isCheck  = CHECK_ACTIONS.has(item.action);
    const isNote   = NOTE_ACTIONS.has(item.action);
    const isPosLog = item.action === "POS_LOG";

    const title = document.getElementById("editModalTitle");
    if (title) title.textContent = isCheck ? "Çek Düzenle" : isNote ? "Senet Düzenle" : isPosLog ? "POS İşlemi Düzenle" : "İşlem Düzenle";

    document.getElementById("editCheckFields").style.display = isCheck  ? "" : "none";
    document.getElementById("editNoteFields").style.display  = isNote   ? "" : "none";
    document.getElementById("editPosFields").style.display   = isPosLog ? "" : "none";

    document.getElementById("editAmount").value = item.amount ? formatMoney(item.amount) : "";
    document.getElementById("editDesc").value   = isPosLog ? (item._rawDesc || "") : (item.description || "");

    if (isCheck) {
        document.getElementById("editCheckNo").value  = item.checkNo || "";
        document.getElementById("editBank").value     = item.bank    || "";
        document.getElementById("editDueDate").value  = item.dueDate || "";
    }

    if (isNote) {
        document.getElementById("editNoteNo").value      = item.noteNo  || "";
        document.getElementById("editNoteDueDate").value = item.dueDate || "";
    }

    if (isPosLog) {
        const posTypeSel = document.getElementById("editPosType");
        if (posTypeSel) { posTypeSel.value = item.posType || ""; onEditPosTypeChange(); }
        const termSel = document.getElementById("editPosTerminal");
        if (termSel) termSel.value = item.terminal || "";
        document.getElementById("editPosDate").value = "";
    }

    document.getElementById("editModal").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("active");
}

async function submitEditRequest() {
    const amountRaw = document.getElementById("editAmount").value;
    const amount    = parseMoney(amountRaw);
    const desc      = document.getElementById("editDesc").value.trim();

    if (!amountRaw || isNaN(amount) || amount <= 0) {
        showToast("Geçerli bir tutar giriniz", "error");
        return;
    }

    const submitBtn = document.querySelector("#editModal .btn-modern");

    // POS LOG düzenleme — ayrı endpoint
    if (currentEditType === "POS_LOG") {
        const posType  = document.getElementById("editPosType")?.value.trim()    || "";
        const terminal = document.getElementById("editPosTerminal")?.value.trim() || "";
        const posDate  = document.getElementById("editPosDate")?.value            || "";
        if (!posType || !terminal) { showToast("POS tipi ve terminal seçiniz", "error"); return; }
        const posData = { posType, terminal, amount, description: desc };
        if (posDate) posData.logDate = posDate.length === 16 ? posDate + ":00" : posDate;
        try {
            await withLoadingBtn(submitBtn, async () => {
                await posApi.submitChangeRequest(currentEditId, posData);
                showToast("Düzenleme talebi gönderildi, onay bekleniyor", "success");
                closeEditModal();
                loadMyActivitiesAndPos(_getMyActParams());
            });
        } catch (err) {
            showToast(err.message || "Hata oluştu", "error");
        }
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
        await withLoadingBtn(submitBtn, async () => {
            await myActivityApi.submitUpdateRequest(currentEditId, currentEditType, data);
            showToast("İstek gönderildi, onay bekleniyor", "success");
            closeEditModal();
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
        });
    } catch (err) {
        console.error("[submitEditRequest] Hata:", err);
        showToast(err.message || "Hata oluştu", "error");
    }
}

function onEditPosTypeChange() {
    const posType = document.getElementById("editPosType")?.value || "";
    const termSel = document.getElementById("editPosTerminal");
    if (!termSel) return;
    if (!posType) {
        termSel.innerHTML = `<option value="">Önce POS Tipi Seçiniz...</option>`;
        return;
    }
    const list = (typeof _getPosTerminalList === "function")
        ? _getPosTerminalList(posType)
        : (_POS_TERMINALS[posType] || []);
    const placeholder = posType === "ALTIKARDESLER_POS" ? "Banka Seçiniz..."
                      : posType === "TEDARIKCI_POS"      ? "Tedarikçi Seçiniz..."
                      : "Terminal Seçiniz...";
    termSel.innerHTML = `<option value="">${placeholder}</option>` +
        list.map(t => `<option value="${t.v}">${t.l}</option>`).join("");
}
window.onEditPosTypeChange = onEditPosTypeChange;

window.initMyActivitiesPage = initMyActivitiesPage;
