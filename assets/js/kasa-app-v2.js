let kasaChart = null;

// ==============================
// CONFIG
// ==============================
const API_BASE = "http://localhost:8080";

// ==============================
// UTIL
// ==============================

// ==============================
// PAGE LOADER (LAYOUT SYSTEM)
// ==============================
function loadPage(page){

  window.currentPage = page;
  localStorage.setItem('lastPage', page);

  const container = document.getElementById("pageContent");
  if(!container) return;

  fetch(page)
    .then(r => r.text())
    .then(html => {

      container.innerHTML = html;

      // sayfa yüklendiğinde gerekli modülleri çalıştır
      initPageModules();

    })
    .catch(err => {
      console.error("Page load error:", err);
    });

}

window.loadPage = loadPage;

function parseMoney(value) {
  if (!value) return 0;
  return parseFloat(
    String(value)
      .replace(" TL", "")
      .replace(/\./g, "")
      .replace(",", ".")
  ) || 0;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " TL";
}

const bankMap = {
  ZIRAAT: "Ziraat Bankası",
  IS_BANKASI: "İş Bankası",
  GARANTI_BBVA: "Garanti BBVA",
  AKBANK: "Akbank",
  YAPI_KREDI: "Yapı Kredi",
  HALKBANK: "Halkbank",
  VAKIFBANK: "VakıfBank",
  QNB_FINANSBANK: "QNB Finansbank",
  DENIZBANK: "DenizBank",
  TEB: "TEB",
  DIGER: "Diğer"
};

function formatBank(bank) {
  return bankMap[bank] || bank;
}

function getAuthHeaders(json = false) {
  const headers = {
    Authorization: "Bearer " + localStorage.getItem("token")
  };

  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function animateValue(el, endValue) {
  if (!el) return;

  const duration = 800;
  const startTime = performance.now();
  const safeEnd = Number(endValue || 0);

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(progress * safeEnd);

    el.innerText = value.toLocaleString("tr-TR", {
      minimumFractionDigits: 2
    }) + " TL";

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function setAutoBar(barId, value, maxValue) {
  const el = document.getElementById(barId);
  if (!el) return;

  let percent = 0;
  if (maxValue > 0) percent = (Number(value || 0) / maxValue) * 100;
  if (percent > 100) percent = 100;

  el.style.width = percent + "%";

  if (percent < 50) {
    el.style.background = "linear-gradient(90deg,#00C853,#69F0AE)";
  } else if (percent < 80) {
    el.style.background = "linear-gradient(90deg,#FFC107,#FFD54F)";
  } else {
    el.style.background = "linear-gradient(90deg,#FF1744,#FF8A80)";
  }
}

function getDueStatus(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { class: "due-over", text: "Vadesi Geçti" };
  if (diffDays === 0) return { class: "due-today", text: "Bugün" };
  if (diffDays <= 3) return { class: "due-critical", text: `${diffDays} gün kaldı` };
  if (diffDays <= 7) return { class: "due-warning", text: `${diffDays} gün kaldı` };

  return null;
}

// ==============================
// UI
// ==============================
function showToast(message, type = "success") {
  const box = document.getElementById("toastBox");
  if (!box) return;

  const t = document.createElement("div");
  t.className = "toast " + type;

  let icon = "✔";
  if (type === "error") icon = "✖";
  if (type === "info") icon = "ℹ";

  t.innerHTML = `<span>${icon}</span> ${message}`;
  box.appendChild(t);

  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(20px)";
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

function showConfirmToast(message, onConfirm) {
  const box = document.getElementById("toastBox");
  if (!box) return;

  const toast = document.createElement("div");
  toast.className = "toast warning";
  toast.innerHTML = `
    ${message}
    <div style="margin-top:8px">
      <button id="yesBtn">Evet</button>
      <button id="noBtn">Hayır</button>
    </div>
  `;

  box.appendChild(toast);

  toast.querySelector("#yesBtn").onclick = () => {
    onConfirm();
    toast.remove();
  };

  toast.querySelector("#noBtn").onclick = () => toast.remove();
  setTimeout(() => toast.remove(), 7000);
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
window.logout = logout;

// ==============================
// MONEY MASK
// ==============================
function tutarInputMask(input) {
  if (!input || input.dataset.masked === "true") return;

  input.addEventListener("input", function () {
    let raw = this.value.replace(" TL", "").replace(/\D/g, "");

    if (raw === "") {
      this.value = "";
      return;
    }

    this.value = Number(raw).toLocaleString("tr-TR") + " TL";
  });

  input.dataset.masked = "true";
}

document.body.addEventListener("focusin", function (e) {
  if (["tutar", "krediTutar", "krediAylik"].includes(e.target.id)) {
    tutarInputMask(e.target);
  }
});

// ==============================
// AUTH / PERMISSIONS
// ==============================
function getPermissions() {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "[]");
  } catch {
    return [];
  }
}

function applyPermissionsFromToken() {
  const perms = getPermissions();
  document.querySelectorAll("[data-perm]").forEach((el) => {
    const p = el.getAttribute("data-perm");
    if (p && !perms.includes(p)) el.style.display = "none";
  });
}

function checkPagePermission() {
  const perms = getPermissions().map((p) => p.toUpperCase());
  const path = (location.pathname || "").toUpperCase();

  const deny = (perm) => {
    if (!perms.includes(perm)) window.location.href = "layout.html";
  };

  if (path.includes("KREDI")) deny("KREDILER");
  if (path.includes("KASA")) deny("KASA");
  if (path.includes("CEK")) deny("CEK");
  if (path.includes("SENET")) deny("SENET");
  if (path.includes("MASRAF")) deny("MASRAF");
  if (path.includes("KULLANICI")) deny("KULLANICI_YONETIMI");
}


// ==============================
// DASHBOARD
// ==============================
function loadKasaChart(girisData, cikisData, labels) {
  const canvas = document.getElementById("chartjs-revenue-statistics-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  if (kasaChart) kasaChart.destroy();

  kasaChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Kasa Giriş",
          data: girisData,
          borderColor: "#00C853",
          backgroundColor: "rgba(0,200,83,0.35)",
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: "Kasa Çıkış",
          data: cikisData,
          borderColor: "#FF1744",
          backgroundColor: "rgba(255,23,68,0.35)",
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800 },
      scales: {
        x: {
          grid: { color: "rgba(0, 0, 0, 0.28)", lineWidth: 1.2 },
          ticks: { color: "#0e0e0e", font: { weight: "bold" } }
        },
        y: {
          grid: { color: "rgba(0, 0, 0, 0.27)", lineWidth: 1.2 },
          ticks: { color: "#000000", font: { weight: "bold" } }
        }
      }
    }
  });
}

async function loadDashboard() {
  const gi = document.getElementById("gunlukGiris");
  const gc = document.getElementById("gunlukCikis");
  const an = document.getElementById("aylikNet");
  const kb = document.getElementById("kasaBakiye");
  const krediBorc = document.getElementById("toplamKrediBorc");

  if (!gi || !gc || !an || !kb) return;

  const res = await fetch(`${API_BASE}/api/dashboard`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return;

  const d = await res.json();

  animateValue(gi, Number(d.todayIncome || 0));
  animateValue(gc, Number(d.todayExpense || 0));
  animateValue(an, Number(d.monthlyNet || 0));
  animateValue(kb, Number(d.balance || 0));
  if (krediBorc) animateValue(krediBorc, Number(d.totalLoanDebt || 0));

  setAutoBar("barGunlukGiris", d.todayIncome || 0, 500000);
  setAutoBar("barGunlukCikis", d.todayExpense || 0, 500000);
  setAutoBar("barBakiye", d.balance || 0, 500000);
  setAutoBar("barAylikGiris", d.monthlyNet || 0, 500000);
  setAutoBar("barKredi", d.totalLoanDebt || 0, 1000000);
}

async function loadChart() {
  const canvas = document.getElementById("chartjs-revenue-statistics-chart");
  if (!canvas) return;

  const res = await fetch(`${API_BASE}/api/dashboard/chart`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return;

  const d = await res.json();
  loadKasaChart(d.incomes.map(Number), d.expenses.map(Number), d.labels);
}

function initDashboard() {
  const canvas = document.getElementById("chartjs-revenue-statistics-chart");
  if (!canvas) return;

  loadDashboard();
  loadChart();
  loadCheckSummary();
  loadNotesDashboard();
}

// ==============================
// CASH
// ==============================
async function submitCash(endpoint, successMessage) {
  let tutar = document.getElementById("tutar")?.value || "";
  let aciklama = document.getElementById("aciklama")?.value || "";

  const amount = parseMoney(tutar);
  if (!amount) {
    showToast("Tutar giriniz", "error");
    return;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ amount, description: aciklama })
  });

  if (res.ok) {
    showToast(successMessage, "success");
    setTimeout(() => {
      loadPage("index.html");
      setTimeout(() => initDashboard(), 300);
    }, 1200);
  } else {
    showToast("Hata oluştu", "error");
  }
}

// ==============================
// EXPENSES
// ==============================
async function addExpense() {
  const typeEl = document.getElementById("expenseType");
  const tutarEl = document.getElementById("tutar");
  const descEl = document.getElementById("description");

  if (!typeEl || !tutarEl || !descEl) {
    showToast("Form alanları bulunamadı", "error");
    return;
  }

  const payload = {
    expenseType: typeEl.value,
    amount: parseMoney(tutarEl.value),
    description: descEl.value
  };

  const res = await fetch(`${API_BASE}/api/expenses`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showToast("Masraf eklendi", "success");
    setTimeout(() => loadPage("index.html"), 1200);
  } else {
    const text = await res.text();
    showToast("Masraf eklenemedi: " + (text || res.status), "error");
  }
}

// ==============================
// CHECKS
// ==============================
async function loadChecks() {
  const container = document.getElementById("checkContainer");
  if (!container) return;

  const res = await fetch(`${API_BASE}/api/checks/portfolio`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return;

  const checks = await res.json();
  container.innerHTML = "";

  checks.forEach((c) => {
    const due = getDueStatus(c.dueDate);
    const dueClass = due ? due.class : "";
    const dueBadge = due ? `<span class="due-badge ${due.class}">${due.text}</span>` : "";

    let statusClass = "status-portfolio";
    let statusText = "Portföyde";

    if (c.status === "TAHSIL_EDILDI") {
      statusClass = "status-collected";
      statusText = "Tahsil Edildi";
    } else if (c.status === "CIRO_EDILDI") {
      statusClass = "status-endorsed";
      statusText = "Ciro Edildi";
    }

    const amount = formatMoney(c.amount);

    const card = `
<div class="col-xl-4 col-md-6 mb-30">
  <div class="box check-card ${statusClass} ${dueClass}">
    <div class="box-head d-flex justify-content-between align-items-center">
      <h5 class="title mb-0">${formatBank(c.bank)}</h5>
      <div class="check-actions">
        ${dueBadge}
        <span class="check-status ${statusClass}">${statusText}</span>
        <div class="check-menu">
          <button class="check-menu-btn"><i class="zmdi zmdi-more-vert"></i></button>
          <div class="check-menu-dropdown">
            <button onclick="collectCheck('${c.checkNo}','${c.bank}','${c.dueDate}')">
              <i class="zmdi zmdi-money"></i> Tahsil Et
            </button>
            <button onclick="endorseCheck('${c.checkNo}','${c.bank}','${c.dueDate}')">
              <i class="zmdi zmdi-share"></i> Ciro Et
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="box-body">
      <div class="check-info">
        <div class="check-row"><span class="label">Çek No</span><span class="value">${c.checkNo}</span></div>
        <div class="check-row"><span class="label">Vade</span><span class="value">${c.dueDate}</span></div>
        <div class="check-description">${c.description || "-"}</div>
      </div>
      <div class="check-amount">${amount}</div>
    </div>
  </div>
</div>`;

    container.insertAdjacentHTML("beforeend", card);
  });
}

async function loadCheckSummary() {
  const tutarEl = document.getElementById("cekToplamTutar");
  const adetEl = document.getElementById("cekAdet");
  if (!tutarEl || !adetEl) return;

  const res = await fetch(`${API_BASE}/api/checks/portfolio`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return;

  const checks = await res.json();
  const total = checks.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  tutarEl.innerText = formatMoney(total);
  adetEl.innerText = `${checks.length} adet çek`;
  setAutoBar("barCekler", Math.min(checks.length * 10, 100), 100);
}

async function collectCheck(checkNo, bank, dueDate) {
  const res = await fetch(`${API_BASE}/api/checks/collect`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ checkNo, bank, dueDate })
  });

  if (res.ok) {
    showToast(`Çek tahsil edildi • ${checkNo}`, "success");
    loadChecks();
  } else {
    showToast("Tahsil işlemi başarısız", "error");
  }
}
window.collectCheck = collectCheck;

async function endorseCheck(checkNo, bank, dueDate) {
  const res = await fetch(`${API_BASE}/api/checks/endorse`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ checkNo, bank, dueDate })
  });

  if (res.ok) {
    showToast(`Çek ciro edildi • ${checkNo}`, "success");
    loadChecks();
  } else {
    showToast("Ciro işlemi başarısız", "error");
  }
}
window.endorseCheck = endorseCheck;

// ==============================
// NOTES
// ==============================
function createFinancialCard(data, type) {
  const amount = formatMoney(data.amount);
  const due = getDueStatus(data.dueDate);
  const dueClass = due ? due.class : "";
  const dueBadge = due ? `<span class="due-badge ${due.class}">${due.text}</span>` : "";

  let title = "";
  let numberLabel = "";
  let numberValue = "";

  if (type === "check") {
    title = formatBank(data.bank);
    numberLabel = "Çek No";
    numberValue = data.checkNo;
  }

  if (type === "note") {
    title = data.debtor;
    numberLabel = "Senet No";
    numberValue = data.noteNo;
  }

  return `
<div class="col-xl-4 col-md-6 mb-30">
  <div class="box check-card ${dueClass}">
    <div class="box-head d-flex justify-content-between align-items-center">
      <h5 class="title mb-0">${title}</h5>
      <div class="check-actions">
        ${dueBadge}
        <span class="check-status status-portfolio">Portföyde</span>
        <div class="check-menu">
          <button class="check-menu-btn"><i class="zmdi zmdi-more-vert"></i></button>
          <div class="check-menu-dropdown">
            <button onclick="collect${type === "check" ? "Check" : "Note"}('${numberValue}','${data.dueDate}')">
              <i class="zmdi zmdi-money"></i> Tahsil Et
            </button>
            <button onclick="endorse${type === "check" ? "Check" : "Note"}('${numberValue}','${data.dueDate}')">
              <i class="zmdi zmdi-share"></i> Ciro Et
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="box-body">
      <div class="check-info">
        <div class="check-row"><span class="label">${numberLabel}</span><span class="value">${numberValue}</span></div>
        <div class="check-row"><span class="label">Vade</span><span class="value">${data.dueDate}</span></div>
        <div class="check-description">${data.description || "-"}</div>
      </div>
      <div class="check-amount">${amount}</div>
    </div>
  </div>
</div>`;
}

async function loadNotes() {
  const container = document.getElementById("noteContainer");
  if (!container) return;

  const res = await fetch(`${API_BASE}/api/notes/portfolio`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return;

  const notes = await res.json();
  container.innerHTML = "";
  notes.forEach((n) => container.insertAdjacentHTML("beforeend", createFinancialCard(n, "note")));
}

async function loadNotesDashboard() {
  const adetEl = document.getElementById("senetAdet");
  const tutarEl = document.getElementById("senetToplamTutar");
  const barEl = document.getElementById("barSenetler");
  if (!adetEl || !tutarEl) return;

  const res = await fetch(`${API_BASE}/api/notes/portfolio`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return;

  const notes = await res.json();
  const adet = notes.length;
  const toplam = notes.reduce((sum, n) => sum + Number(n.amount || 0), 0);

  adetEl.innerText = `${adet} adet`;
  tutarEl.innerText = formatMoney(toplam);
  if (barEl) barEl.style.width = Math.min(adet * 10, 100) + "%";
}

async function collectNote(noteNo, dueDate) {
  const res = await fetch(`${API_BASE}/api/notes/collect`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ noteNo, dueDate })
  });

  if (res.ok) {
    showToast(`Senet tahsil edildi • ${noteNo}`, "success");
    loadNotes();
  } else {
    showToast("Tahsil işlemi başarısız", "error");
  }
}
window.collectNote = collectNote;

async function endorseNote(noteNo, dueDate) {
  const res = await fetch(`${API_BASE}/api/notes/endorse`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ noteNo, dueDate })
  });

  if (res.ok) {
    showToast(`Senet ciro edildi • ${noteNo}`, "success");
    loadNotes();
  } else {
    showToast("Ciro işlemi başarısız", "error");
  }
}
window.endorseNote = endorseNote;

// ==============================
// LOANS
// ==============================
function getLoanStatus(paymentDay) {
  const today = new Date();
  const day = today.getDate();
  const diff = paymentDay - day;

  if (diff < 0) return { class: "loan-overdue", text: "⚠ Taksit gecikti" };
  if (diff === 0) return { class: "loan-today", text: "Bugün ödeme günü" };
  if (diff <= 3) return { class: "loan-warning", text: `${diff} gün sonra ödeme` };
  return null;
}

async function loadLoans() {
  const container = document.getElementById("loanContainer");
  if (!container) return;

  const res = await fetch(`${API_BASE}/api/loans`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return;

  const loans = await res.json();
  container.innerHTML = "";

  loans.forEach((l) => {
    const paid = l.paidInstallments || 0;
    const total = l.installmentCount || 0;
    const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

    const start = new Date(l.startDate);
    const today = new Date();
    const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());

    let status = null;
    if (l.paidInstallments <= monthsPassed) status = getLoanStatus(l.paymentDay);

    const statusBadge = status
      ? `<span class="loan-badge ${status.class}">${status.text}</span>`
      : "";

    const card = `
<div class="col-xl-4 col-md-6 mb-30">
  <div class="box check-card">
    <div class="box-head d-flex justify-content-between align-items-center">
      <h5 class="title mb-0">${formatBank(l.bankName)}</h5>
      <div class="loan-actions">${statusBadge}</div>
      <span class="check-status status-portfolio">Kredi</span>
    </div>
    <div class="box-body">
      <div class="loan-progress mb-15">
        <div class="loan-progress-bar">
          <div class="loan-progress-fill" style="width:${percent}%"></div>
        </div>
        <div class="loan-progress-text">${paid} / ${total} taksit</div>
      </div>
      <div class="check-info">
        <div class="check-row"><span class="label">Toplam Kredi</span><span class="value">${formatMoney(l.loanAmount)}</span></div>
        <div class="check-row"><span class="label">Kalan Borç</span><span class="value">${formatMoney(l.remainingDebt)}</span></div>
        <div class="check-row"><span class="label">Aylık Ödeme</span><span class="value">${formatMoney(l.monthlyPayment)}</span></div>
        <div class="check-row"><span class="label">Ödeme Günü</span><span class="value">${l.paymentDay}</span></div>
      </div>
      <div class="mt-20">
        <button class="button button-primary button-sm" onclick="payLoanInstallment(${l.id})">
          <i class="zmdi zmdi-money"></i> Taksiti Öde
        </button>
      </div>
    </div>
  </div>
</div>`;

    container.insertAdjacentHTML("beforeend", card);
  });
}

async function payLoanInstallment(loanId) {
  showConfirmToast("Bu kredinin taksitini ödemek istiyor musunuz?", async () => {
    const res = await fetch(`${API_BASE}/api/loans/${loanId}/pay`, {
      method: "POST",
      headers: getAuthHeaders(true)
    });

    if (res.ok) {
      showToast("Taksit başarıyla ödendi", "success");
      setTimeout(() => {
        loadLoans();
        loadDashboard();
      }, 800);
    } else {
      showToast("Taksit ödenemedi", "error");
    }
  });
}
window.payLoanInstallment = payLoanInstallment;

// ==============================
// EVENTS
// ==============================
document.addEventListener("click", async function (e) {
  const logoutBtn = e.target.closest('a[onclick*="logout"], a#logoutBtn, a[data-logout]');
  if (logoutBtn) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    logout();
    return;
  }

  if (e.target.id === "btnKasaGiris") {
    await submitCash("/api/cash/income", "Kasa girişi kaydedildi");
    return;
  }

  if (e.target.id === "btnKasaCikis") {
    await submitCash("/api/cash/expense", "Kasa çıkışı kaydedildi");
    return;
  }

  const expenseBtn = e.target.closest("#expenseSaveBtn");
  if (expenseBtn) {
    addExpense();
    return;
  }

  const checkBtn = e.target.closest("#btnCheckIn");
  if (checkBtn) {
    e.preventDefault();

    const payload = {
      checkNo: document.getElementById("checkNo")?.value,
      bank: document.getElementById("bank")?.value,
      dueDate: document.getElementById("dueDate")?.value,
      amount: parseMoney(document.getElementById("tutar")?.value),
      description: document.getElementById("description")?.value
    };

    const res = await fetch(`${API_BASE}/api/checks/in`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast("Çek giriş yapıldı", "success");
      setTimeout(() => {
        loadPage("cekler.html");
        setTimeout(() => initDashboard(), 300);
      }, 1200);
    } else {
      showToast("Hata oluştu", "error");
    }
    return;
  }

  const noteBtn = e.target.closest("#btnNoteIn");
  if (noteBtn) {
    e.preventDefault();

    const payload = {
      noteNo: document.getElementById("noteNo")?.value,
      dueDate: document.getElementById("dueDate")?.value,
      amount: parseMoney(document.getElementById("tutar")?.value),
      description: document.getElementById("description")?.value || ""
    };

    if (!payload.noteNo || !payload.dueDate || !payload.amount) {
      showToast("Tüm alanları doldurun", "error");
      return;
    }

    const res = await fetch(`${API_BASE}/api/notes/in`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast("Senet giriş yapıldı", "success");
      setTimeout(() => loadPage("senetler.html"), 1000);
    } else {
      showToast("Senet kaydedilemedi", "error");
    }
  }
});

$(document).on("click", "#krediKaydetBtn", function () {
  const bankName = $("#krediBanka").val();
  const loanAmount = parseMoney($("#krediTutar").val());
  const installmentCount = $("#krediTaksit").val();
  const monthlyPayment = parseMoney($("#krediAylik").val());
  const paymentDay = $("#krediOdemeGunu").val();
  const endDate = $("#krediBitis").val();

  if (!bankName || !loanAmount || !installmentCount || !monthlyPayment) {
    showToast("Lütfen tüm alanları doldurun", "error");
    return;
  }

  fetch(`${API_BASE}/api/loans`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      bankName,
      loanAmount,
      installmentCount: parseInt(installmentCount),
      monthlyPayment,
      paymentDay: parseInt(paymentDay),
      endDate
    })
  })
    .then((res) => {
      if (!res.ok) throw new Error("API hata");
      return res.json();
    })
    .then(() => {
      showToast("Kredi başarıyla oluşturuldu", "success");
      setTimeout(() => loadPage("krediler.html"), 1200);
    })
    .catch((err) => {
      console.error(err);
      showToast("Kredi oluşturulamadı", "error");
    });
});

// ==============================
// PAGE INIT
// ==============================
function initPageModules() {
  initDashboard();
  loadChecks();
  loadNotes();
  loadLoans();
  loadUsers();
}

document.addEventListener("DOMContentLoaded", function () {

  checkPagePermission();

  initPageObserver();

  const role = localStorage.getItem("role");
  const adminDashboard = document.getElementById("adminDashboard");
  const userWelcome = document.getElementById("userWelcome");

  if (role === "USER") {
    if (adminDashboard) adminDashboard.style.display = "none";
    if (userWelcome) userWelcome.style.display = "block";
  } else {
    if (adminDashboard) adminDashboard.style.display = "block";
    if (userWelcome) userWelcome.style.display = "none";
  }

  const username = localStorage.getItem("username");
  const headerEl = document.getElementById("headerUserName");
  const dropdownEl = document.getElementById("dropdownUserName");
  if (username) {
    if (headerEl) headerEl.textContent = username;
    if (dropdownEl) dropdownEl.textContent = username;
  }

  initPageModules();
});

function initPageObserver(){

  const pageContent = document.getElementById("pageContent");
  if(!pageContent) return;

  let currentPage = "";

function initPageObserver(){

  const pageContent = document.getElementById("pageContent");
  if(!pageContent) return;

  new MutationObserver(() => {

    const newPage = pageContent.querySelector("div")?.id || "";

    if(newPage !== currentPage){

      currentPage = newPage;

      console.log("Page changed:", currentPage);

      initPageModules();

    }

  }).observe(pageContent, {
    childList: true
  });

}

}
