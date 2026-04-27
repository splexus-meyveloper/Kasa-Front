// ==============================
// REPORT UI MODULE
// ==============================

const EXPENSE_LABELS = {
  YEMEK:    "Yemek",
  MARKET:   "Market",
  CEZA:     "Ceza",
  ILETISIM: "İletişim",
  KARGO:    "Kargo",
  YAKIT:    "Yakıt",
  KIRA:     "Kira",
  MAAS:     "Maaş",
  DIGER:    "Diğer",
};

const MONTH_NAMES = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

let _reportStart = "";
let _reportEnd   = "";

// ==============================
// DATE HELPERS
// ==============================

function _fmt(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function _getRange(period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (period === "thisMonth") {
    return { start: _fmt(new Date(y, m, 1)), end: _fmt(now) };
  }
  if (period === "lastMonth") {
    const first = new Date(y, m - 1, 1);
    const last  = new Date(y, m, 0);
    return { start: _fmt(first), end: _fmt(last) };
  }
  if (period === "thisYear") {
    return { start: _fmt(new Date(y, 0, 1)), end: _fmt(now) };
  }
  return null;
}

function _formatMonth(str) {
  // "2024-01" → "Oca 2024"
  const [y, mo] = str.split("-");
  return (MONTH_NAMES[parseInt(mo, 10) - 1] || mo) + " " + y;
}

// ==============================
// DUE BADGE
// ==============================

function _dueBadge(daysLeft) {
  if (daysLeft <= 0)  return `<span class="badge" style="background:#ef4444;color:#fff">Vadesi Geçti</span>`;
  if (daysLeft <= 7)  return `<span class="badge" style="background:#ef4444;color:#fff">${daysLeft} gün</span>`;
  if (daysLeft <= 15) return `<span class="badge" style="background:#f59e0b;color:#fff">${daysLeft} gün</span>`;
  return `<span class="badge" style="background:#22c55e;color:#fff">${daysLeft} gün</span>`;
}

// ==============================
// RENDER FUNCTIONS
// ==============================

function _renderSummary(d) {
  const net = d.netBalance ?? 0;
  const netColor = net >= 0 ? "#22c55e" : "#ef4444";

  document.getElementById("rTotalIncome").textContent  = formatMoney(d.totalIncome  ?? 0) + " TL";
  document.getElementById("rTotalExpense").textContent = formatMoney(d.totalExpense ?? 0) + " TL";
  document.getElementById("rCashBalance").textContent  = formatMoney(d.currentCashBalance ?? 0) + " TL";

  const netEl = document.getElementById("rNetBalance");
  netEl.textContent = formatMoney(net) + " TL";
  netEl.style.color = netColor;
}

function _renderMonthly(rows) {
  const tbody = document.getElementById("rMonthlyBody");
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Veri yok</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const net = (r.income ?? 0) - (r.expense ?? 0);
    const netColor = net >= 0 ? "#22c55e" : "#ef4444";
    return `
      <tr>
        <td>${escapeHtml(_formatMonth(r.month))}</td>
        <td class="text-end" style="color:#22c55e">${formatMoney(r.income ?? 0)} TL</td>
        <td class="text-end" style="color:#ef4444">${formatMoney(r.expense ?? 0)} TL</td>
        <td class="text-end" style="color:${netColor};font-weight:600">${formatMoney(net)} TL</td>
      </tr>`;
  }).join("");
}

function _renderExpenseCategories(map) {
  const tbody = document.getElementById("rExpenseCatBody");
  if (!tbody) return;

  const entries = Object.entries(map || {});
  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted">Veri yok</td></tr>`;
    return;
  }

  entries.sort((a, b) => b[1] - a[1]);

  tbody.innerHTML = entries.map(([key, val]) => `
    <tr>
      <td>${escapeHtml(EXPENSE_LABELS[key] || key)}</td>
      <td class="text-end">${formatMoney(val)} TL</td>
    </tr>`).join("");
}

function _renderUpcomingChecks(list) {
  const tbody = document.getElementById("rUpcomingChecksBody");
  const badge = document.getElementById("rCheckPortfolio");
  if (!tbody) return;

  if (badge) {
    badge.textContent = `${list?.length ?? 0} çek · Toplam: ${formatMoney(
      (list || []).reduce((s, c) => s + (c.amount ?? 0), 0)
    )} TL`;
  }

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Veri yok</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td>${escapeHtml(c.no || "-")}</td>
      <td>${escapeHtml(BANK_LABELS[c.bank] || c.bank || "-")}</td>
      <td class="text-end">${formatMoney(c.amount)} TL</td>
      <td>${escapeHtml(c.dueDate || "-")}</td>
      <td class="text-center">${_dueBadge(c.daysLeft)}</td>
    </tr>`).join("");
}

function _renderUpcomingNotes(list) {
  const tbody = document.getElementById("rUpcomingNotesBody");
  const badge = document.getElementById("rNotePortfolio");
  if (!tbody) return;

  if (badge) {
    badge.textContent = `${list?.length ?? 0} senet · Toplam: ${formatMoney(
      (list || []).reduce((s, n) => s + (n.amount ?? 0), 0)
    )} TL`;
  }

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Veri yok</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(n => `
    <tr>
      <td>${escapeHtml(n.no || "-")}</td>
      <td class="text-end">${formatMoney(n.amount)} TL</td>
      <td>${escapeHtml(n.dueDate || "-")}</td>
      <td class="text-center">${_dueBadge(n.daysLeft)}</td>
    </tr>`).join("");
}

function _renderActiveLoans(list, totalDebt) {
  const tbody = document.getElementById("rActiveLoansBody");
  const badge = document.getElementById("rTotalLoanDebt");
  if (!tbody) return;

  if (badge) {
    badge.textContent = `Toplam Borç: ${formatMoney(totalDebt ?? 0)} TL`;
  }

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Aktif kredi yok</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(l => `
    <tr>
      <td>${escapeHtml(BANK_LABELS[l.bankName] || l.bankName || "-")}</td>
      <td class="text-end">${formatMoney(l.monthlyPayment)} TL</td>
      <td class="text-end">${formatMoney(l.remainingDebt)} TL</td>
      <td class="text-center">${l.remainingInstallments ?? "-"}</td>
      <td>${escapeHtml(l.nextPaymentDate || "-")}</td>
    </tr>`).join("");
}

// ==============================
// LOAD REPORT
// ==============================

function _setLoadingState() {
  const cols = { rMonthlyBody: 4, rExpenseCatBody: 2, rUpcomingChecksBody: 5, rUpcomingNotesBody: 4, rActiveLoansBody: 5 };
  Object.entries(cols).forEach(([id, span]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<tr><td colspan="${span}" class="text-center text-muted">Yükleniyor...</td></tr>`;
  });
  ["rCheckPortfolio","rNotePortfolio","rTotalLoanDebt"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
  ["rTotalIncome","rTotalExpense","rNetBalance","rCashBalance"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "—";
  });
}

function _setErrorState() {
  const cols = { rMonthlyBody: 4, rExpenseCatBody: 2, rUpcomingChecksBody: 5, rUpcomingNotesBody: 4, rActiveLoansBody: 5 };
  Object.entries(cols).forEach(([id, span]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<tr><td colspan="${span}" class="text-center" style="color:#ef4444">Yüklenemedi</td></tr>`;
  });
}

async function loadReport(start, end) {
  _reportStart = start;
  _reportEnd   = end;

  _setLoadingState();

  try {
    const data = await apiClient.request(`/reports?startDate=${start}&endDate=${end}`);
    if (!data) { _setErrorState(); return; }

    _renderSummary(data);
    _renderMonthly(data.monthlyBreakdown);
    _renderExpenseCategories(data.expenseByCategory);
    _renderUpcomingChecks(data.upcomingChecks);
    _renderUpcomingNotes(data.upcomingNotes);
    _renderActiveLoans(data.activeLoans, data.totalLoanDebt);
  } catch (err) {
    console.error("[loadReport] Hata:", err);
    _setErrorState();
    showToast(err.message || "Rapor yüklenemedi", "error");
  }
}

// ==============================
// EXCEL DOWNLOAD
// ==============================

async function downloadReportExcel() {
  if (!_reportStart || !_reportEnd) return;

  const btn = document.getElementById("excelDownloadBtn");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i> İndiriliyor...'; }

  try {
    const token = sessionStorage.getItem("token");
    const res = await fetch(
      API_BASE + `/reports/export/excel?startDate=${_reportStart}&endDate=${_reportEnd}`,
      { headers: { Authorization: "Bearer " + token } }
    );

    if (!res.ok) throw new Error("Excel indirilemedi");

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `rapor_${_reportStart}_${_reportEnd}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    showToast(err.message || "Excel indirilemedi", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="zmdi zmdi-download"></i> Excel İndir'; }
  }
}

// ==============================
// EVENT LISTENERS
// ==============================

document.addEventListener("click", function (e) {
  // Dönem butonları
  const periodBtn = e.target.closest(".report-period-btn");
  if (periodBtn) {
    document.querySelectorAll(".report-period-btn").forEach(b => b.classList.remove("active"));
    periodBtn.classList.add("active");

    const period = periodBtn.dataset.period;
    const customWrap = document.getElementById("customDateRange");

    if (period === "custom") {
      if (customWrap) customWrap.style.display = "flex";
    } else {
      if (customWrap) customWrap.style.display = "none";
      const range = _getRange(period);
      if (range) loadReport(range.start, range.end);
    }
    return;
  }

  // Özel aralık uygula
  if (e.target.closest("#reportApplyBtn")) {
    const s = document.getElementById("reportStartDate")?.value;
    const e2 = document.getElementById("reportEndDate")?.value;
    if (!s || !e2) { showToast("Başlangıç ve bitiş tarihini seçin", "error"); return; }
    if (s > e2)   { showToast("Başlangıç tarihi bitiş tarihinden büyük olamaz", "error"); return; }
    loadReport(s, e2);
    return;
  }

  // Excel indir
  if (e.target.closest("#excelDownloadBtn")) {
    downloadReportExcel();
  }
});

// ==============================
// PAGE INIT
// ==============================

function initReportPage() {
  const range = _getRange("thisMonth");
  loadReport(range.start, range.end);
}

window.initReportPage = initReportPage;
