// ==============================
// KASA APP SHELL / ROUTER
// ==============================

function getPageKey(page) {
  const normalized = String(page || "").toLowerCase();

  if (normalized.includes("kullanicilar")) return "users";
  if (normalized.includes("dashboard")) return "dashboard";
  if (normalized.includes("cek")) return "checks";
  if (normalized.includes("kasa")) return "cash";
  if (normalized.includes("not") || normalized.includes("senet")) return "notes";
  if (normalized.includes("takvim")) return "calendar";
  if (normalized.includes("kredi")) return "loans";
  if (normalized.includes("gider")) return "expenses";
  if (normalized.includes("bildirim")) return "notifications";
  if (normalized.includes("benim")) return "myActivities";
  if (normalized.includes("onay")) return "approvals";
  if (normalized.includes("rapor")) return "reports";

  return "default";
}

const pageInitMap = {
  users: () => {
    if (window.initUsersPage) {
      window.initUsersPage();
    } else {
      console.warn("initUsersPage tanımlı değil");
    }
  },

  dashboard: () => {
    if (window.initDashboardPage) {
      window.initDashboardPage();
    } else if (window.initDashboard) {
      window.initDashboard();
    } else {
      console.warn("Dashboard init fonksiyonu tanımlı değil");
    }
  },

  checks: () => {
    if (window.initCheckPage) {
      window.initCheckPage();
    } else if (window.loadChecks) {
      window.loadChecks();
    } else {
      console.warn("Check page init fonksiyonu tanımlı değil");
    }
  },

  cash: () => {
    if (window.initCashPage) {
      window.initCashPage();
    } else if (window.loadCashTransactions) {
      window.loadCashTransactions();
    } else {
      console.warn("Cash page init fonksiyonu tanımlı değil");
    }
  },

  notes: () => {
    if (window.initNotesPage) {
      window.initNotesPage();
    } else if (window.loadNotes) {
      window.loadNotes();
    } else {
      console.warn("Notes page init fonksiyonu tanımlı değil");
    }
  },

  calendar: () => {
    if (window.initCalendarPage) {
      window.initCalendarPage();
    } else if (window.loadCalendar) {
      window.loadCalendar();
    } else {
      console.warn("Calendar page init fonksiyonu tanımlı değil");
    }
  },

  loans: () => {
    if (window.initLoanPage) {
      window.initLoanPage();
    } else if (window.loadLoans) {
      window.loadLoans();
    } else {
      console.warn("Loan page init fonksiyonu tanımlı değil");
    }
  },

  expenses: () => {
    if (window.initExpensePage) {
      window.initExpensePage();
    } else {
      console.warn("Expense page init fonksiyonu tanımlı değil");
    }
  },

  notifications: () => {
    if (window.initNotificationPage) {
      window.initNotificationPage();
    } else {
      console.warn("Notification page init fonksiyonu tanımlı değil");
    }
  },

  myActivities: () => {
  if (window.initMyActivitiesPage) {
    window.initMyActivitiesPage();
  } else {
    console.warn("initMyActivitiesPage tanımlı değil");
  }
},

approvals: () => {
  if (window.initApprovalsPage) {
    window.initApprovalsPage();
  }
},

reports: () => {
  if (window.initReportPage) {
    window.initReportPage();
  }
},

  default: () => {
    console.warn("Bu sayfa için init tanımlı değil");
  }
};

function runPageInit(page) {
  const pageKey = getPageKey(page);
  const initFn = pageInitMap[pageKey] || pageInitMap.default;

  console.log("RUN PAGE INIT:", page, "=>", pageKey);

  try {
    initFn();
  } catch (err) {
    console.error(`Page init error (${pageKey}):`, err);
    if (window.showToast) {
      showToast("Sayfa başlatılırken hata oluştu", "error");
    }
  }
}

async function loadPage(page) {
  window.currentPage = page;

  const container = document.getElementById("pageContent");
  if (!container) return;

  try {
    const response = await fetch(page);

    if (!response.ok) {
      throw new Error(`Sayfa yüklenemedi: ${response.status}`);
    }

    const html = await response.text();
    container.innerHTML = html;

    if (window.applyPermissionsFromToken) {
      applyPermissionsFromToken();
    }

    runPageInit(page);
  } catch (err) {
    console.error("Page load error:", err);

    container.innerHTML = `
      <div class="alert alert-danger" style="margin:20px;">
        Sayfa yüklenirken hata oluştu.
      </div>
    `;

    if (window.showToast) {
      showToast("Sayfa yüklenemedi", "error");
    }
  }
}

window.loadPage = loadPage;
window.runPageInit = runPageInit;
window.getPageKey = getPageKey;

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
    Authorization: "Bearer " + sessionStorage.getItem("token")
  };

  if (json) headers["Content-Type"] = "application/json";
  return headers;
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

function getDueColor(dueDate) {

  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0,0,0,0);
  due.setHours(0,0,0,0);

  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "#b91c1c";   // geçmiş → koyu kırmızı
  if (diff <= 1) return "#ef4444";  // 1 gün → kırmızı
  if (diff <= 3) return "#f97316";  // 3 gün → turuncu
  if (diff <= 5) return "#facc15";  // 5 gün → sarı

  return "#3b82f6"; // 🔥 default mavi
}


// ==============================
// AUTH / PERMISSIONS
// ==============================
function getPermissions() {
  try {
    return JSON.parse(sessionStorage.getItem("permissions") || "[]");
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

// ==============================
// MONEY MASK
// ==============================

document.addEventListener("focusin", function (e) {

    if (e.target.classList.contains("money-input")) {

        const input = e.target;

        if(input.dataset.masked === "true") return;

        input.addEventListener("input", function () {

            let raw = this.value
                .replace(/[^\d,]/g, "")   // sayı + virgül

            // 🔥 virgül kontrol (sadece 1 tane)
            const parts = raw.split(",");
            if(parts.length > 2){
                raw = parts[0] + "," + parts[1];
            }

            // 🔥 format
            let [int, dec] = raw.split(",");

            int = int.replace(/\D/g, "");
            int = Number(int || 0).toLocaleString("tr-TR");

            if(dec !== undefined){
                dec = dec.slice(0,2); // max 2 basamak
                this.value = int + "," + dec;
            } else {
                this.value = int;
            }

        });

        input.dataset.masked = "true";
    }

});
