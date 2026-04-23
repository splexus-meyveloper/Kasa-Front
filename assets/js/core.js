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

document
  .getElementById("dynamicModalConfirm")
  .addEventListener("click", function () {
    if (dynamicModalCallback) {
      dynamicModalCallback();
    }
  });

// ==============================
// BANK LABELS (tek kaynak — tüm modüller buradan okur)
// ==============================
var BANK_LABELS = {
  ZIRAAT:         "Ziraat",
  IS_BANKASI:     "İş Bankası",
  GARANTI_BBVA:   "Garanti BBVA",
  AKBANK:         "Akbank",
  YAPI_KREDI:     "Yapı Kredi",
  HALKBANK:       "Halkbank",
  VAKIFBANK:      "Vakıfbank",
  QNB_FINANSBANK: "QNB Finansbank",
  DENIZBANK:      "Denizbank",
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