// ==============================
// CHECKS UI MODULE
// ==============================

// ─────────────────────────────────────────────────────────────────────────────
// STATÜ HARİTASI
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  PORTFOYDE:     { label: "Portföyde",       cls: "status-portfolio"  },
  TAHSIL_EDILDI: { label: "Tahsil Edildi",   cls: "status-collected"  },
  CIRO_EDILDI:   { label: "Ciro Edildi",     cls: "status-endorsed"   },
  TEMINATA_CIKTI:{ label: "Teminata Çıktı", cls: "status-collateral" },
  ODENDI:        { label: "Ödendi",          cls: "status-paid"       },
  KARSILISIZ:    { label: "Karşılıksız",     cls: "status-bad-debt"   },
  PROTESTOLU:    { label: "Protestolu",      cls: "status-protested"  },
  MUSTERI_IADE:  { label: "Müşteriye İade", cls: "status-returned"   },
  AVUKATA_CIKIS: { label: "Avukata Çıkış",  cls: "status-legal"      },
  IADE_EDILDI:   { label: "İade Edildi",     cls: "status-returned"   },
};

const TAMAMLANAN = new Set(["TAHSIL_EDILDI","CIRO_EDILDI","TEMINATA_CIKTI","ODENDI","IADE_EDILDI","MUSTERI_IADE","AVUKATA_CIKIS"]);
const SORUNLU    = new Set(["KARSILISIZ","PROTESTOLU"]);

// ─────────────────────────────────────────────────────────────────────────────
// SEKME YÖNETİMİ — ORTAK
// ─────────────────────────────────────────────────────────────────────────────

function _initTabs() {
  // Üst sekmeler (Müşteri / Kendi)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-main-tab]");
    if (!btn) return;
    const tab = btn.dataset.mainTab;
    document.querySelectorAll("[data-main-tab]").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".check-main-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const panel = document.getElementById("mainTab-" + tab);
    if (panel) panel.classList.add("active");
  });

  // Şube sekmeleri (Merkez / Adapazarı)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-branch]");
    if (!btn) return;
    btn.closest(".check-branch-tab-bar").querySelectorAll("[data-branch]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".branch-panel").forEach(p => { p.style.display = "none"; });
    const panel = document.getElementById("branchPanel-" + btn.dataset.branch);
    if (panel) panel.style.display = "block";
  });

  // Alt sekmeler (Portföyde / Tamamlanan / Sorunlu)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-sub]");
    if (!btn) return;
    const sub = btn.dataset.sub;
    btn.closest(".check-sub-tab-bar").querySelectorAll("[data-sub]").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".check-sub-panel").forEach(p => {
      if (p.id && sub.startsWith(p.id.split("-")[0])) p.classList.remove("active");
    });
    btn.classList.add("active");
    const panel = document.getElementById(sub);
    if (panel) panel.classList.add("active");
  });
}

// Şube tab etiketlerini şirket adıyla güncelle
function _setBranchLabels() {
  const myName    = sessionStorage.getItem("companyName") || "Kendi Şubemiz";
  const labelOwn  = document.getElementById("branchTabLabel-merkez");
  if (labelOwn) labelOwn.textContent = myName + " Çekleri";
}

_initTabs();

// ─────────────────────────────────────────────────────────────────────────────
// KART OLUŞTURMA — ÇEK
// ─────────────────────────────────────────────────────────────────────────────

function _buildCheckCard(c) {
  const due      = getDueStatus(c.dueDate);
  const dueClass = due ? due.class : "";
  const dueBadge = due ? `<span class="due-badge ${due.class}">${due.text}</span>` : "";
  const st       = STATUS_MAP[c.status] || { label: c.status, cls: "status-portfolio" };
  const amount   = formatMoney(c.amount);
  const id       = parseInt(c.id, 10);

  const isPortfoyde  = c.status === "PORTFOYDE";
  const isTahsil     = c.status === "TAHSIL_EDILDI";
  const isCiro       = c.status === "CIRO_EDILDI";
  const isTeminat    = c.status === "TEMINATA_CIKTI";
  const isKarsilisiz = c.status === "KARSILISIZ";
  // Not: Çeklerde sadece KARŞILIKSIz kullanılır, PROTESTOLU yok

  let menuItems = "";

  if (isPortfoyde) {
    if (c.checkType === "KENDI") {
      menuItems = `
        <button onclick="openPaidModal(${id})"><i class="zmdi zmdi-check"></i> Ödendi</button>
        <button onclick="openBadDebtModal(${id},'KARSILISIZ','check')"><i class="zmdi zmdi-alert-triangle"></i> Karşılıksız</button>`;
    } else {
      menuItems = `
        <button onclick="collectCheck(${id})"><i class="zmdi zmdi-money"></i> Tahsil Et</button>
        <button onclick="openEndorseModal(${id},'check')"><i class="zmdi zmdi-share"></i> Ciro Et</button>
        <button onclick="openBadDebtModal(${id},'KARSILISIZ','check')"><i class="zmdi zmdi-alert-triangle"></i> Karşılıksız</button>`;
    }
  }

  if (isTahsil || isCiro || isTeminat) {
    menuItems = `<button onclick="openReturnModal(${id},'check')"><i class="zmdi zmdi-undo"></i> İade Et</button>`;
  }

  if (isKarsilisiz) {
    menuItems = `
      <button onclick="openBadDebtExitModal(${id},'MUSTERI_IADE','check')"><i class="zmdi zmdi-account"></i> Müşteriye İade</button>
      <button onclick="openBadDebtExitModal(${id},'AVUKATA_CIKIS','check')"><i class="zmdi zmdi-balance"></i> Avukata Çıkış</button>`;
  }

  const actions = menuItems ? `
    <div class="check-menu">
      <button class="check-menu-btn"><i class="zmdi zmdi-more-vert"></i></button>
      <div class="check-menu-dropdown">${menuItems}</div>
    </div>` : "";

  return `
<div class="col-xl-4 col-md-6 mb-30" data-check-id="${c.id}">
  <div class="box check-card ${st.cls} ${dueClass}">
    <div class="box-head d-flex justify-content-between align-items-center">
      <h5 class="title mb-0">${escapeHtml(formatBank(c.bank))}</h5>
      <div class="check-actions">
        ${dueBadge}
        <span class="check-status ${st.cls}">${st.label}</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// KART OLUŞTURMA — SENET
// ─────────────────────────────────────────────────────────────────────────────

function _buildNoteCard(n) {
  const due      = getDueStatus(n.dueDate);
  const dueClass = due ? due.class : "";
  const dueBadge = due ? `<span class="due-badge ${due.class}">${due.text}</span>` : "";
  const st       = STATUS_MAP[n.status] || { label: n.status, cls: "status-portfolio" };
  const amount   = formatMoney(n.amount);
  const id       = parseInt(n.id, 10);

  const isPortfoyde = n.status === "PORTFOYDE";
  const isTahsil    = n.status === "TAHSIL_EDILDI";
  const isCiro      = n.status === "CIRO_EDILDI";
  const isTeminat   = n.status === "TEMINATA_CIKTI";
  const isProtestolu = n.status === "PROTESTOLU";
  // Not: Senetlerde sadece PROTESTOLU kullanılır, KARSILISIZ yok

  let menuItems = "";

  if (isPortfoyde) {
    menuItems = `
      <button onclick="collectNote(${id})"><i class="zmdi zmdi-money"></i> Tahsil Et</button>
      <button onclick="openEndorseModal(${id},'note')"><i class="zmdi zmdi-share"></i> Ciro Et</button>
      <button onclick="openBadDebtModal(${id},'PROTESTOLU','note')"><i class="zmdi zmdi-flag"></i> Protestolu</button>`;
  }

  if (isTahsil || isCiro || isTeminat) {
    menuItems = `<button onclick="openReturnModal(${id},'note')"><i class="zmdi zmdi-undo"></i> İade Et</button>`;
  }

  if (isProtestolu) {
    menuItems = `
      <button onclick="openBadDebtExitModal(${id},'MUSTERI_IADE','note')"><i class="zmdi zmdi-account"></i> Müşteriye İade</button>
      <button onclick="openBadDebtExitModal(${id},'AVUKATA_CIKIS','note')"><i class="zmdi zmdi-balance"></i> Avukata Çıkış</button>`;
  }

  const actions = menuItems ? `
    <div class="check-menu">
      <button class="check-menu-btn"><i class="zmdi zmdi-more-vert"></i></button>
      <div class="check-menu-dropdown">${menuItems}</div>
    </div>` : "";

  return `
<div class="col-xl-4 col-md-6 mb-30" data-note-id="${n.id}">
  <div class="box check-card ${st.cls} ${dueClass}">
    <div class="box-head d-flex justify-content-between align-items-center">
      <h5 class="title mb-0">${escapeHtml(n.debtor || "Senet")}</h5>
      <div class="check-actions">
        ${dueBadge}
        <span class="check-status ${st.cls}">${st.label}</span>
        ${actions}
      </div>
    </div>
    <div class="box-body">
      <div class="check-info">
        <div class="check-row"><span class="label">Senet No</span><span class="value">${escapeHtml(n.noteNo)}</span></div>
        <div class="check-row"><span class="label">Vade</span><span class="value">${escapeHtml(n.dueDate)}</span></div>
        <div class="check-description">${escapeHtml(n.description) || "-"}</div>
      </div>
      <div class="check-amount">${amount}</div>
    </div>
  </div>
</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL STATE
// ─────────────────────────────────────────────────────────────────────────────

let selectedCheckId  = null;
let _endorseId       = null, _endorseType    = null;
let _collectId       = null, _collectType    = null;
let _returnId        = null, _returnType     = null;
let _badDebtId       = null, _badDebtStatus  = null, _badDebtEntityType = null;
let _badDebtExitId   = null, _badDebtExitType = null, _badDebtExitEntityType = null;

function _clearModalState() {
  selectedCheckId = null;
  _endorseId = _endorseType = null;
  _collectId = _collectType = null;
  _returnId  = _returnType  = null;
  _badDebtId = _badDebtStatus = _badDebtEntityType = null;
  _badDebtExitId = _badDebtExitType = _badDebtExitEntityType = null;
  const btn = document.getElementById("dynamicModalSubmitBtn");
  if (btn) btn.style.display = "";
}

document.addEventListener("click", function (e) {
  if (e.target.closest("[data-close='dynamicModal']")) _clearModalState();
});

function _openModal(title, subtitle, icon, bodyHtml, hideSubmit = false) {
  document.getElementById("dynamicModalTitle").textContent    = title;
  document.getElementById("dynamicModalSubtitle").textContent = subtitle;
  document.getElementById("dynamicModalIcon").innerHTML       = icon;
  document.getElementById("dynamicModalBody").innerHTML       = bodyHtml;
  const btn = document.getElementById("dynamicModalSubmitBtn");
  if (btn) btn.style.display = hideSubmit ? "none" : "";
  document.getElementById("dynamicModal").classList.add("active");
}

// ─────────────────────────────────────────────────────────────────────────────
// CİRO MODALI
// ─────────────────────────────────────────────────────────────────────────────

function openEndorseModal(id, type) {
  _endorseId = id; _endorseType = type;
  const label = type === "check" ? "Çek" : "Senet";
  _openModal(`${label} Ciro Et`, "Ciro bilgilerini girin", `<i class="zmdi zmdi-share"></i>`, `
    <div class="kasa-form-group">
      <label>Ciro Edilen Kişi / Firma</label>
      <input id="endorsedTo" class="kasa-modal-input" type="text" placeholder="Ad Soyad veya Firma Adı">
    </div>
    <div class="kasa-form-group">
      <label>Açıklama</label>
      <textarea id="endorseDesc" class="kasa-modal-textarea" placeholder="Opsiyonel açıklama"></textarea>
    </div>`);
}

async function submitEndorse() {
  const endorsedTo = document.getElementById("endorsedTo")?.value?.trim();
  const desc       = document.getElementById("endorseDesc")?.value?.trim() || "";
  if (!endorsedTo) { showToast("Ciro edilen kişi/firma adını girin", "error"); return; }
  const btn = document.getElementById("dynamicModalSubmitBtn");
  try {
    await withLoadingBtn(btn, async () => {
      const payload = { id: _endorseId, endorsedTo, description: desc };
      if (_endorseType === "check") {
        await checkApi.endorse(payload);
        showToast("Çek ciro edildi", "success");
        _removeCheckCard(_endorseId);
      } else {
        await noteApi.endorse(payload);
        showToast("Senet ciro edildi", "success");
        _removeNoteCard(_endorseId);
      }
      document.getElementById("dynamicModal").classList.remove("active");
      _clearModalState();
    });
  } catch (e) { showToast("Ciro başarısız: " + (e.message || ""), "error"); }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAHSİL MODALI
// ─────────────────────────────────────────────────────────────────────────────

function openCollectModal(id, type) {
  _collectId = id; _collectType = type;
  const label = type === "check" ? "Çek" : "Senet";
  _openModal(`${label} Tahsil Et`, "Tahsilat yöntemini seçin", `<i class="zmdi zmdi-money"></i>`, `
    <div style="display:flex;flex-direction:column;gap:12px">
      <button onclick="executeCollect('CASH')" class="collect-option" style="border-color:rgba(16,185,129,.35);background:rgba(16,185,129,.08)">
        <i class="zmdi zmdi-balance-wallet" style="color:#10b981;font-size:24px"></i>
        <div><div style="font-weight:700;font-size:15px">Kasaya Tahsil</div><div style="font-size:12px;color:#64748b">Kasa bakiyesine eklenir</div></div>
      </button>
      <button onclick="executeCollect('BANK')" class="collect-option" style="border-color:rgba(59,130,246,.35);background:rgba(59,130,246,.08)">
        <i class="zmdi zmdi-card" style="color:#3b82f6;font-size:24px"></i>
        <div><div style="font-weight:700;font-size:15px">Bankaya Tahsil</div><div style="font-size:12px;color:#64748b">Banka hesabına aktarılır</div></div>
      </button>
      <button onclick="executeCollect('COLLATERAL')" class="collect-option" style="border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.08)">
        <i class="zmdi zmdi-lock" style="color:#f59e0b;font-size:24px"></i>
        <div><div style="font-weight:700;font-size:15px">Teminata Çıktı</div><div style="font-size:12px;color:#64748b">Teminat olarak kullanılır</div></div>
      </button>
    </div>`, true);
}

async function executeCollect(collectType) {
  const id = _collectId, type = _collectType;
  document.getElementById("dynamicModal").classList.remove("active");
  _clearModalState();
  try {
    const label   = type === "check" ? "Çek" : "Senet";
    const msgTail = collectType === "BANK" ? "bankaya tahsil edildi"
                  : collectType === "COLLATERAL" ? "teminata çıktı" : "kasaya tahsil edildi";
    if (type === "check") { await checkApi.collect({ id, collectType }); _removeCheckCard(id); }
    else                  { await noteApi.collect({ id, collectType });  _removeNoteCard(id);  }
    showToast(`${label} ${msgTail}`, "success");
    await _reloadAll();
  } catch (e) { showToast("Tahsil başarısız: " + (e.message || ""), "error"); }
}

// ─────────────────────────────────────────────────────────────────────────────
// İADE MODALI
// ─────────────────────────────────────────────────────────────────────────────

function openReturnModal(id, type) {
  _returnId = id; _returnType = type;
  const label = type === "check" ? "Çek" : "Senet";
  _openModal(`${label} İade Et`, "Portföye geri alınacak", `<i class="zmdi zmdi-undo"></i>`, `
    <div class="kasa-form-group">
      <label>Açıklama</label>
      <textarea id="returnDesc" class="kasa-modal-textarea" placeholder="İade nedeni (opsiyonel)"></textarea>
    </div>`);
}

async function submitReturn() {
  const desc = document.getElementById("returnDesc")?.value?.trim() || "";
  const btn  = document.getElementById("dynamicModalSubmitBtn");
  try {
    await withLoadingBtn(btn, async () => {
      const payload = { id: _returnId, description: desc };
      if (_returnType === "check") {
        await checkApi.returnToPortfolio(payload);
        showToast("Çek portföye iade edildi", "success");
      } else {
        await noteApi.returnToPortfolio(payload);
        showToast("Senet portföye iade edildi", "success");
      }
      document.getElementById("dynamicModal").classList.remove("active");
      _clearModalState();
      await _reloadAll();
    });
  } catch (e) { showToast("İade başarısız: " + (e.message || ""), "error"); }
}

// ─────────────────────────────────────────────────────────────────────────────
// KARŞILIKSIZ / PROTESTOLU GİRİŞ MODALI
// ─────────────────────────────────────────────────────────────────────────────

function openBadDebtModal(id, status, entityType) {
  _badDebtId = id; _badDebtStatus = status; _badDebtEntityType = entityType;
  const label = status === "KARSILISIZ" ? "Karşılıksız" : "Protestolu";
  _openModal(`${label} Olarak İşaretle`, "Çek sorunlu statüye alınacak",
    `<i class="zmdi zmdi-alert-triangle"></i>`, `
    <div style="padding:12px;border-radius:10px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);margin-bottom:16px">
      <div style="font-weight:600;color:#ef4444;margin-bottom:4px">${label} Uyarısı</div>
      <div style="font-size:13px;color:#94a3b8">Sonrasında müşteriye iade veya avukata çıkış yapabilirsiniz.</div>
    </div>
    <div class="kasa-form-group">
      <label>Açıklama</label>
      <textarea id="badDebtDesc" class="kasa-modal-textarea" placeholder="Açıklama (opsiyonel)"></textarea>
    </div>`);
}

async function submitBadDebt() {
  const desc = document.getElementById("badDebtDesc")?.value?.trim() || "";
  const btn  = document.getElementById("dynamicModalSubmitBtn");
  try {
    await withLoadingBtn(btn, async () => {
      const payload = { id: _badDebtId, badStatus: _badDebtStatus, description: desc };
      if (_badDebtEntityType === "check") {
        await checkApi.markAsBadDebt(payload);
      } else {
        await noteApi.markAsBadDebt(payload);
      }
      const label = _badDebtStatus === "KARSILISIZ" ? "Karşılıksız" : "Protestolu";
      showToast(`${label} olarak işaretlendi`, "success");
      document.getElementById("dynamicModal").classList.remove("active");
      _clearModalState();
      await _reloadAll();
    });
  } catch (e) { showToast("İşlem başarısız: " + (e.message || ""), "error"); }
}

// ─────────────────────────────────────────────────────────────────────────────
// SORUNLUDAN ÇIKIŞ MODALI
// ─────────────────────────────────────────────────────────────────────────────

function openBadDebtExitModal(id, exitType, entityType) {
  _badDebtExitId = id; _badDebtExitType = exitType; _badDebtExitEntityType = entityType;
  const label = exitType === "MUSTERI_IADE" ? "Müşteriye İade" : "Avukata Çıkış";
  const icon  = exitType === "MUSTERI_IADE" ? "zmdi-account" : "zmdi-balance";
  _openModal(label, "Açıklama girerek onaylayın", `<i class="zmdi ${icon}"></i>`, `
    <div class="kasa-form-group">
      <label>Açıklama <span style="color:#ef4444">*</span></label>
      <textarea id="badDebtExitDesc" class="kasa-modal-textarea" placeholder="${label} için açıklama giriniz..." required></textarea>
    </div>`);
}

async function submitBadDebtExit() {
  const desc = document.getElementById("badDebtExitDesc")?.value?.trim();
  if (!desc) { showToast("Açıklama zorunludur", "error"); return; }
  const btn = document.getElementById("dynamicModalSubmitBtn");
  try {
    await withLoadingBtn(btn, async () => {
      const payload = { id: _badDebtExitId, exitType: _badDebtExitType, description: desc };
      if (_badDebtExitEntityType === "check") {
        await checkApi.exitBadDebt(payload);
      } else {
        await noteApi.exitBadDebt(payload);
      }
      const label = _badDebtExitType === "MUSTERI_IADE" ? "Müşteriye iade edildi" : "Avukata çıkış yapıldı";
      showToast(label, "success");
      document.getElementById("dynamicModal").classList.remove("active");
      _clearModalState();
      await _reloadAll();
    });
  } catch (e) { showToast("İşlem başarısız: " + (e.message || ""), "error"); }
}

// ─────────────────────────────────────────────────────────────────────────────
// KENDİ ÇEK ÖDEME MODALI
// ─────────────────────────────────────────────────────────────────────────────

function openPaidModal(id) {
  selectedCheckId = id;
  _openModal("Çek Ödeme", "Çek ödendi olarak işaretlenecek", `<i class="zmdi zmdi-check-circle"></i>`, `
    <div class="kasa-form-group">
      <label>Açıklama</label>
      <textarea id="paidDescription" class="kasa-modal-textarea" placeholder="Örn: X banka hesabından ödendi"></textarea>
    </div>`);
}

async function submitPaid() {
  const desc = document.getElementById("paidDescription")?.value || "";
  const btn  = document.getElementById("dynamicModalSubmitBtn");
  try {
    await withLoadingBtn(btn, async () => {
      await checkApi.markAsPaid({ id: selectedCheckId, description: desc });
      showToast("Çek ödendi olarak işaretlendi", "success");
      document.getElementById("dynamicModal").classList.remove("active");
      _removeCheckCard(selectedCheckId);
      _clearModalState();
      await _reloadAll();
    });
  } catch (e) { showToast(e.message || "Hata oluştu", "error"); }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEK SUBMIT NOKTASI
// ─────────────────────────────────────────────────────────────────────────────

function submitDynamicModal() {
  if (_endorseId !== null)     return submitEndorse();
  if (_returnId !== null)      return submitReturn();
  if (_badDebtId !== null)     return submitBadDebt();
  if (_badDebtExitId !== null) return submitBadDebtExit();
  return submitPaid();
}

// ─────────────────────────────────────────────────────────────────────────────
// YÜKLEME — ÇEK (SEKMELİ)
// ─────────────────────────────────────────────────────────────────────────────

async function loadChecks({ silent = false } = {}) {
  const hasTabbed = !!document.getElementById("checkContainer-merkez-portfoyde");
  if (!hasTabbed) return;

  const myCompanyId = Number(sessionStorage.getItem("companyId") || "0");

  const allKeys = [
    "merkez-portfoyde",   "merkez-tamamlanan",   "merkez-sorunlu",
    "adapazari-portfoyde","adapazari-tamamlanan","adapazari-sorunlu",
    "kendi-portfoyde",    "kendi-tamamlanan",    "kendi-sorunlu",
  ];

  if (!silent) {
    allKeys.forEach(id => {
      const el = document.getElementById("checkContainer-" + id);
      if (el) el.innerHTML = "<div style='padding:20px'>Yükleniyor...</div>";
    });
  }

  let checks = [];
  try {
    checks = await checkStore.fetchChecks();
  } catch (e) {
    showToast("Çekler alınamadı: " + e.message, "error");
    return;
  }

  allKeys.forEach(id => {
    const el = document.getElementById("checkContainer-" + id);
    if (el) el.innerHTML = "";
  });

  const counts = {};
  allKeys.forEach(k => { counts[k] = 0; });

  checks.forEach(c => {
    const kategori = SORUNLU.has(c.status) ? "sorunlu"
                   : TAMAMLANAN.has(c.status) ? "tamamlanan"
                   : "portfoyde";
    let key;
    if (c.checkType === "KENDI") {
      key = `kendi-${kategori}`;
    } else {
      const branch = (!c.companyId || !myCompanyId || Number(c.companyId) === myCompanyId) ? "merkez" : "adapazari";
      key = `${branch}-${kategori}`;
    }
    counts[key] = (counts[key] || 0) + 1;
    const container = document.getElementById(`checkContainer-${key}`);
    if (container) container.insertAdjacentHTML("beforeend", _buildCheckCard(c));
  });

  Object.entries(counts).forEach(([key, val]) => {
    const el = document.getElementById("cnt-" + key);
    if (el) el.textContent = val || "";
  });

  // Şube buton toplam sayaçları
  const merkezTotal   = counts["merkez-portfoyde"]   + counts["merkez-tamamlanan"]   + counts["merkez-sorunlu"];
  const adapazariTotal = counts["adapazari-portfoyde"] + counts["adapazari-tamamlanan"] + counts["adapazari-sorunlu"];
  const cntMerkez = document.getElementById("cnt-branch-merkez");
  const cntAdap   = document.getElementById("cnt-branch-adapazari");
  if (cntMerkez) cntMerkez.textContent = merkezTotal || "";
  if (cntAdap)   cntAdap.textContent   = adapazariTotal || "";

  allKeys.forEach(id => {
    const el = document.getElementById("checkContainer-" + id);
    if (el && !el.children.length) {
      el.innerHTML = "<p style='padding:20px;color:#aaa'>Kayıt bulunamadı.</p>";
    }
  });

  _refreshCheckSummaryFromCache();
}

// ─────────────────────────────────────────────────────────────────────────────
// YÜKLEME — SENET (SEKMELİ)
// ─────────────────────────────────────────────────────────────────────────────

async function loadNotes({ silent = false } = {}) {
  const hasTabbed = !!document.getElementById("noteContainer-portfoyde");
  // Eski tek container desteği
  const legacyContainer = document.getElementById("noteContainer");

  if (!hasTabbed && !legacyContainer) return;

  if (!silent && hasTabbed) {
    ["portfoyde","tamamlanan","sorunlu"].forEach(id => {
      const el = document.getElementById("noteContainer-" + id);
      if (el) el.innerHTML = "<div style='padding:20px'>Yükleniyor...</div>";
    });
  }

  let notes = [];
  try {
    notes = await noteStore.fetchNotes();
  } catch (e) {
    showToast("Senetler alınamadı: " + e.message, "error");
    return;
  }

  if (hasTabbed) {
    ["portfoyde","tamamlanan","sorunlu"].forEach(id => {
      const el = document.getElementById("noteContainer-" + id);
      if (el) el.innerHTML = "";
    });

    const counts = { portfoyde: 0, tamamlanan: 0, sorunlu: 0 };

    notes.forEach(n => {
      const kategori = SORUNLU.has(n.status) ? "sorunlu"
                     : TAMAMLANAN.has(n.status) ? "tamamlanan"
                     : "portfoyde";
      counts[kategori]++;
      const container = document.getElementById("noteContainer-" + kategori);
      if (container) container.insertAdjacentHTML("beforeend", _buildNoteCard(n));
    });

    Object.entries(counts).forEach(([key, val]) => {
      const el = document.getElementById("cnt-note-" + key);
      if (el) el.textContent = val || "";
    });

    ["portfoyde","tamamlanan","sorunlu"].forEach(id => {
      const el = document.getElementById("noteContainer-" + id);
      if (el && !el.children.length) {
        el.innerHTML = "<p style='padding:20px;color:#aaa'>Kayıt bulunamadı.</p>";
      }
    });
  } else if (legacyContainer) {
    legacyContainer.innerHTML = "";
    notes.forEach(n => legacyContainer.insertAdjacentHTML("beforeend", _buildNoteCard(n)));
  }

  _refreshNoteSummaryFromCache();
}

// ─────────────────────────────────────────────────────────────────────────────
// ÖZET
// ─────────────────────────────────────────────────────────────────────────────

async function loadCheckSummary() {
  const tutarEl = document.getElementById("cekToplamTutar");
  const adetEl  = document.getElementById("cekAdet");
  if (!tutarEl || !adetEl) return;
  try {
    tutarEl.innerText = "..."; adetEl.innerText = "...";
    // /checks/portfolio returns only own-branch portfolio checks (backend-filtered)
    const portfolio = await checkApi.getPortfolio();
    const total     = (portfolio || []).reduce((s, c) => s + Number(c.amount || 0), 0);
    animateValue(tutarEl, total);
    adetEl.innerText = `${(portfolio || []).length} adet`;
    setAutoBar("barCekler", Math.min((portfolio || []).length * 10, 100), 100);
  } catch (e) {
    tutarEl.innerText = "0"; adetEl.innerText = "0";
  }
}

async function loadNotesDashboard() {
  const adetEl  = document.getElementById("senetAdet");
  const tutarEl = document.getElementById("senetToplamTutar");
  if (!adetEl || !tutarEl) return;
  try {
    const notes     = await noteStore.fetchNotes();
    const portfolio = (notes || []).filter(n => n.status === "PORTFOYDE");
    const toplam    = portfolio.reduce((s, n) => s + Number(n.amount || 0), 0);
    adetEl.innerText = `${portfolio.length} adet`;
    animateValue(tutarEl, toplam);
  } catch (e) { showToast("Senet dashboard yüklenemedi", "error"); }
}

// ─────────────────────────────────────────────────────────────────────────────
// YARDIMCI
// ─────────────────────────────────────────────────────────────────────────────

function _removeCheckCard(id) {
  const card = document.querySelector(`[data-check-id="${id}"]`);
  if (card) { card.classList.add("kasa-card-exit"); setTimeout(() => card.remove(), 580); }
  checkStore.removeCheck(id);
  _refreshCheckSummaryFromCache();
}

function _removeNoteCard(id) {
  const card = document.querySelector(`[data-note-id="${id}"]`);
  if (card) { card.classList.add("kasa-card-exit"); setTimeout(() => card.remove(), 580); }
  noteStore.removeNote(id);
  _refreshNoteSummaryFromCache();
}

function _refreshCheckSummaryFromCache() {
  const myCompanyId = Number(sessionStorage.getItem("companyId") || "0");
  const portfolio = (checkStore.checks || []).filter(c =>
    c.status === "PORTFOYDE" &&
    (c.checkType === "KENDI" || !c.companyId || !myCompanyId || Number(c.companyId) === myCompanyId)
  );
  const total   = portfolio.reduce((s, c) => s + Number(c.amount || 0), 0);
  const tutarEl = document.getElementById("cekToplamTutar");
  const adetEl  = document.getElementById("cekAdet");
  if (tutarEl) animateValue(tutarEl, total);
  if (adetEl)  adetEl.innerText = `${portfolio.length} adet`;
}

function _refreshNoteSummaryFromCache() {
  const portfolio = (noteStore.notes || []).filter(n => n.status === "PORTFOYDE");
  const total     = portfolio.reduce((s, n) => s + Number(n.amount || 0), 0);
  const adetEl    = document.getElementById("senetAdet");
  const tutarEl   = document.getElementById("senetToplamTutar");
  if (adetEl)  adetEl.innerText = `${portfolio.length} adet`;
  if (tutarEl) animateValue(tutarEl, total);
}

async function _reloadAll() {
  await Promise.all([
    loadChecks({ silent: true }).catch(() => {}),
    loadNotes({ silent: true }).catch(() => {}),
  ]);
}

function collectCheck(id) { openCollectModal(id, "check"); }
function collectNote(id)  { openCollectModal(id, "note");  }

// ─────────────────────────────────────────────────────────────────────────────
// ÇEK TİPİ TOGGLE (GİRİŞ FORMU)
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener("click", function (e) {
  const opt = e.target.closest(".check-type-option");
  if (!opt || !opt.dataset.value) return;
  document.querySelectorAll(".check-type-option").forEach(o => o.classList.remove("check-type-active"));
  opt.classList.add("check-type-active");
  const input = document.getElementById("checkTypeInput");
  if (input) input.value = opt.dataset.value;
});

// ─────────────────────────────────────────────────────────────────────────────
// ÇEK FORM SUBMIT
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener("click", async function (e) {
  const btn = e.target.closest("#btnCheckIn");
  if (!btn) return;
  e.preventDefault();
  const payload = {
    checkNo:     document.getElementById("checkNo")?.value,
    bank:        document.getElementById("bank")?.value,
    dueDate:     document.getElementById("dueDate")?.value,
    amount:      parseMoney(document.getElementById("tutar")?.value),
    description: document.getElementById("description")?.value,
    checkType:   document.getElementById("checkTypeInput")?.value || "MUSTERI"
  };
  try {
    await checkApi.create(payload);
    showToast("Çek giriş yapıldı", "success");
    refreshCalendar?.();
    setTimeout(() => {
      loadPage("cekler.html");
      setTimeout(() => initDashboard?.(), 300);
    }, 1200);
  } catch (e) { showToast("Hata: " + e.message, "error"); }
});

// ─────────────────────────────────────────────────────────────────────────────
// SENET FORM SUBMIT
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener("click", async function (e) {
  const btn = e.target.closest("#btnNoteIn");
  if (!btn) return;
  e.preventDefault();
  const payload = {
    noteNo:      document.getElementById("noteNo")?.value,
    dueDate:     document.getElementById("dueDate")?.value,
    amount:      parseMoney(document.getElementById("tutar")?.value),
    description: document.getElementById("description")?.value || ""
  };
  if (!payload.noteNo || !payload.dueDate || !payload.amount) {
    showToast("Tüm alanları doldurun", "error"); return;
  }
  try {
    await withLoadingBtn(btn, async () => {
      await noteStore.createNote(payload);
      showToast("Senet giriş yapıldı", "success");
      refreshCalendar?.();
      setTimeout(() => loadPage("senetler.html"), 1000);
    });
  } catch (e) { showToast("Senet kaydedilemedi: " + (e.message || ""), "error"); }
});

// ─────────────────────────────────────────────────────────────────────────────
// SAYFA INIT
// ─────────────────────────────────────────────────────────────────────────────

function initCheckPage() {
  _setBranchLabels();
  loadChecks();
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL EXPORT
// ─────────────────────────────────────────────────────────────────────────────

window.initCheckPage        = initCheckPage;
window.loadChecks           = loadChecks;
window.loadNotes            = loadNotes;
window.loadCheckSummary     = loadCheckSummary;
window.loadNotesDashboard   = loadNotesDashboard;
window.collectCheck         = collectCheck;
window.collectNote          = collectNote;
window.openCollectModal     = openCollectModal;
window.executeCollect       = executeCollect;
window.openEndorseModal     = openEndorseModal;
window.submitEndorse        = submitEndorse;
window.openReturnModal      = openReturnModal;
window.submitReturn         = submitReturn;
window.openBadDebtModal     = openBadDebtModal;
window.submitBadDebt        = submitBadDebt;
window.openBadDebtExitModal = openBadDebtExitModal;
window.submitBadDebtExit    = submitBadDebtExit;
window.openPaidModal        = openPaidModal;
window.submitPaid           = submitPaid;
window.submitDynamicModal   = submitDynamicModal;
window._removeCheckCard     = _removeCheckCard;
window._removeNoteCard      = _removeNoteCard;
