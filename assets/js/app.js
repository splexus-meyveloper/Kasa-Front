// ==============================
// APP CORE
// ==============================

function runPageInitializers() {
  initDashboard();
  loadChecks();
  loadNotes();
  loadLoans();
  loadCashTransactions();
  initUserFilter();
}

function initAppShell() {
  checkPagePermission();

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

  const username = localStorage.getItem("username");
  const headerEl = document.getElementById("headerUserName");
  const dropdownEl = document.getElementById("dropdownUserName");

  if (username) {
    if (headerEl) headerEl.textContent = username;
    if (dropdownEl) dropdownEl.textContent = username;
  }
}

function initApp() {
  initAppShell();
  runPageInitializers();
}

window.runPageInitializers = runPageInitializers;
window.initAppShell = initAppShell;
window.initApp = initApp;

document.addEventListener("DOMContentLoaded", function () {
  initApp();
});