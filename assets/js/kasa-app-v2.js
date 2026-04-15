// ==============================
// PAGE LOADER (LAYOUT SYSTEM)
// ==============================
function loadPage(page){

  window.currentPage = page;
  localStorage.setItem('lastPage', page);

  const container = document.getElementById("pageContent");
  if(!container) return;

  fetch(page)
    .then(r => r.text())
    .then(html => {

      container.innerHTML = html;
      applyPermissionsFromToken();
if(page.includes("kullanicilar")){
  

    setTimeout(() => {
        console.log("SAFE LOAD USERS ÇAĞRILDI");
        loadUsersSafe();
    }, 300);

    return;
}
      // 🔥 sadece diğer sayfalarda çalışsın
      setTimeout(() => {
  runPageInitializers();
}, 100);

    })
    .catch(err => {
      console.error("Page load error:", err);
    });

}

window.loadPage = loadPage;

const bankMap = {
  ZIRAAT: "Ziraat Bankası",
  IS_BANKASI: "İş Bankası",
  GARANTI_BBVA: "Garanti BBVA",
  AKBANK: "Akbank",
  YAPI_KREDI: "Yapı Kredi",
  HALKBANK: "Halkbank",
  VAKIFBANK: "VakıfBank",
  QNB_FINANSBANK: "QNB Finansbank",
  DENIZBANK: "DenizBank",
  TEB: "TEB",
  DIGER: "Diğer"
};

function formatBank(bank) {
  return bankMap[bank] || bank;
}

function getAuthHeaders(json = false) {
  const headers = {
    Authorization: "Bearer " + localStorage.getItem("token")
  };

  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function getDueStatus(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { class: "due-over", text: "Vadesi Geçti" };
  if (diffDays === 0) return { class: "due-today", text: "Bugün" };
  if (diffDays <= 3) return { class: "due-critical", text: `${diffDays} gün kaldı` };
  if (diffDays <= 7) return { class: "due-warning", text: `${diffDays} gün kaldı` };

  return null;
}

function getDueColor(dueDate) {

  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0,0,0,0);
  due.setHours(0,0,0,0);

  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "#b91c1c";   // geçmiş → koyu kırmızı
  if (diff <= 1) return "#ef4444";  // 1 gün → kırmızı
  if (diff <= 3) return "#f97316";  // 3 gün → turuncu
  if (diff <= 5) return "#facc15";  // 5 gün → sarı

  return "#3b82f6"; // 🔥 default mavi
}


// ==============================
// AUTH / PERMISSIONS
// ==============================
function getPermissions() {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "[]");
  } catch {
    return [];
  }
}

function applyPermissionsFromToken() {
  const perms = getPermissions();
  document.querySelectorAll("[data-perm]").forEach((el) => {
    const p = el.getAttribute("data-perm");
    if (p && !perms.includes(p)) el.style.display = "none";
  });
}

// ==============================
// MONEY MASK
// ==============================

document.addEventListener("focusin", function (e) {

    if (e.target.classList.contains("money-input")) {

        const input = e.target;

        if(input.dataset.masked === "true") return;

        input.addEventListener("input", function () {

            let raw = this.value
                .replace(/[^\d,]/g, "")   // sayı + virgül

            // 🔥 virgül kontrol (sadece 1 tane)
            const parts = raw.split(",");
            if(parts.length > 2){
                raw = parts[0] + "," + parts[1];
            }

            // 🔥 format
            let [int, dec] = raw.split(",");

            int = int.replace(/\D/g, "");
            int = Number(int || 0).toLocaleString("tr-TR");

            if(dec !== undefined){
                dec = dec.slice(0,2); // max 2 basamak
                this.value = int + "," + dec;
            } else {
                this.value = int;
            }

        });

        input.dataset.masked = "true";
    }

});
