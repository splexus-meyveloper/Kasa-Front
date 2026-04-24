// ==============================
// CASH UI MODULE
// ==============================

async function submitCash(endpoint, successMessage) {
  let tutar = document.getElementById("tutar")?.value || "";
  let aciklama = document.getElementById("aciklama")?.value || "";

  const amount = parseMoney(tutar);
  if (!amount) {
    showToast("Tutar giriniz", "error");
    return;
  }

  try {

    if (endpoint.includes("income")) {
      await cashStore.addIncome({
        amount,
        description: aciklama
      });
    } else {
      await cashStore.addExpense({
        amount,
        description: aciklama
      });
    }

    showToast(successMessage, "success");

    setTimeout(() => {
      loadPage("dashboard.html");
      setTimeout(() => initDashboard(), 300);
    }, 1200);

  } catch (e) {
    console.error(e);
    showToast("Hata oluştu", "error");
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
    const typeText = t.type === "INCOME" ? "Kasa Giriş" : "Kasa Çıkış";
    const typeClass = t.type === "INCOME" ? "text-success" : "text-danger";
    const sign = t.type === "INCOME" ? "+" : "-";

    const tarih = t.transactionDate
      ? new Date(t.transactionDate).toLocaleString("tr-TR")
      : "-";

    const row = `
      <tr>
        <td>${tarih}</td>
        <td>${escapeHtml(t.description) || "-"}</td>
        <td class="${typeClass}">${typeText}</td>
        <td class="text-end ${typeClass}">
          ${sign}${formatMoney(t.amount)} TL
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", row);
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

window.submitCash = submitCash;
window.loadCashTransactions = loadCashTransactions;