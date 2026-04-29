// ==============================
// BANKA UI MODULE
// ==============================

// ── HESAPLAR SAYFASI ─────────────────────────────────────

async function initBankaHesaplari() {
  await _renderHesaplar();
  _bindHesaplarEvents();
  _bindIslemKodlariPanel();
}

async function _renderHesaplar() {
  const container = document.getElementById("bankaHesaplarContainer");
  if (!container) return;

  container.innerHTML = `<div class="col-12" style="padding:40px;text-align:center;color:#64748b">Yükleniyor...</div>`;

  let hesaplar = [];
  try {
    hesaplar = await bankaApi.getHesaplar() || [];
    console.log("[BankaHesaplar] API yanıtı:", hesaplar);
  } catch (e) {
    showToast("Banka hesapları alınamadı", "error");
    container.innerHTML = `<div class="col-12" style="padding:40px;text-align:center;color:#ef4444">Yüklenemedi</div>`;
    return;
  }

  if (!hesaplar.length) {
    container.innerHTML = `
      <div class="col-12" style="padding:60px;text-align:center;color:#64748b">
        <i class="zmdi zmdi-card" style="font-size:48px;display:block;margin-bottom:12px;opacity:.3"></i>
        Henüz banka hesabı eklenmemiş.
      </div>`;
    return;
  }

  container.innerHTML = "";
  hesaplar.forEach(h => {
    container.insertAdjacentHTML("beforeend", _buildHesapKart(h));
  });
}

function _buildHesapKart(h) {
  const bakiye = _pickBakiye(h);
  const bakiyeRenk = bakiye >= 0 ? "#10b981" : "#ef4444";
  const bakiyeStr = (bakiye >= 0 ? "+" : "") + formatMoney(bakiye) + " TL";

  return `
<div class="col-xl-4 col-md-6 mb-30">
  <div class="box check-card" style="cursor:pointer;transition:border-color .2s"
       onclick="window._bankaHesapAc(${parseInt(h.id, 10)})">
    <div class="box-head d-flex justify-content-between align-items-center">
      <h5 class="title mb-0">${escapeHtml(_pickBankaAdi(h) || "-")}</h5>
      <button class="btn-delete" style="flex-shrink:0"
        onclick="event.stopPropagation(); window._bankaHesapSil(${parseInt(h.id, 10)})">
        <i class="zmdi zmdi-delete"></i>
      </button>
    </div>
    <div class="box-body">
      <div class="check-info">
        <div class="check-row">
          <span class="label">Hesap Kodu</span>
          <span class="value">${escapeHtml(_pickHesapKodu(h) || "-")}</span>
        </div>
        <div class="check-row">
          <span class="label">Hesap No</span>
          <span class="value" style="font-size:11px;word-break:break-all">${escapeHtml(_pickHesapNo(h) || "-")}</span>
        </div>
      </div>
      <div class="check-amount" style="color:${bakiyeRenk};font-size:20px;margin-top:12px">${bakiyeStr}</div>
    </div>
    <div class="footer" style="padding:10px 16px;border-top:1px solid rgba(255,255,255,.06)">
      <span style="font-size:11px;color:#64748b">Detayları gör →</span>
    </div>
  </div>
</div>`;
}

function _bindHesaplarEvents() {
  const btnAc    = document.getElementById("btnYeniHesapAc");
  const btnIptal = document.getElementById("btnHesapIptal");
  const btnKaydet = document.getElementById("btnHesapKaydet");
  const form     = document.getElementById("yeniHesapForm");

  if (btnAc) {
    btnAc.addEventListener("click", () => {
      if (form) form.style.display = "";
      btnAc.style.display = "none";
    });
  }

  if (btnIptal) {
    btnIptal.addEventListener("click", () => {
      if (form) form.style.display = "none";
      if (btnAc) btnAc.style.display = "";
      _formTemizle();
    });
  }

  if (btnKaydet) {
    btnKaydet.addEventListener("click", _hesapKaydet);
  }
}

async function _hesapKaydet() {
  const hesapKodu = document.getElementById("bankaHesapKodu")?.value.trim();
  const bankaAdi  = document.getElementById("bankaBankaAdi")?.value.trim();
  const hesapNo   = document.getElementById("bankaHesapNo")?.value.trim();
  const bakiyeRaw = document.getElementById("bankaBakiye")?.value.trim();

  if (!hesapKodu || !bankaAdi) {
    showToast("Hesap kodu ve banka adı zorunludur", "error");
    return;
  }

  const bakiye = bakiyeRaw ? parseMoney(bakiyeRaw) : 0;

  try {
    await bankaApi.createHesap({ hesapKodu, bankaAdi, hesapNo, bakiye });
    showToast("Hesap eklendi", "success");
    _formTemizle();
    const form = document.getElementById("yeniHesapForm");
    const btnAc = document.getElementById("btnYeniHesapAc");
    if (form) form.style.display = "none";
    if (btnAc) btnAc.style.display = "";
    await _renderHesaplar();
  } catch (e) {
    showToast(e.message || "Hesap kaydedilemedi", "error");
  }
}

function _formTemizle() {
  ["bankaHesapKodu","bankaBankaAdi","bankaHesapNo","bankaBakiye"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

window._bankaHesapAc = function(id) {
  sessionStorage.setItem("aktifBankaHesapId", String(id));
  loadPage("banka-detay.html");
};

window._bankaHesapSil = function(id) {
  showConfirmToast("Bu hesabı silmek istediğinize emin misiniz?", async () => {
    try {
      await bankaApi.deleteHesap(id);
      showToast("Hesap silindi", "success");
      const card = document.querySelector(`[onclick*="_bankaHesapAc(${id})"]`)?.closest(".col-xl-4");
      if (card) {
        card.style.transition = "opacity .3s,transform .3s";
        card.style.opacity = "0";
        card.style.transform = "translateX(30px)";
        setTimeout(() => card.remove(), 320);
      } else {
        _renderHesaplar();
      }
    } catch (e) {
      showToast(e.message || "Hesap silinemedi", "error");
    }
  });
};


// ── DETAY SAYFASI ────────────────────────────────────────

let _bankaCurrentPage  = 0;
let _bankaTotalPages   = 0;
let _bankaHesapId      = null;
let _bankaAllIslemler  = [];
let _bankaSelectedIslemIds = new Set();

async function initBankaDetay() {
  _bankaHesapId = sessionStorage.getItem("aktifBankaHesapId");
  if (!_bankaHesapId) {
    showToast("Hesap seçilmedi", "error");
    loadPage("banka-hesaplari.html");
    return;
  }

  _bankaCurrentPage = 0;

  if (sessionStorage.getItem("role") !== "ADMIN") {
    const filtreRow = document.getElementById("bankaFiltreRow");
    if (filtreRow) filtreRow.style.display = "none";
  }

  await Promise.all([
    _loadDetayBilgi(),
    _loadIslemKodlari(),
  ]);

  await _loadIslemler(0, false);
  _bindDetayEvents();
}

async function _loadDetayBilgi() {
  try {
    const h = await bankaApi.getHesap(_bankaHesapId);
    console.log("[BankaDetay] Hesap API yanıtı:", h);
    _updateDetayHeader(h);
  } catch (e) {
    showToast("Hesap bilgisi alınamadı", "error");
  }
}

function _pickBakiye(h) {
  const val = h.bakiye
    ?? h.balance
    ?? h.currentBalance
    ?? h.guncelBakiye
    ?? h.mevcutBakiye
    ?? h.baslangicBakiye
    ?? h.baslangicBakiyesi
    ?? h.initialBalance
    ?? h.startBalance
    ?? h.startingBalance
    ?? null;
  return val !== null ? Number(val) : 0;
}

function _pickHesapNo(h) {
  return h.hesapNo
    || h.accountNo
    || h.accountNumber
    || h.hesapNumarasi
    || h.iban
    || h.IBAN
    || h.no
    || h.number
    || "";
}

function _pickBankaAdi(h) {
  return h.bankaAdi
    || h.bankName
    || h.bankAdi
    || h.banka
    || h.bank
    || h.name
    || h.ad
    || "";
}

function _pickHesapKodu(h) {
  return h.hesapKodu
    || h.accountCode
    || h.kod
    || h.code
    || h.hesapKod
    || "";
}

function _parseTarih(val) {
  if (!val) return "-";
  const s = String(val);
  // DD-MM-YYYY veya DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`);
    return isNaN(d) ? s : d.toLocaleDateString("tr-TR");
  }
  // ISO veya diğer JS-native formatlar
  const d = new Date(val);
  return isNaN(d) ? s : d.toLocaleDateString("tr-TR");
}

function _updateDetayHeader(h) {
  const bakiye = _pickBakiye(h);

  const el = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  el("detayHesapKodu", _pickHesapKodu(h) || "-");
  el("detayBankaAdi",  _pickBankaAdi(h)  || "-");
  el("detayHesapNo",   _pickHesapNo(h)   || "-");

  const bakiyeEl = document.getElementById("detayBakiye");
  if (bakiyeEl) {
    const prefix = bakiye >= 0 ? "+" : "";
    bakiyeEl.textContent = prefix + formatMoney(bakiye) + " TL";
    bakiyeEl.style.color = bakiye >= 0 ? "#10b981" : "#ef4444";
  }
}

async function _loadIslemKodlari() {
  const listEl = document.getElementById("islemKodlariList");
  if (!listEl) return;

  try {
    const kodlar = await bankaApi.getIslemKodlari() || [];
    if (!kodlar.length) { listEl.innerHTML = `<span style="font-size:11px;color:#64748b">—</span>`; return; }

    const gelir = kodlar.filter(k => (k.direction || k.yon || "").toUpperCase() === "IN");
    const gider = kodlar.filter(k => (k.direction || k.yon || "").toUpperCase() !== "IN");

    const _badge = (k, isIn) => {
      const kod  = k.kod || k.code || String(k);
      const acik = k.aciklama || k.description || k.name || k.label || "";
      const yon  = isIn ? "Giriş" : "Çıkış";
      const tip  = acik ? `${acik} · ${yon}` : yon;
      return `<span data-tooltip="${escapeHtml(tip)}" style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:4px;display:inline-block;
        background:${isIn ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)"};
        color:${isIn ? "#10b981" : "#ef4444"};
        border:1px solid ${isIn ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"}">
        ${escapeHtml(kod)}</span>`;
    };

    const _grup = (liste, isIn, etiket, renk) => {
      if (!liste.length) return "";
      return `
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:6px">
          <span style="font-size:10px;font-weight:700;color:${renk};text-transform:uppercase;letter-spacing:.5px;min-width:44px">${etiket}</span>
          ${liste.map(k => _badge(k, isIn)).join("")}
        </div>`;
    };

    listEl.innerHTML =
      _grup(gelir, true,  "Gelir", "#10b981") +
      _grup(gider, false, "Gider", "#ef4444");

  } catch (e) {
    listEl.innerHTML = `<span style="font-size:11px;color:#64748b">Yüklenemedi</span>`;
  }
}

async function _loadIslemler(page = 0, append = false) {
  const tbody   = document.getElementById("bankaIslemlerBody");
  const btnDaha = document.getElementById("btnDahaFazla");
  if (!tbody) return;

  if (!append) {
    _bankaAllIslemler = [];
    _bankaSelectedIslemIds.clear();
    _updateSeciliIslemButton();
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:30px">Yükleniyor...</td></tr>`;
  }

  try {
    const result = await bankaApi.getIslemler(_bankaHesapId, page);

    const islemler   = result?.content || result?.islemler || (Array.isArray(result) ? result : []);
    const totalPages = result?.totalPages ?? (islemler.length < 50 ? page + 1 : page + 2);

    _bankaCurrentPage = page;
    _bankaTotalPages  = totalPages;

    if (islemler.length) console.log("[BankaIslemler] İlk kayıt örneği:", islemler[0]);

    _bankaAllIslemler = append ? [..._bankaAllIslemler, ...islemler] : [...islemler];

    _renderIslemlerFiltreli();

    if (btnDaha) {
      btnDaha.style.display = (_bankaCurrentPage + 1 < _bankaTotalPages) ? "inline-flex" : "none";
    }
  } catch (e) {
    const errMsg = e?.message || "Bilinmeyen hata";
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:#ef4444;padding:30px">
      Hareketler yüklenemedi<br><span style="font-size:11px;color:#64748b;margin-top:4px;display:block">${escapeHtml(errMsg)}</span>
    </td></tr>`;
    showToast("Hareketler alınamadı: " + errMsg, "error");
    if (btnDaha) btnDaha.style.display = "none";
  }
}

function _tarihToDate(val) {
  if (!val) return null;
  const s = String(val);
  const dmy = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`);
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

function _toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function _renderIslemlerFiltreli() {
  const tbody      = document.getElementById("bankaIslemlerBody");
  const sayi       = document.getElementById("bankaIslemSayisi");
  const bilgi      = document.getElementById("filtreAktifBilgi");
  const bilgiSayi  = document.getElementById("filtreAktifSayi");
  if (!tbody) return;

  const yon       = (document.getElementById("filtreYon")?.value || "").toUpperCase();
  const baslangic = document.getElementById("filtreTarihBaslangic")?.value || "";
  const bitis     = document.getElementById("filtreTarihBitis")?.value || "";
  const filtreAktif = yon || baslangic || bitis;

  const filtreli = _bankaAllIslemler.filter(t => {
    const isIn = (t.direction || t.yon || t.type || "").toUpperCase() === "IN";
    if (yon === "IN"  && !isIn) return false;
    if (yon === "OUT" && isIn)  return false;

    if (baslangic || bitis) {
      const rawTarih = t.tarih ?? t.date ?? t.transactionDate ?? t.islemTarihi
        ?? t.dateTime ?? t.createdAt ?? t.islem_tarihi ?? t.transaction_date ?? null;
      const tD = _tarihToDate(rawTarih);
      if (!tD) return false;
      const tStr = _toISODate(tD);
      if (baslangic && tStr < baslangic) return false;
      if (bitis     && tStr > bitis)     return false;
    }

    return true;
  });

  tbody.innerHTML = "";

  if (!filtreli.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:30px">
      ${filtreAktif ? "Filtre kriterlerine uygun hareket bulunamadı" : "Hareket bulunamadı"}
    </td></tr>`;
  } else {
    filtreli.forEach(t => {
      const rowId = _pickIslemId(t);
      const isIn      = (t.direction || t.yon || t.type || "").toUpperCase() === "IN";
      const tutar     = Number(t.tutar ?? t.amount ?? 0);
      const tutarStr  = (isIn ? "+" : "-") + formatMoney(Math.abs(tutar)) + " TL";
      const tutarRenk = isIn ? "#10b981" : "#ef4444";

      const rawTarih = t.tarih ?? t.date ?? t.transactionDate ?? t.islemTarihi
        ?? t.dateTime ?? t.createdAt ?? t.islem_tarihi ?? t.transaction_date ?? null;
      const tarih = _parseTarih(rawTarih);

      const yonBadge = isIn
        ? `<span class="badge badge-success" style="font-size:10px">Giriş</span>`
        : `<span class="badge badge-danger"  style="font-size:10px">Çıkış</span>`;

      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td class="text-center" style="vertical-align:middle">
            ${rowId ? `<input type="checkbox" class="banka-islem-sec" value="${escapeHtml(rowId)}" ${_bankaSelectedIslemIds.has(String(rowId)) ? "checked" : ""}>` : ""}
          </td>
          <td style="white-space:nowrap;font-size:12px">${escapeHtml(tarih)}</td>
          <td style="font-size:12px">${escapeHtml(t.aciklama || t.description || "-")}</td>
          <td style="font-size:11px">
            <span style="
              font-weight:600;padding:2px 7px;border-radius:4px;
              background:${isIn ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)"};
              color:${tutarRenk}
            ">${escapeHtml(t.islemKodu || t.kod || t.code || "-")}</span>
          </td>
          <td class="text-end" style="font-weight:700;color:${tutarRenk};white-space:nowrap">${tutarStr}</td>
          <td class="text-center">${yonBadge}</td>
        </tr>`);
    });
  }

  if (sayi) {
    sayi.textContent = filtreAktif
      ? `${filtreli.length} / ${_bankaAllIslemler.length} hareket`
      : `${_bankaAllIslemler.length} hareket`;
  }

  if (bilgi) {
    if (filtreAktif) {
      bilgi.style.display = "flex";
      if (bilgiSayi) bilgiSayi.textContent = `${filtreli.length} / ${_bankaAllIslemler.length}`;
    } else {
      bilgi.style.display = "none";
    }
  }

  _syncTumunuSecCheckbox(filtreli);
  _updateSeciliIslemButton();
}

function _pickIslemId(t) {
  const id = t.id ?? t.islemId ?? t.transactionId ?? t.bankaIslemId ?? t.uuid ?? null;
  return id === null || id === undefined || id === "" ? "" : String(id);
}

function _visibleIslemIds() {
  return Array.from(document.querySelectorAll(".banka-islem-sec")).map(el => String(el.value)).filter(Boolean);
}

function _syncTumunuSecCheckbox(filtreli = null) {
  const allEl = document.getElementById("bankaIslemTumunuSec");
  if (!allEl) return;
  const ids = Array.isArray(filtreli) ? filtreli.map(_pickIslemId).filter(Boolean) : _visibleIslemIds();
  const selectedCount = ids.filter(id => _bankaSelectedIslemIds.has(String(id))).length;
  allEl.checked = ids.length > 0 && selectedCount === ids.length;
  allEl.indeterminate = selectedCount > 0 && selectedCount < ids.length;
}

function _updateSeciliIslemButton() {
  const btn = document.getElementById("btnIslemleriTemizle");
  if (!btn) return;
  const count = _bankaSelectedIslemIds.size;
  btn.disabled = count === 0;
  btn.innerHTML = count > 0
    ? `<i class="zmdi zmdi-delete"></i> Seçilen İşlemleri Temizle (${count})`
    : '<i class="zmdi zmdi-delete"></i> Seçilen İşlemleri Temizle';
}

function _bindDetayEvents() {
  const btnExcel        = document.getElementById("btnExcelYukle");
  const btnTemizle      = document.getElementById("btnIslemleriTemizle");
  const fileInput       = document.getElementById("excelFileInput");
  const btnDaha         = document.getElementById("btnDahaFazla");
  const btnFiltrele     = document.getElementById("btnFiltrele");
  const btnFiltreTemizle = document.getElementById("btnFiltreTemizle");
  const tumunuSec       = document.getElementById("bankaIslemTumunuSec");

  if (btnFiltrele) {
    btnFiltrele.addEventListener("click", _renderIslemlerFiltreli);
  }

  if (btnFiltreTemizle) {
    btnFiltreTemizle.addEventListener("click", () => {
      const yon = document.getElementById("filtreYon");
      const bas = document.getElementById("filtreTarihBaslangic");
      const bit = document.getElementById("filtreTarihBitis");
      if (yon) yon.value = "";
      if (bas) bas.value = "";
      if (bit) bit.value = "";
      _renderIslemlerFiltreli();
    });
  }

  if (btnTemizle) {
    btnTemizle.addEventListener("click", () => {
      const selectedIds = Array.from(_bankaSelectedIslemIds);
      if (!selectedIds.length) {
        showToast("Temizlemek için en az bir işlem seçiniz", "error");
        return;
      }

      showConfirmToast(`${selectedIds.length} banka hareketi silinsin mi?`, async () => {
        const originalHtml = btnTemizle.innerHTML;
        btnTemizle.disabled = true;
        btnTemizle.innerHTML = '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i> Temizleniyor...';

        try {
          await Promise.all(selectedIds.map(id => bankaApi.deleteIslem(_bankaHesapId, id)));
          showToast(`${selectedIds.length} işlem temizlendi`, "success");
          _bankaSelectedIslemIds.clear();
          await _loadDetayBilgi();
          await _loadIslemler(0, false);
        } catch (e) {
          const msg = e?.message || "Seçilen işlemler temizlenemedi";
          showToast(msg, "error");
          console.error("[BankaIslemlerTemizle] Hata:", msg);
        } finally {
          btnTemizle.disabled = false;
          btnTemizle.innerHTML = originalHtml;
          _updateSeciliIslemButton();
        }
      });
    });
  }

  if (tumunuSec) {
    tumunuSec.addEventListener("change", function () {
      _visibleIslemIds().forEach(id => {
        if (this.checked) _bankaSelectedIslemIds.add(String(id));
        else _bankaSelectedIslemIds.delete(String(id));
      });
      document.querySelectorAll(".banka-islem-sec").forEach(el => { el.checked = this.checked; });
      this.indeterminate = false;
      _updateSeciliIslemButton();
    });
  }

  document.addEventListener("change", function (e) {
    const checkbox = e.target.closest?.(".banka-islem-sec");
    if (!checkbox) return;
    const id = String(checkbox.value || "");
    if (!id) return;
    if (checkbox.checked) _bankaSelectedIslemIds.add(id);
    else _bankaSelectedIslemIds.delete(id);
    _syncTumunuSecCheckbox();
    _updateSeciliIslemButton();
  });

  if (btnExcel && fileInput) {
    btnExcel.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async function () {
      const file = this.files[0];
      if (!file) return;

      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
        showToast("Excel dosyası .xlsx veya .xls formatında olmalıdır. Kolon sırası: A=Tarih, B=Açıklama, C=Tutar, D=İşlem Kodu.", "error");
        this.value = "";
        return;
      }

      btnExcel.disabled = true;
      btnExcel.innerHTML = '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i> Yükleniyor...';

      try {
        await bankaApi.excelYukle(_bankaHesapId, file);
        showToast("Excel başarıyla yüklendi", "success");
        this.value = "";
        await _loadDetayBilgi();
        await _loadIslemler(0, false);
      } catch (e) {
        const msg = e?.message || "Excel yüklenemedi";
        showToast(msg, "error");
        console.error("[ExcelYukle] Hata:", msg);
      } finally {
        btnExcel.disabled = false;
        btnExcel.innerHTML = '<i class="zmdi zmdi-upload"></i> Excel Yükle';
      }
    });
  }

  if (btnDaha) {
    btnDaha.addEventListener("click", () => {
      _loadIslemler(_bankaCurrentPage + 1, true);
    });
  }
}

// ── İŞLEM KODLARI YÖNETİM PANELİ ────────────────────────

const _HAZIR_KODLAR = [
  { kod: "309.01.001", aciklama: "6796 NOLU HALK KK (3818)", direction: "OUT" },
  { kod: "309.01.002", aciklama: "1152 NOLU GB KK",          direction: "OUT" },
  { kod: "309.01.003", aciklama: "9134 NOLU GB KK",          direction: "OUT" },
  { kod: "309.02.003", aciklama: "4017 NOLU GB KK",          direction: "OUT" },
  { kod: "309.03.001", aciklama: "9048 NOLU İŞ KK",          direction: "OUT" },
  { kod: "309.03.002", aciklama: "4291 NOLU İŞ KK",          direction: "OUT" },
  { kod: "309.03.003", aciklama: "6760 NOLU İŞ KK",          direction: "OUT" },
  { kod: "309.04.003", aciklama: "4730 NOLU TEB KK",         direction: "OUT" },
  { kod: "309.05.001", aciklama: "5547 NOLU YKB K.K",        direction: "OUT" },
  { kod: "309.05.002", aciklama: "6753 NOLU YKB K.K",        direction: "OUT" },
  { kod: "309.05.003", aciklama: "5858 NOLU ZİRAAT KK",      direction: "OUT" },
  { kod: "309.06.004", aciklama: "8780 NOLU ZİRAAT KK",      direction: "OUT" },
];

async function _renderIslemKodlariAdmin() {
  const listEl = document.getElementById("islemKodlariAdminList");
  if (!listEl) return;

  listEl.innerHTML = `<span style="font-size:11px;color:#64748b">Yükleniyor...</span>`;

  try {
    const kodlar = await bankaApi.getIslemKodlari() || [];
    if (!kodlar.length) {
      listEl.innerHTML = `<span style="font-size:11px;color:#64748b">Henüz kod eklenmemiş.</span>`;
      return;
    }

    listEl.innerHTML = kodlar.map(k => {
      const kod   = k.kod || k.code || String(k);
      const acik  = k.aciklama || k.description || k.name || "";
      const isIn  = (k.direction || k.yon || "").toUpperCase() === "IN";
      const renk  = isIn ? "#10b981" : "#ef4444";
      const bg    = isIn ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)";
      const border = isIn ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)";
      return `
        <div style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:5px;
             background:${bg};border:1px solid ${border};font-size:12px">
          <span style="font-weight:700;color:${renk}">${escapeHtml(kod)}</span>
          ${acik ? `<span style="color:#94a3b8">${escapeHtml(acik)}</span>` : ""}
          ${k.id ? `<button onclick="window._islemKoduSil(${k.id})" style="background:none;border:none;cursor:pointer;color:#64748b;padding:0 0 0 4px;font-size:14px;line-height:1" title="Sil">×</button>` : ""}
        </div>`;
    }).join("");
  } catch {
    listEl.innerHTML = `<span style="font-size:11px;color:#ef4444">Yüklenemedi</span>`;
  }
}

function _bindIslemKodlariPanel() {
  const toggleBtn = document.getElementById("btnIslemKodlariToggle");
  const body      = document.getElementById("islemKodlariBody");
  const kaydetBtn = document.getElementById("btnIslemKoduKaydet");
  const hazirBtn  = document.getElementById("btnHazirKodlariEkle");

  if (toggleBtn && body) {
    toggleBtn.addEventListener("click", () => {
      const open = body.style.display !== "none";
      body.style.display = open ? "none" : "";
      if (!open) _renderIslemKodlariAdmin();
    });
  }

  if (kaydetBtn) {
    kaydetBtn.addEventListener("click", async () => {
      const kod     = document.getElementById("yeniKodKod")?.value.trim();
      const aciklama = document.getElementById("yeniKodAciklama")?.value.trim();
      const direction = document.getElementById("yeniKodYon")?.value || "OUT";

      if (!kod) { showToast("İşlem kodu zorunludur", "error"); return; }

      kaydetBtn.disabled = true;
      try {
        await bankaApi.createIslemKodu({ kod, aciklama, direction });
        showToast("Kod eklendi", "success");
        document.getElementById("yeniKodKod").value      = "";
        document.getElementById("yeniKodAciklama").value = "";
        await _renderIslemKodlariAdmin();
      } catch (e) {
        showToast(e.message || "Kod eklenemedi", "error");
      } finally {
        kaydetBtn.disabled = false;
      }
    });
  }

  if (hazirBtn) {
    hazirBtn.addEventListener("click", async () => {
      hazirBtn.disabled = true;
      hazirBtn.innerHTML = '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i> Ekleniyor...';
      let basari = 0, hata = 0;
      for (const k of _HAZIR_KODLAR) {
        try {
          await bankaApi.createIslemKodu(k);
          basari++;
        } catch {
          hata++;
        }
      }
      showToast(`${basari} kod eklendi${hata ? `, ${hata} hata` : ""}`, hata ? "warning" : "success");
      await _renderIslemKodlariAdmin();
      hazirBtn.disabled = false;
      hazirBtn.innerHTML = '<i class="zmdi zmdi-playlist-plus"></i> 309.xx Kodlarını Toplu Ekle';
    });
  }
}

window._islemKoduSil = async function(id) {
  try {
    await bankaApi.deleteIslemKodu(id);
    showToast("Kod silindi", "success");
    await _renderIslemKodlariAdmin();
  } catch (e) {
    showToast(e.message || "Kod silinemedi", "error");
  }
};

// ── GLOBAL EXPORT ────────────────────────────────────────
window.initBankaHesaplari = initBankaHesaplari;
window.initBankaDetay     = initBankaDetay;
