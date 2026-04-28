// ==============================
// DASHBOARD UI
// ==============================

let kasaChart     = null;
let portfolioChart = null;

// ── helpers ──────────────────────────────────────────────
function _isDark() { return document.body.classList.contains("dark-mode"); }

function _gridColor()  { return _isDark() ? "rgba(255,255,255,.07)" : "rgba(30,41,59,.07)"; }
function _tickColor()  { return _isDark() ? "#94a3b8"               : "#64748b"; }
function _textColor()  { return _isDark() ? "#e2e8f0"               : "#1e293b"; }

function _gradient(ctx, color1, color2) {
  const g = ctx.createLinearGradient(0, 0, 0, 280);
  g.addColorStop(0,   color1);
  g.addColorStop(1,   color2);
  return g;
}

function _fmtMoney(n) {
  return Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " TL";
}

// ── ANA GRAFİK ───────────────────────────────────────────
function loadKasaChart(girisData, cikisData, labels) {
  const canvas = document.getElementById("chartjs-revenue-statistics-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  if (kasaChart) kasaChart.destroy();

  const dark = _isDark();

  // Net hesapla
  const netData = girisData.map((g, i) => g - (cikisData[i] || 0));

  // Gradient fills
  const greenFill  = _gradient(ctx, dark ? "rgba(16,185,129,.45)"  : "rgba(16,185,129,.35)",  "rgba(16,185,129,.02)");
  const redFill    = _gradient(ctx, dark ? "rgba(239,68,68,.40)"   : "rgba(239,68,68,.28)",   "rgba(239,68,68,.02)");
  const blueFill   = _gradient(ctx, dark ? "rgba(59,130,246,.30)"  : "rgba(59,130,246,.20)",  "rgba(59,130,246,.02)");

  kasaChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label:           "Kasa Giriş",
          data:            girisData,
          borderColor:     "#10b981",
          backgroundColor: greenFill,
          borderWidth:     2.5,
          pointRadius:     4,
          pointHoverRadius:7,
          pointBackgroundColor: "#10b981",
          pointBorderColor:     dark ? "#0d1325" : "#fff",
          pointBorderWidth:     2,
          fill:            true,
          tension:         0.42,
          order:           2
        },
        {
          label:           "Kasa Çıkış",
          data:            cikisData,
          borderColor:     "#ef4444",
          backgroundColor: redFill,
          borderWidth:     2.5,
          pointRadius:     4,
          pointHoverRadius:7,
          pointBackgroundColor: "#ef4444",
          pointBorderColor:     dark ? "#0d1325" : "#fff",
          pointBorderWidth:     2,
          fill:            true,
          tension:         0.42,
          order:           1
        },
        {
          label:           "Net Bakiye",
          data:            netData,
          borderColor:     "#3b82f6",
          backgroundColor: blueFill,
          borderWidth:     2,
          borderDash:      [6, 3],
          pointRadius:     3,
          pointHoverRadius:6,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor:     dark ? "#0d1325" : "#fff",
          pointBorderWidth:     2,
          fill:            false,
          tension:         0.42,
          order:           0
        }
      ]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction:         { mode: "index", intersect: false },
      animation:           { duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: dark ? "rgba(13,19,37,.97)" : "rgba(255,255,255,.97)",
          borderColor:      dark ? "rgba(255,255,255,.1)" : "rgba(30,41,59,.1)",
          borderWidth:      1,
          titleColor:       _textColor(),
          bodyColor:        dark ? "#94a3b8" : "#64748b",
          padding:          14,
          cornerRadius:     12,
          boxPadding:       6,
          callbacks: {
            title: (items) => "Gün: " + items[0].label,
            label: (item)  => "  " + item.dataset.label + ": " + _fmtMoney(item.raw)
          }
        }
      },
      scales: {
        x: {
          grid:  { color: _gridColor(), lineWidth: 1 },
          ticks: { color: _tickColor(), font: { size: 12, family: "'Poppins', sans-serif" }, maxTicksLimit: 10 },
          border: { display: false }
        },
        y: {
          grid:  { color: _gridColor(), lineWidth: 1 },
          ticks: {
            color: _tickColor(),
            font:  { size: 12, family: "'Poppins', sans-serif" },
            callback: (v) => v >= 1000000 ? (v/1000000).toFixed(1)+"M" : v >= 1000 ? (v/1000).toFixed(0)+"K" : v
          },
          border: { display: false }
        }
      }
    }
  });

  // Tıklanabilir toggle legend
  const legendDefs = [
    { color: "#10b981", label: "Giriş",  index: 0 },
    { color: "#ef4444", label: "Çıkış",  index: 1 },
    { color: "#3b82f6", label: "Net",    index: 2, dashed: true }
  ];
  const legend = document.getElementById("chartLegend");
  if (legend) {
    legend.innerHTML = legendDefs.map(l => `
      <span
        data-chart-toggle="${l.index}"
        style="
          display:inline-flex;align-items:center;gap:6px;margin-left:12px;
          cursor:pointer;user-select:none;padding:4px 8px;border-radius:6px;
          transition:opacity .2s,background .2s;opacity:1;
        "
        title="Göster / Gizle"
      >
        <span style="
          width:22px;height:3px;flex-shrink:0;
          background:${l.dashed ? "none" : l.color};
          border-top:${l.dashed ? `2px dashed ${l.color}` : "none"};
          display:inline-block;border-radius:3px
        "></span>
        <span style="font-weight:500;font-size:12px">${l.label}</span>
      </span>`).join("");

    if (!legend.dataset.legendBound) {
      legend.dataset.legendBound = "true";
      legend.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-chart-toggle]");
        if (!btn || !kasaChart) return;
        const idx = parseInt(btn.dataset.chartToggle, 10);
        const meta = kasaChart.getDatasetMeta(idx);
        meta.hidden = !meta.hidden;
        kasaChart.update();
        btn.style.opacity = meta.hidden ? "0.35" : "1";
      });
    }
  }
}

// ── PORTFÖY DOUGHNUT ─────────────────────────────────────
function loadPortfolioChart(data) {
  const canvas = document.getElementById("portfolioChart");
  if (!canvas || typeof Chart === "undefined") return;
  if (portfolioChart) portfolioChart.destroy();

  const dark  = _isDark();
  const items = data.filter(d => d.value > 0);
  if (items.length === 0) return;

  const total = items.reduce((s, d) => s + d.value, 0);

  portfolioChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels:   items.map(d => d.label),
      datasets: [{
        data:             items.map(d => d.value),
        backgroundColor:  items.map(d => d.color),
        borderColor:      dark ? "#070c1a" : "#f8fafc",
        borderWidth:      3,
        hoverBorderWidth: 4,
        hoverOffset:      8
      }]
    },
    options: {
      responsive:          false,
      cutout:              "68%",
      animation:           { duration: 1000, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: dark ? "rgba(13,19,37,.97)" : "rgba(255,255,255,.97)",
          borderColor:      dark ? "rgba(255,255,255,.1)" : "rgba(30,41,59,.1)",
          borderWidth:      1,
          titleColor:       _textColor(),
          bodyColor:        dark ? "#94a3b8" : "#64748b",
          padding:          12,
          cornerRadius:     10,
          position:         "nearest",
          xAlign:           "left",
          yAlign:           "center",
          callbacks: {
            title: () => "",
            label: (item) => "  " + item.label + ": " + _fmtMoney(item.raw)
          }
        }
      }
    }
  });

  // Toplam (sağ panel)
  const totalEl = document.getElementById("portfolioTotal");
  if (totalEl) {
    totalEl.textContent = _fmtMoney(total);
    totalEl.style.color = _isDark() ? "#93c5fd" : "#3b82f6";
  }

  // Legend
  const legendEl = document.getElementById("portfolioLegend");
  if (legendEl) {
    legendEl.innerHTML = items.map(d => {
      const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
      return `
        <div style="display:flex;flex-direction:column;gap:3px">
          <div style="display:flex;align-items:center;gap:7px">
            <span style="width:10px;height:10px;border-radius:3px;background:${d.color};flex-shrink:0"></span>
            <span style="font-size:12px;color:${dark?"#94a3b8":"#64748b"};line-height:1.2">${d.label}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;padding-left:17px">
            <span style="font-size:13px;font-weight:700;color:${dark?"#e2e8f0":"#1e293b"}">${_fmtMoney(d.value)}</span>
            <span style="font-size:11px;color:${d.color};font-weight:600">${pct}%</span>
          </div>
        </div>`;
    }).join("");
  }
}

// ── CHART LOADER ─────────────────────────────────────────
async function loadChart(selectedUserId = null) {
  const canvas = document.getElementById("chartjs-revenue-statistics-chart");
  if (!canvas) return;

  try {
    const d = await dashboardStore.fetchChart(selectedUserId);
    if (!d) return;
    loadKasaChart(
      (d.incomes  || []).map(Number),
      (d.expenses || []).map(Number),
      d.labels || []
    );
  } catch (e) {
    console.error("Chart yüklenemedi:", e);
  }
}

// ── PORTFÖY LOADER ───────────────────────────────────────
async function loadPortfolio(summaryData) {
  const portfolioCanvas = document.getElementById("portfolioChart");
  if (!portfolioCanvas) return;

  try {
    // checkStore ve noteStore'dan toplam portföy değeri al
    let checkTotal = 0;
    let noteTotal  = 0;

    if (window.checkStore) {
      try {
        const checks = await checkStore.fetchChecks();
        checkTotal = checks
          .filter(c => c.status === "PORTFOLIO")
          .reduce((s, c) => s + (Number(c.amount) || 0), 0);
      } catch (_) {}
    }

    if (window.noteStore) {
      try {
        const notes = await noteStore.fetchNotes();
        noteTotal = notes
          .filter(n => n.status === "PORTFOLIO")
          .reduce((s, n) => s + (Number(n.amount) || 0), 0);
      } catch (_) {}
    }

    const balance  = Number(summaryData?.balance       || 0);
    const loanDebt = Number(summaryData?.totalLoanDebt || 0);

    const data = [
      { label: "Kasa Bakiyesi",  value: Math.abs(balance),   color: "#3b82f6" },
      { label: "Çek Portföyü",   value: checkTotal,           color: "#10b981" },
      { label: "Senet Portföyü", value: noteTotal,            color: "#8b5cf6" },
      { label: "Kredi Borcu",    value: loanDebt,             color: "#ef4444" },
    ];

    loadPortfolioChart(data);
  } catch (e) {
    console.error("Portfolio chart yüklenemedi:", e);
  }
}

// ── DASHBOARD SUMMARY ────────────────────────────────────
async function loadDashboard(selectedUserId = null) {
  const gi       = document.getElementById("gunlukGiris");
  const gc       = document.getElementById("gunlukCikis");
  const an       = document.getElementById("aylikNet");
  const kb       = document.getElementById("kasaBakiye");
  const krediBorc = document.getElementById("toplamKrediBorc");

  if (!gi || !gc || !an || !kb) return;

  try {
    gi.innerText = "..."; gc.innerText = "...";
    an.innerText = "..."; kb.innerText = "...";
    if (krediBorc) krediBorc.innerText = "...";

    const d = await dashboardStore.fetchSummary(selectedUserId);
    if (!d) return;

    const runAnims = () => {
      animateValue(gi, Number(d.todayIncome  || 0));
      animateValue(gc, Number(d.todayExpense || 0));
      animateValue(an, Number(d.monthlyNet   || 0));
      animateValue(kb, Number(d.balance      || 0));
      if (krediBorc) animateValue(krediBorc, Number(d.totalLoanDebt || 0));
    };

    if (window._appVisible) runAnims();
    else document.addEventListener("appVisible", runAnims, { once: true });

    setAutoBar("barGunlukGiris", d.todayIncome    || 0, 500000);
    setAutoBar("barGunlukCikis", d.todayExpense   || 0, 500000);
    setAutoBar("barBakiye",      d.balance        || 0, 500000);
    setAutoBar("barAylikGiris",  d.monthlyNet     || 0, 500000);
    setAutoBar("barKredi",       d.totalLoanDebt  || 0, 1000000);

    // Portföy grafiği summary ile beraber yükle
    loadPortfolio(d);

  } catch (e) {
    console.error("Dashboard yüklenemedi:", e);
    gi.innerText = "0"; gc.innerText = "0";
    an.innerText = "0"; kb.innerText = "0";
    showToast("Dashboard yüklenemedi: " + e.message, "error");
  }
}

// ── VADESİ YAKLAŞAN KART ─────────────────────────────────
async function loadVadesiKart() {
  const wrapper = document.getElementById("vadesiKartWrapper");
  if (sessionStorage.getItem("role") !== "ADMIN") {
    if (wrapper) wrapper.style.display = "none";
    return;
  }

  const tutarEl = document.getElementById("vadesiToplamTutar");
  const adetEl  = document.getElementById("vadesiBakliyeAdet");
  if (!tutarEl || !adetEl) return;

  tutarEl.textContent = "...";
  adetEl.textContent  = "...";

  try {
    const today = new Date();
    const end   = new Date();
    end.setDate(end.getDate() + 30);

    const fmt = (d) => [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");

    const data = await apiClient.request(
      `/reports?startDate=${fmt(today)}&endDate=${fmt(end)}`
    );

    if (!data) { tutarEl.textContent = "0 TL"; adetEl.textContent = "0 adet"; return; }

    const checks = data.upcomingChecks || [];
    const notes  = data.upcomingNotes  || [];
    const total  = [...checks, ...notes].reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const count  = checks.length + notes.length;

    animateValue(tutarEl, total);
    setTimeout(() => {
      adetEl.textContent = `${count} adet`;
    }, 800);

    const maxRef = 500000;
    setAutoBar("barVadesi", Math.min((total / maxRef) * 100, 100), 100);

  } catch (e) {
    console.error("Vadesi yaklaşan yüklenemedi:", e);
    tutarEl.textContent = "—";
    adetEl.textContent  = "—";
  }
}

// ── INIT ─────────────────────────────────────────────────
function initDashboard(selectedUserId = null) {
  if (!authStore.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  loadDashboard(selectedUserId);

  const canvas = document.getElementById("chartjs-revenue-statistics-chart");
  if (canvas) loadChart(selectedUserId);

  loadCheckSummary();
  loadNotesDashboard();
  loadVadesiKart();
  loadHeaderNotifications();

  setTimeout(() => loadCalendar(), 100);
}

// Dark mode toggle sonrası grafikleri yenile
document.addEventListener("darkModeChanged", () => {
  const d = dashboardStore.chart;
  if (d) {
    loadKasaChart(
      (d.incomes  || []).map(Number),
      (d.expenses || []).map(Number),
      d.labels || []
    );
  } else if (window.loadChart) {
    loadChart();
  }
  if (dashboardStore.summary) {
    loadPortfolio(dashboardStore.summary);
  }
});

window.loadDashboard  = loadDashboard;
window.loadChart      = loadChart;
window.initDashboard  = initDashboard;
