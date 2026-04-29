// ==============================
// CASH UI MODULE
// ==============================

const _POS_TERMINALS = {
  ALTIKARDESLER: [
    { v: "VAKIFBANK",   l: "VAKIFBANK" },
    { v: "GARANTIBBVA", l: "GARANTİBBVA" },
    { v: "IS_BANKASI",  l: "İŞ BANKASI" },
    { v: "YAPI_KREDI",  l: "YAPI KREDİ" },
    { v: "HALKBANK",    l: "HALKBANK" },
    { v: "TEB",         l: "TEB" },
  ],
  TEDARIKCI: [
    { v: "SAMPA",        l: "SAMPA" },
    { v: "HD_KAUCUK",    l: "HD KAUÇUK" },
    { v: "INCITAS",      l: "İNCİTAŞ" },
    { v: "MAYSAN",       l: "MAYSAN" },
    { v: "MAKPARSAN",    l: "MAKPARSAN" },
    { v: "ROTA",         l: "ROTA" },
    { v: "OTO_KARAMAN",  l: "OTO KARAMAN" },
  ],
};

function togglePosFields() {
  const sekli  = document.getElementById("odemeSekli")?.value;
  const posDiv = document.getElementById("posAlanlari");
  if (!posDiv) return;
  posDiv.style.display = sekli === "KREDI_KARTI" ? "" : "none";
  if (sekli === "KREDI_KARTI") toggleTerminal();
}

function toggleTerminal() {
  const tipi = document.getElementById("posTipi")?.value;
  const sel  = document.getElementById("posTerminal");
  if (!sel || !tipi) return;
  const list = _POS_TERMINALS[tipi] || [];
  sel.innerHTML = list.map(t => `<option value="${t.v}">${t.l}</option>`).join("");
}

function initCashPage() {
  // Admin için "İşlem Türü" alanını göster
  if (sessionStorage.getItem("role") === "ADMIN") {
    const w = document.getElementById("islemTuruWrapper");
    if (w) w.style.display = "";
  }
  // Terminal dropdown'ını başlat
  toggleTerminal();
}

async function submitCash(endpoint, successMessage) {
  const odemeSekli = document.getElementById("odemeSekli")?.value || "NAKIT";
  const islemTuru  = document.getElementById("islemTuru")?.value  || "NORMAL";
  const tutarRaw   = document.getElementById("tutar")?.value      || "";
  const aciklama   = document.getElementById("aciklama")?.value   || "";

  const amount = parseMoney(tutarRaw);
  if (!amount) {
    showToast("Tutar giriniz", "error");
    return;
  }

  try {
    if (odemeSekli === "KREDI_KARTI") {
      const posType  = document.getElementById("posTipi")?.value    || "";
      const terminal = document.getElementById("posTerminal")?.value || "";
      if (!posType || !terminal) {
        showToast("POS tipi ve terminal seçiniz", "error");
        return;
      }
      await posApi.log({ posType, terminal, amount, description: aciklama });
      showToast("POS işlemi kaydedildi", "success");

    } else if (islemTuru === "BANKA_YATIRMA") {
      await apiClient.request("/cash/bank-withdrawal", {
        method: "POST",
        body: JSON.stringify({ amount, description: aciklama }),
      });
      showToast("Bankaya para yatırma işlemi kaydedildi", "success");

    } else {
      if (endpoint.includes("income")) {
        await cashStore.addIncome({ amount, description: aciklama });
      } else {
        await cashStore.addExpense({ amount, description: aciklama });
      }
      showToast(successMessage, "success");
    }

    setTimeout(() => {
      loadPage("dashboard.html");
      setTimeout(() => initDashboard(), 300);
    }, 1200);

  } catch (e) {
    console.error(e);
    showToast(e.message || "Hata oluştu", "error");
  }
}


async function loadCashTransactions(page = 0) {
  const tbody = document.getElementById("cashTableBody");
  if (!tbody) return;

  tbody.innerHTML = "<tr><td colspan='4'>Yükleniyor...</td></tr>";

  let data = [];

  try {
    data = await cashStore.fetchTransactions(page);
  } catch (e) {
    console.error("Cash transactions yüklenemedi:", e);
    showToast("Kasa hareketleri alınamadı", "error");
    return;
  }

  tbody.innerHTML = "";

  data.forEach(t => {
    const typeText  = t.type === "INCOME" ? "Kasa Giriş" : "Kasa Çıkış";
    const typeClass = t.type === "INCOME" ? "text-success" : "text-danger";
    const sign      = t.type === "INCOME" ? "+" : "-";

    const tarih = t.transactionDate
      ? new Date(t.transactionDate).toLocaleString("tr-TR")
      : "-";

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${tarih}</td>
        <td>${escapeHtml(t.description) || "-"}</td>
        <td class="${typeClass}">${typeText}</td>
        <td class="text-end ${typeClass}">${sign}${formatMoney(t.amount)} TL</td>
      </tr>
    `);
  });

  _renderCashPagination(cashStore.pagination);
}

function _renderCashPagination({ page, totalPages }) {
  const container = document.getElementById("cashPagination");
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ""; return; }

  let html = "";
  for (let i = 0; i < totalPages; i++) {
    html += `<button class="btn-page${i === page ? " active" : ""}" onclick="loadCashTransactions(${i})">${i + 1}</button>`;
  }
  container.innerHTML = html;
}


// ==============================
// CASH EVENT BIND
// ==============================

document.addEventListener("click", async function (e) {

  if (e.target.id === "btnKasaGiris") {
    e.preventDefault();
    await submitCash("/cash/income", "Kasa girişi kaydedildi");
    return;
  }

  if (e.target.id === "btnKasaCikis") {
    e.preventDefault();
    await submitCash("/cash/expense", "Kasa çıkışı kaydedildi");
    return;
  }

});

// ==============================
// GLOBAL EXPORT
// ==============================

window.submitCash          = submitCash;
window.loadCashTransactions = loadCashTransactions;
window.initCashPage        = initCashPage;
window.togglePosFields     = togglePosFields;
window.toggleTerminal      = toggleTerminal;
