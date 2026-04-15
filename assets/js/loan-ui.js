// ==============================
// LOAN UI MODULE
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


// ==============================
// LOAD LOANS
// ==============================
async function loadLoans() {
  const container = document.getElementById("loanContainer");
  if (!container) return;

  container.innerHTML = "<div style='padding:20px'>Yükleniyor...</div>";

  let loans = [];

  try {
    loans = await loanStore.fetchLoans();
  } catch (e) {
    console.error("Loans yüklenemedi:", e);
    showToast("Krediler alınamadı", "error");
    return;
  }

  container.innerHTML = "";

  loans.forEach((l) => {
    const paid = l.paidInstallments || 0;
    const total = l.installmentCount || 0;
    const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

    const start = new Date(l.startDate);
    const today = new Date();

    const monthsPassed =
      (today.getFullYear() - start.getFullYear()) * 12 +
      (today.getMonth() - start.getMonth());

    let status = null;

    if (l.paidInstallments <= monthsPassed) {
      status = getLoanStatus(l.paymentDay);
    }

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
        <button class="button button-primary button-sm"
          onclick="payLoanInstallment(${l.id})">
          <i class="zmdi zmdi-money"></i> Taksiti Öde
        </button>
      </div>

    </div>
  </div>
</div>`;

    container.insertAdjacentHTML("beforeend", card);
  });
}


// ==============================
// ACTIONS
// ==============================
async function payLoanInstallment(loanId) {

  showConfirmToast("Bu kredinin taksitini ödemek istiyor musunuz?", async () => {

    try {
      await loanStore.payLoan(loanId);

      showToast("Taksit başarıyla ödendi", "success");

      setTimeout(() => {
        loadLoans();
        loadDashboard();
      }, 800);

    } catch (e) {
      showToast("Taksit ödenemedi", "error");
    }

  });
}

$(document).on("click", "#krediKaydetBtn", async function () {

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

  try {
    await loanStore.createLoan({
      bankName,
      loanAmount,
      installmentCount: parseInt(installmentCount),
      monthlyPayment,
      paymentDay: parseInt(paymentDay),
      endDate
    });

    showToast("Kredi başarıyla oluşturuldu", "success");

    refreshCalendar();

    setTimeout(() => loadPage("krediler.html"), 1200);

  } catch (err) {
    console.error(err);
    showToast("Kredi oluşturulamadı", "error");
  }
});


// ==============================
// GLOBAL EXPORT
// ==============================
window.loadLoans = loadLoans;
window.payLoanInstallment = payLoanInstallment;