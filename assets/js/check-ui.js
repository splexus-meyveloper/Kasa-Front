// ==============================
// CHECKS UI MODULE
// ==============================

async function loadChecks() {
  const container = document.getElementById("checkContainer");
  if (!container) return;

  // 🔥 loading
  container.innerHTML = "<div style='padding:20px'>Yükleniyor...</div>";

  let checks = [];

  try {
    checks = await checkStore.fetchChecks();
  } catch (e) {
    console.error("Çekler yüklenemedi:", e);
    showToast("Çekler alınamadı: " + e.message, "error");
    return;
  }

  container.innerHTML = "";

  checks.forEach((c) => {
    const due = getDueStatus(c.dueDate);
    const dueClass = due ? due.class : "";
    const dueBadge = due
      ? `<span class="due-badge ${due.class}">${due.text}</span>`
      : "";

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


// ==============================
// CHECK SUMMARY (DASHBOARD)
// ==============================
async function loadCheckSummary() {
  const tutarEl = document.getElementById("cekToplamTutar");
  const adetEl = document.getElementById("cekAdet");

  if (!tutarEl || !adetEl) return;

  try {
    // 🔥 loading
    tutarEl.innerText = "...";
    adetEl.innerText = "...";

    const checks = await checkStore.fetchChecks();
    if (!checks) return;

    const total = checks.reduce(
      (sum, c) => sum + Number(c.amount || 0),
      0
    );

    // 🔥 animasyon
    animateValue(tutarEl, total);
    animateValue(adetEl, checks.length);

    // 🔥 text format
    setTimeout(() => {
      adetEl.innerText = `${checks.length} adet çek`;
    }, 800);

    // 🔥 progress bar
    setAutoBar("barCekler", Math.min(checks.length * 10, 100), 100);

  } catch (e) {
    console.error("Çekler yüklenemedi:", e);

    tutarEl.innerText = "0";
    adetEl.innerText = "0";

    showToast("Çek verileri alınamadı: " + e.message, "error");
  }
}


// ==============================
// CHECK ACTIONS
// ==============================

async function collectCheck(checkNo, bank, dueDate) {
  try {
    await checkApi.collect({
      checkNo,
      bank,
      dueDate
    });

    showToast(`Çek tahsil edildi • ${checkNo}`, "success");
    loadChecks();
    loadCheckSummary();

  } catch (e) {
    showToast("Tahsil işlemi başarısız: " + e.message, "error");
  }
}


async function endorseCheck(checkNo, bank, dueDate) {
  try {
    await checkApi.endorse({
      checkNo,
      bank,
      dueDate
    });

    showToast(`Çek ciro edildi • ${checkNo}`, "success");
    loadChecks();
    loadCheckSummary();

  } catch (e) {
    showToast("Ciro işlemi başarısız: " + e.message, "error");
  }
}


document.addEventListener("click", async function (e) {
  const btn = e.target.closest("#btnCheckIn");
  if (!btn) return;

  e.preventDefault();

  const payload = {
    checkNo: document.getElementById("checkNo")?.value,
    bank: document.getElementById("bank")?.value,
    dueDate: document.getElementById("dueDate")?.value,
    amount: parseMoney(document.getElementById("tutar")?.value),
    description: document.getElementById("description")?.value
  };

  try {
    await checkApi.create(payload);

    showToast("Çek giriş yapıldı", "success");

    refreshCalendar();

    setTimeout(() => {
      loadPage("cekler.html");
      setTimeout(() => initDashboard(), 300);
    }, 1200);

  } catch (e) {
    showToast("Hata oluştu", "error");
  }
});

// ==============================
// GLOBAL EXPORT
// ==============================

window.loadChecks = loadChecks;
window.loadCheckSummary = loadCheckSummary;
window.collectCheck = collectCheck;
window.endorseCheck = endorseCheck;