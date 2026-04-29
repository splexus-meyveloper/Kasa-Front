// ==============================
// BANKA UI MODULE
// ==============================

// ── HESAPLAR SAYFASI ─────────────────────────────────────

async function initBankaHesaplari() {
  await _renderHesaplar();
  _bindHesaplarEvents();
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

    listEl.innerHTML = kodlar.map(k => {
      const isIn  = (k.direction || k.yon || "").toUpperCase() === "IN" ||
                    (k.type      || k.tip  || "").toUpperCase() === "IN";
      const renk  = isIn ? "#10b981" : "#ef4444";
      const kod   = k.kod || k.code || String(k);
      const acik  = k.aciklama || k.description || k.name || k.label || "";
      const yon   = isIn ? "Giriş" : "Çıkış";
      const tipet = acik ? `${escapeHtml(acik)} · ${yon}` : yon;

      return `<span
        data-tooltip="${tipet}"
        style="
          font-size:11px;font-weight:600;padding:3px 10px;border-radius:4px;
          background:${isIn ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)"};
          color:${renk};border:1px solid ${isIn ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"};
          display:inline-block;
        "
      >${escapeHtml(kod)}</span>`;
    }).join("");
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:30px">Yükleniyor...</td></tr>`;
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:#ef4444;padding:30px">Hareketler yüklenemedi</td></tr>`;
    showToast("Hareketler alınamadı", "error");
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:30px">
      ${filtreAktif ? "Filtre kriterlerine uygun hareket bulunamadı" : "Hareket bulunamadı"}
    </td></tr>`;
  } else {
    filtreli.forEach(t => {
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
}

function _bindDetayEvents() {
  const btnExcel        = document.getElementById("btnExcelYukle");
  const fileInput       = document.getElementById("excelFileInput");
  const btnDaha         = document.getElementById("btnDahaFazla");
  const btnFiltrele     = document.getElementById("btnFiltrele");
  const btnFiltreTemizle = document.getElementById("btnFiltreTemizle");

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

  if (btnExcel && fileInput) {
    btnExcel.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async function () {
      const file = this.files[0];
      if (!file) return;

      btnExcel.disabled = true;
      btnExcel.innerHTML = '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i> Yükleniyor...';

      try {
        await bankaApi.excelYukle(_bankaHesapId, file);
        showToast("Excel başarıyla yüklendi", "success");
        this.value = "";
        await _loadDetayBilgi();
        await _loadIslemler(0, false);
      } catch (e) {
        showToast(e.message || "Excel yüklenemedi", "error");
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

// ── GLOBAL EXPORT ────────────────────────────────────────
window.initBankaHesaplari = initBankaHesaplari;
window.initBankaDetay     = initBankaDetay;
