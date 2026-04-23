// ==============================
// NOTES UI MODULE
// ==============================

function createFinancialCard(data, type) {
  const amount = formatMoney(data.amount);
  const due = getDueStatus(data.dueDate);
  const dueClass = due ? due.class : "";
  const dueBadge = due
    ? `<span class="due-badge ${due.class}">${due.text}</span>`
    : "";

  let title = "";
  let numberLabel = "";
  let numberValue = "";

  if (type === "check") {
    title = formatBank(data.bank);
    numberLabel = "Çek No";
    numberValue = data.checkNo;
  }

  if (type === "note") {
    title = data.debtor || "Senet";
    numberLabel = "Senet No";
    numberValue = data.noteNo;
  }

  return `
<div class="col-xl-4 col-md-6 mb-30" data-note-id="${data.id}">
  <div class="box check-card ${dueClass}">
    <div class="box-head d-flex justify-content-between align-items-center">
      <h5 class="title mb-0">${escapeHtml(title)}</h5>
      <div class="check-actions">
        ${dueBadge}
        <span class="check-status status-portfolio">Portföyde</span>
        <div class="check-menu">
          <button class="check-menu-btn"><i class="zmdi zmdi-more-vert"></i></button>
          <div class="check-menu-dropdown">
            <button onclick="collectNote(${data.id})">
              <i class="zmdi zmdi-money"></i> Tahsil Et
            </button>
            <button onclick="openEndorseModal(${data.id}, 'note')">
              <i class="zmdi zmdi-share"></i> Ciro Et
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="box-body">
      <div class="check-info">
        <div class="check-row"><span class="label">${escapeHtml(numberLabel)}</span><span class="value">${escapeHtml(numberValue)}</span></div>
        <div class="check-row"><span class="label">Vade</span><span class="value">${escapeHtml(data.dueDate)}</span></div>
        <div class="check-description">${escapeHtml(data.description) || "-"}</div>
      </div>
      <div class="check-amount">${amount}</div>
    </div>
  </div>
</div>`;
}


// ==============================
// LOAD NOTES
// ==============================
async function loadNotes({ silent = false } = {}) {
  const container = document.getElementById("noteContainer");
  if (!container) return;
  if (document.querySelector(".kasa-card-exit")) return;

  if (!silent) container.innerHTML = "Yükleniyor...";

  let notes = [];

  try {
    notes = await noteStore.fetchNotes();
  } catch (e) {
    console.error(e);
    showToast("Senetler alınamadı", "error");
    return;
  }

  if (document.querySelector(".kasa-card-exit")) return;

  container.innerHTML = "";

  notes.forEach((n) => {
  console.log("NOTE ITEM:", n);

  container.insertAdjacentHTML(
    "beforeend",
    createFinancialCard(n, "note")
  );
});
}


// ==============================
// DASHBOARD NOTES
// ==============================
async function loadNotesDashboard() {
  const adetEl = document.getElementById("senetAdet");
  const tutarEl = document.getElementById("senetToplamTutar");

  if (!adetEl || !tutarEl) return;

  try {
    const notes = await noteStore.fetchNotes();

    const adet = notes.length;
    const toplam = notes.reduce(
      (sum, n) => sum + Number(n.amount || 0),
      0
    );

    adetEl.innerText = `${adet} adet`;
    animateValue(tutarEl, toplam);

  } catch (e) {
    showToast("Senet dashboard yüklenemedi", "error");
  }
}


// ==============================
// ACTIONS
// ==============================

function _removeNoteCard(id) {
  const card = document.querySelector(`[data-note-id="${id}"]`);
  if (card) {
    card.classList.add("kasa-card-exit");
    setTimeout(() => card.remove(), 580);
  }
  noteStore.removeNote(id);
  _refreshNoteSummaryFromCache();
}

function _refreshNoteSummaryFromCache() {
  const notes = noteStore.notes;
  const total = notes.reduce((s, n) => s + Number(n.amount || 0), 0);
  const adetEl  = document.getElementById("senetAdet");
  const tutarEl = document.getElementById("senetToplamTutar");
  if (adetEl)  adetEl.innerText = `${notes.length} adet`;
  if (tutarEl) animateValue(tutarEl, total);
}

async function collectNote(id) {
  try {
    await noteApi.collect({ id });
    showToast("Senet tahsil edildi", "success");
    _removeNoteCard(id);
  } catch (e) {
    console.error(e);
    showToast("Tahsil işlemi başarısız", "error");
  }
}

async function endorseNote(id) {
  try {
    await noteApi.endorse({ id });
    showToast("Senet ciro edildi", "success");
    _removeNoteCard(id);
  } catch (e) {
    console.error(e);
    showToast("Ciro işlemi başarısız", "error");
  }
}


document.addEventListener("click", async function (e) {
  const btn = e.target.closest("#btnNoteIn");
  if (!btn) return;

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

  try {
    await noteStore.createNote(payload);

    showToast("Senet giriş yapıldı", "success");

    refreshCalendar();

    setTimeout(() => loadPage("senetler.html"), 1000);

  } catch (e) {
    showToast("Senet kaydedilemedi", "error");
  }
});

// ==============================
// GLOBAL EXPORT
// ==============================

window.loadNotes          = loadNotes;
window.loadNotesDashboard = loadNotesDashboard;
window.collectNote        = collectNote;
window.endorseNote        = endorseNote;
window._removeNoteCard    = _removeNoteCard;