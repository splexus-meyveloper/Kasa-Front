// ==============================
// CHECKS UI MODULE
// ==============================

// ==============================
// PORTFOLIO (İKİ SEKMELİ)
// ==============================

let _checkTabsBound = false;

function _bindCheckTabs() {
  if (_checkTabsBound) return;
  _checkTabsBound = true;

  document.addEventListener("click", function (e) {
    const tabBtn = e.target.closest(".check-tab-btn");
    if (!tabBtn) return;

    document.querySelectorAll(".check-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".check-tab-panel").forEach(p => p.classList.remove("active"));

    tabBtn.classList.add("active");
    const tab = tabBtn.dataset.tab;
    const panel = document.getElementById("checkTab-" + tab);
    if (panel) panel.classList.add("active");
  });
}

function _buildCheckCard(c) {
  const due = getDueStatus(c.dueDate);
  const dueClass = due ? due.class : "";
  const dueBadge = due
    ? `<span class="due-badge ${due.class}">${due.text}</span>`
    : "";

  let statusClass = "status-portfolio";
  let statusText = "Kasanda";

  if (c.status === "TAHSIL_EDILDI") {
    statusClass = "status-collected";
    statusText = "Tahsil Edildi";
  } else if (c.status === "CIRO_EDILDI") {
    statusClass = "status-endorsed";
    statusText = "Ciro Edildi";
  }

  const amount = formatMoney(c.amount);
  const isPortfoyde = c.status === "PORTFOYDE" || !c.status;

  let actions = "";

if (isPortfoyde) {

  // 🔵 KENDİ ÇEKİ
  if (c.checkType === "KENDI") {
    actions = `
      <div class="check-menu">
        <button class="check-menu-btn">
          <i class="zmdi zmdi-more-vert"></i>
        </button>
        <div class="check-menu-dropdown">
          <button onclick="openPaidModal(${parseInt(c.id, 10)})">
            <i class="zmdi zmdi-check"></i> Ödendi
          </button>
        </div>
      </div>`;
  }

  // 🟢 MÜŞTERİ ÇEKİ
  else {
    actions = `
      <div class="check-menu">
        <button class="check-menu-btn">
          <i class="zmdi zmdi-more-vert"></i>
        </button>
        <div class="check-menu-dropdown">
          <button onclick="collectCheck(${parseInt(c.id, 10)})">
            <i class="zmdi zmdi-money"></i> Tahsil Et
          </button>
          <button onclick="openEndorseModal(${parseInt(c.id, 10)}, 'check')">
            <i class="zmdi zmdi-share"></i> Ciro Et
          </button>
        </div>
      </div>`;
  }

}

  return `
<div class="col-xl-4 col-md-6 mb-30" data-check-id="${c.id}">
  <div class="box check-card ${statusClass} ${dueClass}">
    <div class="box-head d-flex justify-content-between align-items-center">
      <h5 class="title mb-0">${escapeHtml(formatBank(c.bank))}</h5>
      <div class="check-actions">
        ${dueBadge}
        <span class="check-status ${statusClass}">${statusText}</span>
        ${actions}
      </div>
    </div>
    <div class="box-body">
      <div class="check-info">
        <div class="check-row"><span class="label">Çek No</span><span class="value">${escapeHtml(c.checkNo)}</span></div>
        <div class="check-row"><span class="label">Vade</span><span class="value">${escapeHtml(c.dueDate)}</span></div>
        <div class="check-description">${escapeHtml(c.description) || "-"}</div>
      </div>
      <div class="check-amount">${amount}</div>
    </div>
  </div>
</div>`;
}

let selectedCheckId  = null;
let _endorseId       = null;
let _endorseType     = null; // 'check' | 'note'

function openEndorseModal(id, type) {
  _endorseId   = id;
  _endorseType = type;

  const modal    = document.getElementById("dynamicModal");
  const body     = document.getElementById("dynamicModalBody");
  const title    = document.getElementById("dynamicModalTitle");
  const subtitle = document.getElementById("dynamicModalSubtitle");
  const icon     = document.getElementById("dynamicModalIcon");

  if (!modal || !body) return;

  const label = type === "check" ? "Çek" : "Senet";
  title.textContent    = `${label} Ciro Et`;
  subtitle.textContent = "Ciro bilgilerini girin";
  icon.innerHTML       = `<i class="zmdi zmdi-share"></i>`;

  body.innerHTML = `
    <div class="kasa-form-group">
      <label>Ciro Edilen Kişi / Firma</label>
      <input id="endorsedTo" class="kasa-modal-input" type="text" placeholder="Ad Soyad veya Firma Adı">
    </div>
    <div class="kasa-form-group">
      <label>Açıklama</label>
      <textarea id="endorseDesc" class="kasa-modal-textarea" placeholder="Opsiyonel açıklama"></textarea>
    </div>
  `;

  modal.classList.add("active");
}

async function submitEndorse() {
  const endorsedTo = document.getElementById("endorsedTo")?.value?.trim();
  const desc       = document.getElementById("endorseDesc")?.value?.trim() || "";

  if (!endorsedTo) {
    showToast("Ciro edilen kişi/firma adını girin", "error");
    return;
  }

  try {
    const payload = { id: _endorseId, endorsedTo, description: desc };

    if (_endorseType === "check") {
      await checkApi.endorse(payload);
      showToast("Çek ciro edildi", "success");
      document.getElementById("dynamicModal")?.classList.remove("active");
      _removeCheckCard(_endorseId);
    } else {
      await noteApi.endorse(payload);
      showToast("Senet ciro edildi", "success");
      document.getElementById("dynamicModal")?.classList.remove("active");
      _removeNoteCard(_endorseId);
    }
  } catch (e) {
    showToast("Ciro işlemi başarısız: " + (e.message || ""), "error");
  }
}

window.openEndorseModal = openEndorseModal;
window.submitEndorse    = submitEndorse;

// Dynamic modal'ın tek submit noktası — hangi modal açıksa onu çalıştırır
function submitDynamicModal() {
  if (_endorseId !== null) {
    submitEndorse();
  } else {
    submitPaid();
  }
}
// Modal kapandığında state'i temizle
document.addEventListener("click", function (e) {
  if (e.target.closest("[data-close='dynamicModal']")) {
    _endorseId   = null;
    _endorseType = null;
  }
});
window.submitDynamicModal = submitDynamicModal;

function openPaidModal(id) {
  selectedCheckId = id;

  const modal = document.getElementById("dynamicModal");
  const body = document.getElementById("dynamicModalBody");
  const title = document.getElementById("dynamicModalTitle");
  const subtitle = document.getElementById("dynamicModalSubtitle");
  const icon = document.getElementById("dynamicModalIcon");

  if (!modal || !body || !title || !subtitle || !icon) {
    console.error("dynamicModal elemanları bulunamadı");
    return;
  }

  title.textContent = "Çek Ödeme";
  subtitle.textContent = "Çek ödendi olarak işaretlenecek";
  icon.innerHTML = `<i class="zmdi zmdi-check-circle"></i>`;

  body.innerHTML = `
    <div class="kasa-form-group">
      <label for="paidDescription">Açıklama</label>
      <textarea
        id="paidDescription"
        class="kasa-modal-textarea"
        placeholder="Örn: X banka hesabından ödendi"
      ></textarea>
    </div>
  `;

  modal.classList.add("active");
}

async function submitPaid() {
  const desc = document.getElementById("paidDescription")?.value || "";

  try {
    await checkApi.markAsPaid({
      id: selectedCheckId,
      description: desc
    });

    showToast("Çek ödendi olarak işaretlendi", "success");
    document.getElementById("dynamicModal")?.classList.remove("active");
    _removeCheckCard(selectedCheckId);
  } catch (err) {
    showToast(err.message || "Hata oluştu", "error");
  }
}

window.openPaidModal = openPaidModal;
window.submitPaid = submitPaid;

async function loadChecks({ silent = false } = {}) {
  const musteriContainer = document.getElementById("checkContainer-musteri");
  const kendiContainer   = document.getElementById("checkContainer-kendi");
  const legacyContainer  = document.getElementById("checkContainer");

  if (!musteriContainer && !kendiContainer && !legacyContainer) return;
  if (document.querySelector(".kasa-card-exit")) return;

  if (!silent) {
    const loading = "<div style='padding:20px'>Yükleniyor...</div>";
    if (musteriContainer) musteriContainer.innerHTML = loading;
    if (kendiContainer)   kendiContainer.innerHTML   = loading;
    if (legacyContainer)  legacyContainer.innerHTML  = loading;
  }

  let checks = [];
  try {
    checks = await checkStore.fetchChecks();
  } catch (e) {
    console.error("Çekler yüklenemedi:", e);
    showToast("Çekler alınamadı: " + e.message, "error");
    return;
  }

  if (document.querySelector(".kasa-card-exit")) return;

  if (musteriContainer) musteriContainer.innerHTML = "";
  if (kendiContainer)   kendiContainer.innerHTML   = "";
  if (legacyContainer)  legacyContainer.innerHTML  = "";

  _bindCheckTabs();

  if (!checks.length) {
    const empty = "<p style='padding:20px;color:#aaa'>Çek bulunamadı.</p>";
    if (musteriContainer) musteriContainer.innerHTML = empty;
    if (kendiContainer)   kendiContainer.innerHTML   = empty;
    if (legacyContainer)  legacyContainer.innerHTML  = empty;
    return;
  }

  checks.forEach((c) => {
    const card = _buildCheckCard(c);
    const type = c.checkType || "MUSTERI";

    if (musteriContainer && type === "MUSTERI") {
      musteriContainer.insertAdjacentHTML("beforeend", card);
    } else if (kendiContainer && type === "KENDI") {
      kendiContainer.insertAdjacentHTML("beforeend", card);
    } else if (legacyContainer) {
      legacyContainer.insertAdjacentHTML("beforeend", card);
    }
  });
}


// ==============================
// CHECK SUMMARY (DASHBOARD)
// ==============================
async function loadCheckSummary() {
  const tutarEl = document.getElementById("cekToplamTutar");
  const adetEl  = document.getElementById("cekAdet");
  if (!tutarEl || !adetEl) return;

  try {
    tutarEl.innerText = "...";
    adetEl.innerText  = "...";

    const checks = await checkStore.fetchChecks();
    if (!checks) return;

    const total = checks.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    animateValue(tutarEl, total);
    animateValue(adetEl, checks.length);

    setTimeout(() => {
      adetEl.innerText = `${checks.length} adet çek`;
    }, 800);

    setAutoBar("barCekler", Math.min(checks.length * 10, 100), 100);

  } catch (e) {
    console.error("Çekler yüklenemedi:", e);
    tutarEl.innerText = "0";
    adetEl.innerText  = "0";
    showToast("Çek verileri alınamadı: " + e.message, "error");
  }
}


// ==============================
// CHECK ACTIONS
// ==============================

function _removeCheckCard(id) {
  const card = document.querySelector(`[data-check-id="${id}"]`);
  if (card) {
    card.classList.add("kasa-card-exit");
    setTimeout(() => card.remove(), 580);
  }
  checkStore.removeCheck(id);
  _refreshCheckSummaryFromCache();
}

function _refreshCheckSummaryFromCache() {
  const checks = checkStore.checks;
  const total = checks.reduce((s, c) => s + Number(c.amount || 0), 0);
  const tutarEl = document.getElementById("cekToplamTutar");
  const adetEl  = document.getElementById("cekAdet");
  if (tutarEl) animateValue(tutarEl, total);
  if (adetEl)  adetEl.innerText = `${checks.length} adet çek`;
}

async function collectCheck(id) {
  try {
    await checkApi.collect({ id });
    showToast("Çek tahsil edildi", "success");
    _removeCheckCard(id);
  } catch (e) {
    showToast("Tahsil işlemi başarısız: " + e.message, "error");
  }
}

async function endorseCheck(id) {
  try {
    await checkApi.endorse({ id });
    showToast("Çek ciro edildi", "success");
    _removeCheckCard(id);
  } catch (e) {
    showToast("Ciro işlemi başarısız: " + e.message, "error");
  }
}


// ==============================
// FORM — ÇEK TİPİ TOGGLE
// ==============================

document.addEventListener("click", function (e) {
  const opt = e.target.closest(".check-type-option");
  if (!opt || !opt.dataset.value) return;

  document.querySelectorAll(".check-type-option").forEach(o => o.classList.remove("check-type-active"));
  opt.classList.add("check-type-active");

  const input = document.getElementById("checkTypeInput");
  if (input) input.value = opt.dataset.value;
});


// ==============================
// FORM — SUBMIT
// ==============================

document.addEventListener("click", async function (e) {
  const btn = e.target.closest("#btnCheckIn");
  if (!btn) return;

  e.preventDefault();

  const checkTypeValue =
    document.getElementById("checkTypeInput")?.value || "MUSTERI";

  const payload = {
    checkNo: document.getElementById("checkNo")?.value,
    bank: document.getElementById("bank")?.value,
    dueDate: document.getElementById("dueDate")?.value,
    amount: parseMoney(document.getElementById("tutar")?.value),
    description: document.getElementById("description")?.value,
    checkType: checkTypeValue
  };

  try {
    await checkApi.create(payload);
    showToast("Çek giriş yapıldı", "success");
    refreshCalendar?.();
    setTimeout(() => {
      loadPage("cekler.html");
      setTimeout(() => initDashboard?.(), 300);
    }, 1200);
  } catch (e) {
    showToast("Hata oluştu: " + e.message, "error");
  }
});


// ==============================
// GLOBAL EXPORT
// ==============================

window.loadChecks       = loadChecks;
window.loadCheckSummary = loadCheckSummary;
window.collectCheck     = collectCheck;
window.endorseCheck     = endorseCheck;
