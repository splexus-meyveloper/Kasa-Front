// ==============================
// TRANSFER UI MODULE
// ==============================

const isAdmin = () => sessionStorage.getItem("role") === "ADMIN";

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFER OLUŞTUR SAYFASI
// ─────────────────────────────────────────────────────────────────────────────

let _selectedCheckIds = new Set();
let _selectedNoteIds  = new Set();

function _isMerkezUser() {
  // branchType yoksa (eski token) güvenli taraf: transfer oluşturmayı kapat
  const branchType = sessionStorage.getItem("branchType");
  return branchType !== "SUBE";
}

async function initTransferOlustur() {
  // Merkez kullanıcıları transfer oluşturamaz
  if (_isMerkezUser()) {
    const body = document.querySelector("#pageContent .box-body");
    if (body) {
      body.insertAdjacentHTML("afterbegin", `
        <div style="padding:14px 16px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);
                    border-radius:8px;color:#fbbf24;font-size:14px;margin-bottom:20px">
          <i class="zmdi zmdi-info-outline"></i>
          Bu ekran sadece <strong>şube kullanıcıları</strong> tarafından kullanılabilir.
          Merkez kullanıcıları transfer oluşturamaz; transfer listesini ve onay ekranını kullanın.
        </div>`);
    }
    const submitBtn = document.getElementById("btnTransferOlustur");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.45";
      submitBtn.style.cursor  = "not-allowed";
    }
    document.querySelectorAll(".transfer-type-btn, #transferTutar, #transferAciklama").forEach(el => {
      el.disabled = true;
      el.style.pointerEvents = "none";
      el.style.opacity = "0.45";
    });
    return;
  }

  // Tip buton toggle
  document.querySelectorAll(".transfer-type-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".transfer-type-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tip = btn.dataset.type;
      document.getElementById("transferType").value = tip;

      const nakitAlani   = document.getElementById("nakitAlani");
      const cekSenetAlani = document.getElementById("cekSenetAlani");

      if (tip === "CEK_SENET") {
        nakitAlani.style.display    = "none";
        cekSenetAlani.style.display = "block";
        _loadTransferableItems();
      } else {
        nakitAlani.style.display    = "block";
        cekSenetAlani.style.display = "none";
      }
    });
  });

  // Submit
  document.getElementById("btnTransferOlustur")?.addEventListener("click", _submitTransfer);
}

async function _loadTransferableItems() {
  _selectedCheckIds.clear();
  _selectedNoteIds.clear();

  const checkList = document.getElementById("transferCheckList");
  const noteList  = document.getElementById("transferNoteList");

  try {
    const [checks, notes] = await Promise.all([
      checkApi.getPortfolio(),
      noteApi.getPortfolio()
    ]);

    const portfolioChecks = (checks || []).filter(c => c.status === "PORTFOYDE");
    const portfolioNotes  = (notes  || []).filter(n => n.status === "PORTFOYDE");

    checkList.innerHTML = portfolioChecks.length
      ? portfolioChecks.map(c => _buildSelectItem(c.id, "CHECK",
          `${formatBank(c.bank)} — ${c.checkNo}`, c.amount, c.dueDate)).join("")
      : "<div style='color:#64748b;font-size:13px'>Portföyde çek yok</div>";

    noteList.innerHTML = portfolioNotes.length
      ? portfolioNotes.map(n => _buildSelectItem(n.id, "NOTE",
          `Senet No: ${n.noteNo}`, n.amount, n.dueDate)).join("")
      : "<div style='color:#64748b;font-size:13px'>Portföyde senet yok</div>";

    // Seçim event'leri
    document.querySelectorAll(".transfer-select-item").forEach(el => {
      el.addEventListener("click", () => _toggleItem(el));
    });

  } catch (e) {
    checkList.innerHTML = "<div style='color:#ef4444'>Yüklenemedi</div>";
    noteList.innerHTML  = "";
  }
}

function _buildSelectItem(id, type, label, amount, dueDate) {
  return `
<div class="transfer-select-item" data-id="${id}" data-type="${type}" data-amount="${amount}">
  <div style="flex:1">
    <div style="font-weight:600;font-size:14px">${escapeHtml(label)}</div>
    <div style="font-size:12px;color:#64748b">Vade: ${dueDate} • ${formatMoney(amount)}</div>
  </div>
  <div class="transfer-select-check"><i class="zmdi zmdi-check"></i></div>
</div>`;
}

function _toggleItem(el) {
  const id   = el.dataset.id;
  const type = el.dataset.type;
  const amount = parseFloat(el.dataset.amount || 0);

  el.classList.toggle("selected");
  const set = type === "CHECK" ? _selectedCheckIds : _selectedNoteIds;
  if (el.classList.contains("selected")) set.add(id);
  else set.delete(id);

  // Toplam güncelle
  let toplam = 0;
  document.querySelectorAll(".transfer-select-item.selected").forEach(s => {
    toplam += parseFloat(s.dataset.amount || 0);
  });
  const el2 = document.getElementById("transferSeciliToplam");
  if (el2) el2.textContent = formatMoney(toplam);
}

async function _submitTransfer() {
  const btn  = document.getElementById("btnTransferOlustur");
  const tip  = document.getElementById("transferType")?.value;
  const desc = document.getElementById("transferAciklama")?.value?.trim() || "";

  let payload = { transferType: tip, description: desc };

  if (tip === "CEK_SENET") {
    const checkIds = Array.from(_selectedCheckIds).map(Number);
    const noteIds  = Array.from(_selectedNoteIds).map(Number);
    if (!checkIds.length && !noteIds.length) {
      showToast("En az bir çek veya senet seçin", "error"); return;
    }
    payload.checkIds = checkIds;
    payload.noteIds  = noteIds;
  } else {
    const tutar = parseMoney(document.getElementById("transferTutar")?.value);
    if (!tutar || tutar <= 0) { showToast("Tutar girin", "error"); return; }
    payload.amount = tutar;
  }

  try {
    await withLoadingBtn(btn, async () => {
      await transferApi.create(payload);
      showToast("Transfer onaya gönderildi", "success");
      setTimeout(() => loadPage("transfer-listesi.html"), 1200);
    });
  } catch (e) { showToast("Hata: " + (e.message || ""), "error"); }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFER LİSTESİ SAYFASI
// ─────────────────────────────────────────────────────────────────────────────

function _initTransferTabs() {
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-transfer-tab]");
    if (!btn) return;
    const tab = btn.dataset.transferTab;
    document.querySelectorAll("[data-transfer-tab]").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".transfer-tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const panel = document.getElementById("transferTab-" + tab);
    if (panel) panel.classList.add("active");
  });
}
_initTransferTabs();

async function loadTransferListesi() {
  const hasTabs = !!document.getElementById("transferTab-bekleyen");
  if (!hasTabs) return;

  ["bekleyen","tamamlanan","reddedilen"].forEach(t => {
    const el = document.getElementById("transferTab-" + t);
    if (el) el.innerHTML = "<div style='padding:20px'>Yükleniyor...</div>";
  });

  try {
    const transfers = isAdmin()
      ? await transferApi.getAll()
      : await transferApi.getMy();

    const bekleyen    = transfers.filter(t => t.status === "PENDING");
    const tamamlanan  = transfers.filter(t => t.status === "APPROVED");
    const reddedilen  = transfers.filter(t => t.status === "REJECTED");

    _renderTransferList("bekleyen",   bekleyen);
    _renderTransferList("tamamlanan", tamamlanan);
    _renderTransferList("reddedilen", reddedilen);

    _updateCount("bekleyen",   bekleyen.length);
    _updateCount("tamamlanan", tamamlanan.length);
    _updateCount("reddedilen", reddedilen.length);

  } catch (e) { showToast("Transferler alınamadı: " + e.message, "error"); }
}

function _updateCount(tab, count) {
  const el = document.getElementById("cnt-transfer-" + tab);
  if (el) el.textContent = count || "";
}

function _renderTransferList(tab, list) {
  const container = document.getElementById("transferTab-" + tab);
  if (!container) return;
  if (!list.length) {
    container.innerHTML = "<p style='padding:20px;color:#aaa'>Kayıt bulunamadı.</p>";
    return;
  }
  container.innerHTML = list.map(_buildTransferCard).join("");
}

function _buildTransferCard(t) {
  const tipLabel = {
    NAKIT_GONDERIM: "Nakit Gönderim",
    BANKA_YATIRMA:  "Banka Yatırma",
    CEK_SENET:      "Çek / Senet"
  }[t.transferType] || t.transferType;

  const tipIcon = {
    NAKIT_GONDERIM: "zmdi-money",
    BANKA_YATIRMA:  "zmdi-card",
    CEK_SENET:      "zmdi-collection-text"
  }[t.transferType] || "zmdi-swap";

  const statusBadge = {
    PENDING:  `<span class="transfer-badge badge-pending">Bekliyor</span>`,
    APPROVED: `<span class="transfer-badge badge-approved">Onaylandı</span>`,
    REJECTED: `<span class="transfer-badge badge-rejected">Reddedildi</span>`,
  }[t.status] || "";

  const tarih = t.createdAt ? t.createdAt.replace("T", " ").slice(0, 16) : "";
  const onayTarih = t.approvedAt ? t.approvedAt.replace("T", " ").slice(0, 16) : "";

  // Çek/senet kalemleri
  let itemsHtml = "";
  if (t.items && t.items.length) {
    itemsHtml = `
      <div style="margin-top:10px;border-top:1px solid rgba(255,255,255,.07);padding-top:10px">
        <div style="font-size:12px;color:#64748b;margin-bottom:6px">Kalemler</div>
        ${t.items.map(i => `
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0">
            <span style="color:#94a3b8">${i.itemType === "CHECK" ? "Çek" : "Senet"} — ${escapeHtml(i.referenceNo)}</span>
            <span style="font-weight:600">${formatMoney(i.amount)}</span>
          </div>`).join("")}
      </div>`;
  }

  // Admin için onay/red butonları
  let actionBtns = "";
  if (isAdmin() && t.status === "PENDING") {
    actionBtns = `
      <div style="display:flex;gap:8px;margin-top:14px">
        <button onclick="approveTransfer(${t.id})"
          style="flex:1;padding:10px;border-radius:8px;border:none;background:#16a34a;color:#fff;font-weight:600;cursor:pointer">
          <i class="zmdi zmdi-check"></i> Onayla
        </button>
        <button onclick="openRejectModal(${t.id})"
          style="flex:1;padding:10px;border-radius:8px;border:none;background:#dc2626;color:#fff;font-weight:600;cursor:pointer">
          <i class="zmdi zmdi-close"></i> Reddet
        </button>
      </div>`;
  }

  // Reddedilme gerekçesi
  const rejectHtml = t.rejectReason
    ? `<div style="margin-top:8px;padding:8px 12px;border-radius:6px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);font-size:13px;color:#fca5a5">
        <i class="zmdi zmdi-close-circle"></i> ${escapeHtml(t.rejectReason)}
       </div>` : "";

  return `
<div class="box mb-20" style="border-left:3px solid ${t.status === "APPROVED" ? "#16a34a" : t.status === "REJECTED" ? "#dc2626" : "#f59e0b"}">
  <div class="box-body">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:10px">
        <i class="zmdi ${tipIcon}" style="font-size:22px;color:#3b82f6"></i>
        <div>
          <div style="font-weight:700;font-size:15px">${tipLabel}</div>
          <div style="font-size:12px;color:#64748b">${escapeHtml(t.sourceCompanyName)} → ${escapeHtml(t.targetCompanyName)}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        ${statusBadge}
        <span style="font-size:18px;font-weight:800;color:#f1f5f9">${formatMoney(t.amount)}</span>
      </div>
    </div>

    ${t.description ? `<div style="margin-top:8px;font-size:13px;color:#94a3b8">${escapeHtml(t.description)}</div>` : ""}

    <div style="display:flex;gap:16px;margin-top:8px;font-size:12px;color:#475569">
      <span><i class="zmdi zmdi-time"></i> ${tarih}</span>
      ${onayTarih ? `<span><i class="zmdi zmdi-check-circle"></i> ${onayTarih}</span>` : ""}
    </div>

    ${itemsHtml}
    ${rejectHtml}
    ${actionBtns}
  </div>
</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ONAY / RED
// ─────────────────────────────────────────────────────────────────────────────

async function approveTransfer(id) {
  showConfirmToast("Bu transferi onaylamak istediğinize emin misiniz?", async () => {
    try {
      await transferApi.approve(id);
      showToast("Transfer onaylandı, işlemler gerçekleşti", "success");
      await loadTransferListesi();
      refreshOtherBranchCard?.();
      initDashboard?.();
    } catch (e) { showToast("Onay başarısız: " + (e.message || ""), "error"); }
  });
}

let _rejectTransferId = null;

function openRejectModal(id) {
  _rejectTransferId = id;
  _openModal("Transferi Reddet", "Red gerekçesini girin",
    `<i class="zmdi zmdi-close-circle"></i>`, `
    <div class="kasa-form-group">
      <label>Gerekçe <span style="color:#ef4444">*</span></label>
      <textarea id="rejectReason" class="kasa-modal-textarea" placeholder="Red gerekçesi..." required></textarea>
    </div>`);
}

async function submitRejectTransfer() {
  const reason = document.getElementById("rejectReason")?.value?.trim();
  if (!reason) { showToast("Gerekçe zorunludur", "error"); return; }
  const btn = document.getElementById("dynamicModalSubmitBtn");
  try {
    await withLoadingBtn(btn, async () => {
      await transferApi.reject(_rejectTransferId, reason);
      showToast("Transfer reddedildi", "success");
      document.getElementById("dynamicModal")?.classList.remove("active");
      _rejectTransferId = null;
      await loadTransferListesi();
    });
  } catch (e) { showToast("Red işlemi başarısız: " + (e.message || ""), "error"); }
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL EXPORT
// ─────────────────────────────────────────────────────────────────────────────

window.initTransferOlustur    = initTransferOlustur;
window.loadTransferListesi    = loadTransferListesi;
window.approveTransfer        = approveTransfer;
window.openRejectModal        = openRejectModal;
window.submitRejectTransfer   = submitRejectTransfer;
