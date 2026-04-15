let kasaChart = null;
// ==============================
// DASHBOARD
// ==============================
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
      animation: { duration: 800 },
      scales: {
        x: {
          grid: { color: "rgba(0, 0, 0, 0.28)", lineWidth: 1.2 },
          ticks: { color: "#0e0e0e", font: { weight: "bold" } }
        },
        y: {
          grid: { color: "rgba(0, 0, 0, 0.27)", lineWidth: 1.2 },
          ticks: { color: "#000000", font: { weight: "bold" } }
        }
      }
    }
  });
}

async function loadDashboard(selectedUserId = null) {
  const gi = document.getElementById("gunlukGiris");
  const gc = document.getElementById("gunlukCikis");
  const an = document.getElementById("aylikNet");
  const kb = document.getElementById("kasaBakiye");
  const krediBorc = document.getElementById("toplamKrediBorc");

  if (!gi || !gc || !an || !kb) return;

  try {
    // 🔥 loading efekti
    gi.innerText = "...";
    gc.innerText = "...";
    an.innerText = "...";
    kb.innerText = "...";
    if (krediBorc) krediBorc.innerText = "...";

    const d = await dashboardStore.fetchSummary(selectedUserId);

    if (!d) return;

    // 🔥 animasyonlu bas
    animateValue(gi, Number(d.todayIncome || 0));
    animateValue(gc, Number(d.todayExpense || 0));
    animateValue(an, Number(d.monthlyNet || 0));
    animateValue(kb, Number(d.balance || 0));

    if (krediBorc) {
      animateValue(krediBorc, Number(d.totalLoanDebt || 0));
    }

    // 🔥 progress bar
    setAutoBar("barGunlukGiris", d.todayIncome || 0, 500000);
    setAutoBar("barGunlukCikis", d.todayExpense || 0, 500000);
    setAutoBar("barBakiye", d.balance || 0, 500000);
    setAutoBar("barAylikGiris", d.monthlyNet || 0, 500000);
    setAutoBar("barKredi", d.totalLoanDebt || 0, 1000000);

  } catch (e) {
    console.error("Dashboard yüklenemedi:", e);

    gi.innerText = "0";
    gc.innerText = "0";
    an.innerText = "0";
    kb.innerText = "0";

    showToast("Dashboard yüklenemedi: " + e.message, "error");
  }
}

async function loadChart(selectedUserId = null) {
  const canvas = document.getElementById("chartjs-revenue-statistics-chart");
  if (!canvas) return;

  try {
    const d = await dashboardStore.fetchChart(selectedUserId);
    if (!d) return;

    loadKasaChart(
      (d.incomes || []).map(Number),
      (d.expenses || []).map(Number),
      d.labels || []
    );

  } catch (e) {
    console.error("Chart yüklenemedi:", e);
  }
}

function initDashboard(selectedUserId = null) {

  if (!authStore.isLoggedIn()) {
  window.location.href = "login.html";
  return;
}

  loadDashboard(selectedUserId);

  // chart varsa çalıştır
  const canvas = document.getElementById("chartjs-revenue-statistics-chart");
  if (canvas) {
    loadChart(selectedUserId);
  }
  
  loadCheckSummary();
  loadNotesDashboard();
  loadHeaderNotifications();

  // 🔥 TAKVİMİ GECİKMELİ ÇAĞIR
  setTimeout(() => {
    loadCalendar();
  }, 100);
}

window.loadDashboard = loadDashboard;
window.loadChart = loadChart;
window.initDashboard = initDashboard;