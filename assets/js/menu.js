function initMenu() {
  const body = document.body;
  const toggleBtn = document.querySelector('.side-header-toggle');
  const sidebar = document.querySelector('.side-header');

  // tekrar init olmasın
  const oldFlyout = document.querySelector('.flyout');
  if (oldFlyout) oldFlyout.remove();

  const flyout = document.createElement('div');
  flyout.className = 'flyout';
  document.body.appendChild(flyout);

  let hoverTimeout = null;
  let currentItem = null;

  function clearHoverTimeout() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  }

  function closeFlyout() {
    clearHoverTimeout();
    flyout.classList.remove('show');
    flyout.innerHTML = '';
    currentItem = null;
  }

  function closeAll() {
    document.querySelectorAll('.has-sub-menu.open')
      .forEach(item => item.classList.remove('open'));
  }

  function openNormalSubmenu(item) {
    const isOpen = item.classList.contains('open');
    closeAll();
    if (!isOpen) item.classList.add('open');
  }

  function positionFlyout(item) {
    const rect = item.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();

    flyout.style.left = `${sidebarRect.right + 12}px`;

    // içerik yüklenmeden önce görünür yapma
    flyout.style.visibility = 'hidden';
    flyout.classList.add('show');

    requestAnimationFrame(() => {
      const flyoutHeight = flyout.offsetHeight;
      const viewportHeight = window.innerHeight;

      let top = rect.top;
      if (top + flyoutHeight > viewportHeight - 10) {
        top = Math.max(10, viewportHeight - flyoutHeight - 10);
      }

      flyout.style.top = `${top}px`;
      flyout.style.visibility = 'visible';
    });
  }

  function openFlyout(item) {
    const submenu = item.querySelector('.side-header-sub-menu');
    if (!submenu) return;

    clearHoverTimeout();
    currentItem = item;

    flyout.innerHTML = submenu.innerHTML;
    positionFlyout(item);
  }

  // normal mode click
  document.addEventListener('click', function (e) {
    const submenuItem = e.target.closest('.has-sub-menu');

    if (body.classList.contains('sidebar-collapsed')) {
      if (!e.target.closest('.flyout') && !e.target.closest('.has-sub-menu')) {
        closeFlyout();
      }
      return;
    }

    if (!submenuItem) {
      closeAll();
      return;
    }

    // sadece parent tıklamasında submenu aç/kapa
    const clickedInsideSubmenu = e.target.closest('.side-header-sub-menu');
    if (clickedInsideSubmenu) return;

    e.preventDefault();
    openNormalSubmenu(submenuItem);
  });

  // toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      body.classList.toggle('sidebar-collapsed');
      closeAll();
      closeFlyout();
    });
  }

  // collapsed hover
  document.querySelectorAll('.has-sub-menu').forEach(item => {
    item.addEventListener('mouseenter', function () {
      if (!body.classList.contains('sidebar-collapsed')) return;
      openFlyout(item);
    });

    item.addEventListener('mouseleave', function () {
      if (!body.classList.contains('sidebar-collapsed')) return;

      clearHoverTimeout();
      hoverTimeout = setTimeout(() => {
        if (currentItem !== item) return;
        if (!flyout.matches(':hover') && !item.matches(':hover')) {
          closeFlyout();
        }
      }, 180);
    });
  });

  flyout.addEventListener('mouseenter', function () {
    clearHoverTimeout();
  });

  flyout.addEventListener('mouseleave', function () {
    clearHoverTimeout();
    hoverTimeout = setTimeout(() => {
      closeFlyout();
    }, 180);
  });

  // resize / scroll
  window.addEventListener('resize', function () {
    if (body.classList.contains('sidebar-collapsed') && currentItem && flyout.classList.contains('show')) {
      positionFlyout(currentItem);
    }
  });

  window.addEventListener('scroll', function () {
    if (body.classList.contains('sidebar-collapsed') && currentItem && flyout.classList.contains('show')) {
      positionFlyout(currentItem);
    }
  }, true);
}