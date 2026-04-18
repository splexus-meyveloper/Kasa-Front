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
<div class="col-xl-4 col-md-6 mb-30">
  <div class="box check-card ${dueClass}">
    <div class="box-head d-flex justify-content-between align-items-center">
      <h5 class="title mb-0">${escapeHtml(title)}</h5>
      <div class="check-actions">
        ${dueBadge}
        <span class="check-status status-portfolio">Portföyde</span>
        <div class="check-menu">
          <button class="check-menu-btn"><i class="zmdi zmdi-more-vert"></i></button>
          <div class="check-menu-dropdown">
            <button
              onclick="collectNote(${data.id})"
              <i class="zmdi zmdi-money"></i> Tahsil Et
            </button>
            <button
              onclick="endorseNote(${data.id})"
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
async function loadNotes() {
  const container = document.getElementById("noteContainer");
  if (!container) return;

  container.innerHTML = "Yükleniyor...";

  let notes = [];

  try {
    notes = await noteStore.fetchNotes();
  } catch (e) {
    console.error(e);
    showToast("Senetler alınamadı", "error");
    return;
  }

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

async function collectNote(id) {
  try {
    console.log("COLLECT NOTE ID:", id);

    await noteApi.collect({ id });

    showToast("Senet tahsil edildi", "success");
    loadNotes();
    loadNotesDashboard();

  } catch (e) {
    console.error(e);
    showToast("Tahsil işlemi başarısız", "error");
  }
}


async function endorseNote(id) {
  try {
    console.log("ENDORSE NOTE ID:", id);

    await noteApi.endorse({ id });

    showToast("Senet ciro edildi", "success");
    loadNotes();
    loadNotesDashboard();

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

window.loadNotes = loadNotes;
window.loadNotesDashboard = loadNotesDashboard;
window.collectNote = collectNote;
window.endorseNote = endorseNote;