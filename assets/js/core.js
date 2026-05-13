// ==============================
// CORE UI HELPERS
// ==============================

// ==============================
// TOAST
// ==============================
function showToast(message, type = "success") {
  const box = document.getElementById("toastBox");
  if (!box) return;

  const t = document.createElement("div");
  t.className = "toast " + type;

  let icon = "✔";
  if (type === "error") icon = "✖";
  if (type === "info") icon = "ℹ";

  const iconSpan = document.createElement("span");
  iconSpan.textContent = icon;
  t.appendChild(iconSpan);
  t.appendChild(document.createTextNode(" " + message));
  box.appendChild(t);

  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(20px)";
    setTimeout(() => t.remove(), 300);
  }, 2500);
}


// ==============================
// CONFIRM TOAST
// ==============================
function showConfirmToast(message, onConfirm) {
  const box = document.getElementById("toastBox");
  if (!box) return;

  const toast = document.createElement("div");
  toast.className = "toast warning";

  toast.innerHTML = `
    ${message}
    <div style="margin-top:8px">
      <button id="yesBtn">Evet</button>
      <button id="noBtn">Hayır</button>
    </div>
  `;

  box.appendChild(toast);

  toast.querySelector("#yesBtn").onclick = () => {
    try {
      onConfirm && onConfirm();
    } catch (e) {
      console.error("Confirm error:", e);
    }
    toast.remove();
  };

  toast.querySelector("#noBtn").onclick = () => toast.remove();

  setTimeout(() => toast.remove(), 7000);
}


// ==============================
// AUTH
// ==============================
function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}


// ==============================
// FORMAT
// ==============================
function formatMoney(value) {
  return Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDateTime(val) {
  if (!val) return "-";
  // Java LocalDateTime dizi: [year, month(1-based), day, hour, min, sec, nano?]
  if (Array.isArray(val)) {
    const [y, mo, d, h = 0, mi = 0] = val;
    return `${String(d).padStart(2,"0")}.${String(mo).padStart(2,"0")}.${y} ${String(h).padStart(2,"0")}:${String(mi).padStart(2,"0")}`;
  }
  // "dd-MM-yyyy HH:mm:ss" formatı — direkt string olarak göster
  if (typeof val === "string" && /^\d{2}-\d{2}-\d{4}/.test(val)) {
    return val.substring(0, 16);
  }
  // ISO veya diğer string/number
  try {
    const d = new Date(typeof val === "string" ? val.replace(" ", "T") : val);
    if (isNaN(d)) return String(val);
    return d.toLocaleDateString("tr-TR") + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(val);
  }
}


// ==============================
// ANIMATION
// ==============================
function animateValue(el, endValue) {
  if (!el) return;

  const duration = 800;
  const startTime = performance.now();
  const safeEnd = Number(endValue || 0);

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);

    const value = progress * safeEnd;

    el.innerText = value.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " TL";

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}


// ==============================
// SUBMIT BUTTON GUARD
// ==============================

/**
 * Butonu disabled yaparak verilen async işlevi çalıştırır.
 * İşlev başarıyla tamamlanırsa buton disabled kalır (modal kapanır / liste yenilenir).
 * Hata oluşursa butonu eski haline getirir.
 * 409 → çift gönderim mesajı, 400 bekleyen talep mesajı otomatik gösterilir.
 */
async function withLoadingBtn(btn, asyncFn) {
    if (!btn || btn.disabled) return;
    const originalHTML = btn.innerHTML;
    const originalWidth = btn.offsetWidth;
    btn.disabled = true;
    btn.style.minWidth = originalWidth + "px";
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px">'
        + '<svg style="animation:spin .8s linear infinite;width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>'
        + 'İşleniyor...</span>';

    const _restore = () => {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        btn.style.minWidth = "";
    };

    try {
        await asyncFn();
        _restore();
    } catch (err) {
        _restore();
        const status = err?.status || err?.statusCode;
        if (status === 409) {
            showToast("Bu işlem zaten gönderildi, lütfen sonucu bekleyin.", "error");
        } else if (status === 400 && (err?.message || "").includes("bekleyen")) {
            showToast("Bu kayıt için bekleyen bir düzenleme talebi zaten var.", "error");
        } else {
            throw err;
        }
    }
}

// CSS spin keyframe (sadece 1 kez enjekte edilir)
(function () {
    if (document.getElementById("__spin_kf")) return;
    const s = document.createElement("style");
    s.id = "__spin_kf";
    s.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(s);
})();

// ==============================
// PROGRESS BAR
// ==============================
function setAutoBar(barId, value, maxValue) {
  const el = document.getElementById(barId);
  if (!el) return;

  let percent = 0;
  if (maxValue > 0) {
    percent = (Number(value || 0) / maxValue) * 100;
  }

  if (percent > 100) percent = 100;

  el.style.width = percent + "%";

  if (percent < 50) {
    el.style.background = "linear-gradient(90deg,#00C853,#69F0AE)";
  } else if (percent < 80) {
    el.style.background = "linear-gradient(90deg,#FFC107,#FFD54F)";
  } else {
    el.style.background = "linear-gradient(90deg,#FF1744,#FF8A80)";
  }
}

// ==============================
// Page Permission
// ==============================
function checkPagePermission() {
  const perms = getPermissions().map((p) => p.toUpperCase());
  const path = (location.pathname || "").toUpperCase();

  const deny = (perm) => {
    if (!perms.includes(perm)) window.location.href = "layout.html";
  };

  if (path.includes("KREDI")) deny("KREDILER");
  if (path.includes("KASA")) deny("KASA");
  if (path.includes("CEK")) deny("CEK");
  if (path.includes("SENET")) deny("SENET");
  if (path.includes("MASRAF")) deny("MASRAF");
  if (path.includes("KULLANICI")) deny("KULLANICI_YONETIMI");
}

function formatMoneyInput(input) {
  let val = input.value.replace(/[^0-9,]/g, "");
  const parts = val.split(",");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (parts.length > 2) parts.splice(2);
  input.value = parts.join(",");
}

function parseMoney(val) {
  if (!val) return 0;

  return Number(
    val
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );
}

// ==============================
// XSS GUARD
// ==============================
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let dynamicModalCallback = null;

function openDynamicModal({
  title,
  subtitle = "",
  icon = "zmdi-info-outline",
  content,
  onConfirm
}) {

  document.getElementById("dynamicModalTitle").innerText = title;
  document.getElementById("dynamicModalSubtitle").innerText = subtitle;

  document.getElementById("dynamicModalIcon").innerHTML =
    `<i class="zmdi ${icon}"></i>`;

  document.getElementById("dynamicModalBody").innerHTML = content;

  dynamicModalCallback = onConfirm;

  document.getElementById("dynamicModal").classList.add("active");
}

function closeDynamicModal() {
  document.getElementById("dynamicModal").classList.remove("active");
  dynamicModalCallback = null;
}

const _dmConfirmBtn = document.getElementById("dynamicModalSubmitBtn");
if (_dmConfirmBtn) {
  _dmConfirmBtn.addEventListener("click", function () {
    if (dynamicModalCallback) {
      dynamicModalCallback();
    }
  });
}

// ==============================
// BANK LABELS (tek kaynak — tüm modüller buradan okur)
// ==============================
var BANK_LABELS = {
  ZIRAAT:         "Ziraat Bankası",
  IS_BANKASI:     "İş Bankası",
  GARANTI_BBVA:   "Garanti BBVA",
  AKBANK:         "Akbank",
  YAPI_KREDI:     "Yapı Kredi",
  HALKBANK:       "Halkbank",
  VAKIFBANK:      "VakıfBank",
  QNB_FINANSBANK: "QNB Finansbank",
  DENIZBANK:      "DenizBank",
  TEB:            "TEB",
  DIGER:          "Diğer",
};

// ==============================
// GLOBAL EXPORT
// ==============================
window.escapeHtml = escapeHtml;
window.showToast = showToast;
window.showConfirmToast = showConfirmToast;
window.animateValue = animateValue;
window.setAutoBar = setAutoBar;
window.formatMoney = formatMoney;
window.logout = logout;
window.checkPagePermission = checkPagePermission;
window.parseMoney = parseMoney;
window.formatMoneyInput = formatMoneyInput;