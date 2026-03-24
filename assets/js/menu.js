console.log("MENU JS LOADED");
(function () {
  const body = document.body;

  const menuItems = document.querySelectorAll('.side-header-menu > ul > li.has-sub-menu');

  // =========================
  // CLOSE ALL
  // =========================
  function closeAll() {
    menuItems.forEach(item => item.classList.remove('open'));
  }

  // =========================
  // TOGGLE CLICK (NORMAL MODE)
  // =========================
  document.addEventListener('click', function (e) {
    const item = e.target.closest('.has-sub-menu');

    // menu dışı click → kapat
    if (!item) {
      closeAll();
      return;
    }

    // collapsed modda click çalışmasın
    if (body.classList.contains('sidebar-collapsed')) return;

    const isOpen = item.classList.contains('open');

    closeAll();
    if (!isOpen) item.classList.add('open');
  });

  // =========================
  // HOVER (COLLAPSED MODE)
  // =========================
  menuItems.forEach(item => {
    item.addEventListener('mouseenter', function () {
      if (!body.classList.contains('sidebar-collapsed')) return;

      closeAll();
      item.classList.add('open');
    });
  });

  // =========================
  // MOUSE OUT → TAM KAPAT
  // =========================
  document.addEventListener('mousemove', function (e) {
    if (!body.classList.contains('sidebar-collapsed')) return;

    const inside = e.target.closest('.side-header, .side-header-sub-menu');

    if (!inside) {
      closeAll();
    }
  });

  // =========================
  // SIDEBAR TOGGLE
  // =========================
  const toggleBtn = document.querySelector('.side-header-toggle');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      body.classList.toggle('sidebar-collapsed');
      closeAll();
    });
  }

})();