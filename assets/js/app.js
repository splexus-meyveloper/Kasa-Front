// ==============================
// APP CORE
// ==============================

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

  const lastPage = localStorage.getItem("lastPage") || "dashboard.html";

  if (window.loadPage) {
    loadPage(lastPage);
  }
}

window.initAppShell = initAppShell;
window.initApp = initApp;

document.addEventListener("DOMContentLoaded", function () {
  initApp();
  wsClient.connect();
});