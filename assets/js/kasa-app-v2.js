let kasaChart = null;

/* ==============================
   GRAFİK
============================== */
function loadKasaChart(girisData, cikisData, labels) {
  const canvas = document.getElementById("chartjs-revenue-statistics-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  if (kasaChart) kasaChart.destroy();

  kasaChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
  label: "Kasa Giriş",
  data: girisData,
  borderColor: "#00C853",
  backgroundColor: "rgba(0,200,83,0.35)",
  borderWidth: 2,
  borderRadius: 6
},
{
  label: "Kasa Çıkış",
  data: cikisData,
  borderColor: "#FF1744",
  backgroundColor: "rgba(255,23,68,0.35)",
  borderWidth: 2,
  borderRadius: 6
}

      ]
    },
    options: {
  responsive: true,
  maintainAspectRatio: false,
  animation:{
    duration:800
  },

  scales: {
    x: {
      grid: {
        color: "rgba(255, 255, 255, 0.28)", // dikey çizgiler
        lineWidth: 1.2
      },
      ticks: {
        color: "#f8f8f8",
        font: { weight: "bold" }
      }
    },
    y: {
      grid: {
        color: "rgba(255, 255, 255, 0.27)", // yatay çizgiler
        lineWidth: 1.2
      },
      ticks: {
        color: "#ffffff",
        font: { weight: "bold" }
      }
    }
  }
}
  }
)
}

/* ==============================
   PROGRESS BAR
============================== */
function setAutoBar(barId, value, maxValue) {

  let percent = 0;
  if(maxValue > 0){
    percent = (value / maxValue) * 100;
  }
  if(percent > 100) percent = 100;

  const el = document.getElementById(barId);
  if(!el) return;

  el.style.width = percent + "%";

  // RENK MANTIĞI
  if(percent < 50){
    el.style.background = "linear-gradient(90deg,#00C853,#69F0AE)";
  }
  else if(percent < 80){
    el.style.background = "linear-gradient(90deg,#FFC107,#FFD54F)";
  }
  else{
    el.style.background = "linear-gradient(90deg,#FF1744,#FF8A80)";
  }
}


/* ==============================
   LOGOUT (GLOBAL)
============================== */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
window.logout = logout;

/* ==============================
   PERMISSIONS (JWT)
============================== */
function getPermissions() {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "[]");
  } catch {
    return [];
  }
}

function applyPermissionsFromToken() {
  const perms = getPermissions();

  // data-perm olan her şeyi kontrol et
  document.querySelectorAll("[data-perm]").forEach((el) => {
    const p = el.getAttribute("data-perm");
    if (p && !perms.includes(p)) {
      el.style.display = "none";
    }
  });
}

function checkPagePermission() {
  const perms = getPermissions().map(p => p.toUpperCase());
  const path = (location.pathname || "").toUpperCase();

  const deny = (perm) => {
    if (!perms.includes(perm)) {
      console.warn("PERMISSION DENIED:", perm, "USER PERMS:", perms);
      window.location.href = "layout.html";
    }
  };

  if (path.includes("KREDI")) deny("KREDILER");
  if (path.includes("KASA")) deny("KASA");
  if (path.includes("CEK")) deny("CEK");
  if (path.includes("SENET")) deny("SENET");
  if (path.includes("MASRAF")) deny("MASRAF");
  if (path.includes("KULLANICI")) deny("KULLANICI_YONETIMI");
}


/* ==============================
   MENU LOAD + UI
============================== */
function afterMenuLoaded() {
  const role = localStorage.getItem("role") || "";

  const adminOnly = document.getElementById("adminMenuOnly");
  if (adminOnly) adminOnly.style.display = role === "ADMIN" ? "block" : "none";

  applyPermissionsFromToken();

  // submenu click (jQuery varsa)
  if (window.$) {
    $(".side-header-menu")
      .find(".has-sub-menu > a")
      .off("click")
      .on("click", function (e) {
        e.preventDefault();
        const parent = $(this).parent();
        parent.toggleClass("open");
        parent.children(".side-header-sub-menu").slideToggle(300);
      });
  }
}

function loadMenu() {
  const menuContainer = document.getElementById("menuContainer");
  if (!menuContainer) return;

  fetch("menu.html")
    .then((r) => r.text())
    .then((html) => {
      menuContainer.innerHTML = html;
      afterMenuLoaded();
    })
    .catch((err) => console.error("MENU LOAD ERROR:", err));
}

/* ==============================
   DOM READY
============================== */
document.addEventListener("DOMContentLoaded", function () {
  // auth-guard.js zaten login kontrolünü yapıyor.
  // Burada sadece UI çalıştırıyoruz.
  loadMenu();

  const role = localStorage.getItem("role");

  const adminDashboard = document.getElementById("adminDashboard");
  const userWelcome = document.getElementById("userWelcome");

  if (role === "USER") {
    if (adminDashboard) adminDashboard.style.display = "none";
    if (userWelcome) userWelcome.style.display = "block";
  } else {
    if (adminDashboard) adminDashboard.style.display = "block";
    if (userWelcome) userWelcome.style.display = "none";
  }

  if (role === "ADMIN") {
    const gunlukGiris = 25000;
    const gunlukCikis = 18000;
    const aylikNet = 42000;
    const kasaBakiye = 185400;

    const maxGunlukGiris = 40000;
    const maxGunlukCikis = 30000;
    const maxAylikNet = 100000;
    const maxBakiye = 250000;

    setAutoBar("barGunlukGiris", gunlukGiris, maxGunlukGiris);
    setAutoBar("barGunlukCikis", gunlukCikis, maxGunlukCikis);
    setAutoBar("barAylikGiris", aylikNet, maxAylikNet);
    setAutoBar("barBakiye", kasaBakiye, maxBakiye);

    loadKasaChart(
      [12000, 15000, 8000, 22000, 17000, 9000, 14000],
      [5000, 7000, 4000, 12000, 9000, 3000, 6000],
      ["1", "2", "3", "4", "5", "6", "7"]
    );
  }

  checkPagePermission();
});

/* ==============================
   Logout click yakalama (onclick'siz de çalışsın)
============================== */
document.addEventListener(
  "click",
  function (e) {
    const a = e.target.closest('a[onclick*="logout"], a#logoutBtn, a[data-logout]');
    if (!a) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

    logout();
  },
  true
);

document.addEventListener("click", async function (e) {

    // KASA GİRİŞ
    if (e.target.id === "btnKasaGiris") {
        console.log("giriş tıklandı");

        let tutar = document.getElementById("tutar").value;
        let aciklama = document.getElementById("aciklama").value;

        tutar = tutar
    .replace(" ₺","")
    .replace(/\./g,"")
    .replace(",", ".");

const amount = parseFloat(tutar);

        if (!amount) {
            alert("Tutar giriniz");
            return;
        }

        const res = await fetch("http://localhost:8080/api/cash/income", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                amount,
                description: aciklama
            })
        });

        if (res.ok) {
  showToast("Kasa girişi kaydedildi", "success");

  setTimeout(() => {
    loadPage("index.html");

    // index DOM'a basılsın diye kısa bekleme
    setTimeout(() => {
      initDashboard();
    }, 300);

  }, 1200);

} else {
  showToast("Hata oluştu", "error");
}


    }
    

    // KASA ÇIKIŞ
    if (e.target.id === "btnKasaCikis") {
        console.log("çıkış tıklandı");

        let tutar = document.getElementById("tutar").value;
        let aciklama = document.getElementById("aciklama").value;

        tutar = tutar
            .replace(" TL", "")
            .replace(/\./g, "")
            .replace(",", ".");

        const amount = parseFloat(tutar);

        if (!amount) {
            alert("Tutar giriniz");
            return;
        }

        const res = await fetch("http://localhost:8080/api/cash/expense", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                amount,
                description: aciklama
            })
        });

        if (res.ok) {
  showToast("Kasa çıkışı kaydedildi", "success");

  setTimeout(() => {
    loadPage("index.html");
    setTimeout(() => initDashboard(), 300);
  }, 1200);

} else {
  showToast("Hata oluştu", "error");
}


    }

});


// DASHBORD VERİ
async function loadDashboard(){

    const gi = document.getElementById("gunlukGiris");
    const gc = document.getElementById("gunlukCikis");
    const an = document.getElementById("aylikNet");
    const kb = document.getElementById("kasaBakiye");

    // Eğer index sayfasında değilsek çık
    if(!gi || !gc || !an || !kb){
        return;
    }

    const res = await fetch(
        "http://localhost:8080/api/dashboard",
        {
            headers:{
                "Authorization":
                "Bearer " + localStorage.getItem("token")
            }
        });

    if(!res.ok) return;

    const d = await res.json();

    const fmt = n =>
        Number(n).toLocaleString("tr-TR",{minimumFractionDigits:2})+" TL";

    animateValue(gi, Number(d.todayIncome));
animateValue(gc, Number(d.todayExpense));
animateValue(an, Number(d.monthlyNet));
animateValue(kb, Number(d.balance));


// ===== PROGRESS BAR DOLUM =====
setAutoBar("barGunlukGiris", d.todayIncome, 500000);
setAutoBar("barGunlukCikis", d.todayExpense, 500000);
setAutoBar("barBakiye", d.balance, 500000);
setAutoBar("barAylikGiris", d.monthlyNet, 500000);

}

async function loadChart(){

  const canvas =
    document.getElementById("chartjs-revenue-statistics-chart");

  if(!canvas) return;

  const res = await fetch(
    "http://localhost:8080/api/dashboard/chart",
    {
      headers:{
        "Authorization":
        "Bearer " + localStorage.getItem("token")
      }
    });

  if(!res.ok) return;

  const d = await res.json();

  loadKasaChart(
    d.incomes.map(Number),
    d.expenses.map(Number),
    d.labels
  );
}


let dashboardLoaded = false;

function initDashboardIfPresent(){

    if(document.getElementById("chartjs-revenue-statistics-chart")){
        console.log("Dashboard reload");

        loadDashboard();
        loadChart();
    }
}

function tryInitDashboard(){

    const canvas =
        document.getElementById("chartjs-revenue-statistics-chart");

    if(!canvas) return;

    console.log("Dashboard tek sefer yükleniyor");

    loadDashboard();
    loadChart();
}

// pageContent değişince kontrol et
const pageContent =
    document.getElementById("pageContent");

if(pageContent){
    new MutationObserver(()=>{
        tryInitDashboard();
    }).observe(pageContent,{
        childList:true
    });
}

function initDashboard(){

    const canvas =
        document.getElementById("chartjs-revenue-statistics-chart");

    if(!canvas) return;

    console.log("Dashboard init çalıştı");

    loadDashboard();
    loadChart();
}

function animateValue(el, endValue){

  const duration = 800; // ms
  const start = 0;
  const startTime = performance.now();

  function update(now){
    const progress = Math.min((now - startTime)/duration, 1);
    const value = Math.floor(progress * endValue);

    el.innerText =
      value.toLocaleString("tr-TR",
      {minimumFractionDigits:2}) + " TL";

    if(progress < 1){
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function showToast(message,type="success"){

  const box = document.getElementById("toastBox");
  if(!box) return;

  const t = document.createElement("div");
  t.className = "toast " + type;

  // İkon seçimi
  let icon = "✔";
  if(type==="error") icon="✖";
  if(type==="info") icon="ℹ";

  t.innerHTML = `<span>${icon}</span> ${message}`;

  box.appendChild(t);

  setTimeout(()=>{
    t.style.opacity="0";
    t.style.transform="translateY(20px)";
    setTimeout(()=>t.remove(),300);
  },2500);
}

// TUTAR INPUT MASK (TL + binlik)
const tutarInputMask = (input)=>{

    input.addEventListener("input", function(){

        let cursor = this.selectionStart;

        let raw = this.value;

        // TL ve boşluk temizle
        raw = raw.replace(" TL","");

        // Sadece sayı
        raw = raw.replace(/\D/g,'');

        if(raw === ""){
            this.value="";
            return;
        }

        // Kuruş ekle (son 2 hane)
        let num = (parseInt(raw)/100);

        let formatted = num.toLocaleString("tr-TR",{
            minimumFractionDigits:2,
            maximumFractionDigits:2
        });

        this.value = formatted + " TL";

        // cursor'ı sona sabitle
        this.setSelectionRange(
            this.value.length-3,
            this.value.length-3
        );
    });
};


// Layout sistemi için delegation
document.body.addEventListener("focusin", function(e){

    if(e.target.id === "tutar" && !e.target.dataset.masked){
        tutarInputMask(e.target);
        e.target.dataset.masked = "true";
    }

});

function showConfirmToast(message, onConfirm){

    const box = document.getElementById("toastBox");

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

    toast.querySelector("#yesBtn").onclick = ()=>{
        onConfirm();
        toast.remove();
    };

    toast.querySelector("#noBtn").onclick = ()=>{
        toast.remove();
    };

    setTimeout(()=>toast.remove(),7000);
}


document.addEventListener("DOMContentLoaded", () => {

    const username = localStorage.getItem("username");

if(username){
    const name =
        username.charAt(0).toUpperCase() +
        username.slice(1).toLowerCase();

    document.getElementById("welcomeText").innerText =
        "Hoş Geldin " + name;
}


});








