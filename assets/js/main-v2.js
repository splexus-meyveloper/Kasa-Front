(function ($) {
    "use strict";
/*--
    Commons Variables
-----------------------------------*/
var $window = $(window);
var $body = $('body');

/*--
    Adomx Dropdown (Custom Dropdown)
-----------------------------------*/
if ($('.adomx-dropdown').length) {
    var $adomxDropdown = $('.adomx-dropdown'),
        $adomxDropdownMenu = $adomxDropdown.find('.adomx-dropdown-menu');

    $adomxDropdown.on('click', '.toggle', function(e){
        e.preventDefault();
        var $this = $(this);
        if(!$this.parent().hasClass('show')) {
            $adomxDropdown.removeClass('show');
            $adomxDropdownMenu.removeClass('show');
            $this.siblings('.adomx-dropdown-menu').addClass('show').parent().addClass('show');
        } else {
            $this.siblings('.adomx-dropdown-menu').removeClass('show').parent().removeClass('show');
        }
    });
    /*Close When Click Outside*/
    $body.on('click', function(e){
        var $target = e.target;
        if (!$($target).is('.adomx-dropdown') && !$($target).parents().is('.adomx-dropdown') && $adomxDropdown.hasClass('show')) {
            $adomxDropdown.removeClass('show');
            $adomxDropdownMenu.removeClass('show');
        }
    });
}

/*--
    Header Search Open/Close
-----------------------------------*/
var $headerSearchOpen = $('.header-search-open'),
    $headerSearchClose = $('.header-search-close'),
    $headerSearchForm = $('.header-search-form');
$headerSearchOpen.on('click', function(){
    $headerSearchForm.addClass('show');
});
$headerSearchClose.on('click', function(){
    $headerSearchForm.removeClass('show');
});

/*--
    Side Header
-----------------------------------*/
var $sideHeaderToggle = $('.side-header-toggle'),
    $sideHeaderClose = $('.side-header-close'),
    $sideHeader = $('.side-header');

/*Add/Remove Show/Hide Class On Depending on Viewport Width*/
function $sideHeaderClassToggle() {
    var $windowWidth = $window.width();
    if( $windowWidth >= 1200 ) {
        $sideHeader.removeClass('hide').addClass('show');
    } else {
        $sideHeader.removeClass('show').addClass('hide');
    }
}
$sideHeaderClassToggle();
/*Side Header Toggle*/
$(document).off('click', '.side-header-toggle');

$(document).on('click', '.side-header-toggle', function (e) {
  e.preventDefault();
  e.stopImmediatePropagation();

  document.body.classList.toggle('sidebar-collapsed');

  if (document.body.classList.contains('sidebar-collapsed')) {
    closeAllSubMenusHard();
  }
});

function closeAllSubMenusHard() {

  // Animasyonları durdur
  $('.side-header-sub-menu').stop(true, true);

  // Class temizle
  $('.has-sub-menu').removeClass('active open');

  // Icon reset
  $('.has-sub-menu .menu-expand i')
    .removeClass('zmdi-chevron-up')
    .addClass('zmdi-chevron-down');

  // INLINE STYLE TEMİZLE
  document.querySelectorAll('.side-header-sub-menu').forEach(ul => {
    ul.style.display = "";
    ul.style.height = "";
    ul.style.overflow = "";
  });
}

// ✅ Mini modda submenu click toggle’u blokla (capture ile)
document.addEventListener("click", function (e) {
  if (!document.body.classList.contains("sidebar-collapsed")) return;

  const a = e.target.closest(".has-sub-menu > a, .has-sub-menu .menu-expand");
  if (!a) return;

  // mini modda aşağı doğru açılmayı tamamen engelle
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
}, true);
/*Side Header Close (Visiable Only On Mobile)*/
$sideHeaderClose.on('click', function(){
    $sideHeader.removeClass('show').addClass('hide');
});
    
/*--
Side Header Menu
-----------------------------------*/

var $sideHeaderNav = $('.side-header-menu');
var $sideHeaderSubMenu = $sideHeaderNav.find('.side-header-sub-menu');

/* submenu expand icon ekle */
$sideHeaderSubMenu.siblings('a').append(
    '<span class="menu-expand"><i class="zmdi zmdi-chevron-down"></i></span>'
);

/* submenu click behaviour */
$sideHeaderNav.on('click', 'li a, li .menu-expand', function(e) {

    // sidebar mini moddaysa açılmayı engelle
    if (document.body.classList.contains("sidebar-collapsed")) {
        return;
    }

    var $this = $(this);
    var $parentLi = $this.parent('li');

    if ($parentLi.hasClass('has-sub-menu') || 
        $this.attr('href') === '#' || 
        $this.hasClass('menu-expand')) {

        e.preventDefault();

        var $submenu = $parentLi.children('ul');

        if ($submenu.is(':visible')) {

            $parentLi.removeClass('active');
            $submenu.slideUp(200);

            $parentLi
                .children('a')
                .find('.menu-expand i')
                .removeClass('zmdi-chevron-up')
                .addClass('zmdi-chevron-down');

        } else {

            $parentLi.addClass('active');
            $submenu.slideDown(200);

            $parentLi
                .children('a')
                .find('.menu-expand i')
                .removeClass('zmdi-chevron-down')
                .addClass('zmdi-chevron-up');

            // diğer açık menüleri kapat
            $parentLi.siblings('li')
                .removeClass('active')
                .find('ul:visible')
                .slideUp(200)
                .siblings('a')
                .find('.menu-expand i')
                .removeClass('zmdi-chevron-up')
                .addClass('zmdi-chevron-down');
        }
    }
});



$sideHeaderNav.on('click', 'li a, li .menu-expand', function(e) {

    if (document.body.classList.contains("sidebar-collapsed")) {
        return;
    }

    var $this = $(this);

    if ( $this.parent('li').hasClass('has-sub-menu') || 
         ($this.attr('href') === '#' || $this.hasClass('menu-expand')) ) {

        e.preventDefault();

        if ($this.siblings('ul:visible').length){

            $this.parent('li')
                .removeClass('active')
                .children('ul')
                .slideUp()
                .siblings('a')
                .find('.menu-expand i')
                .removeClass('zmdi-chevron-up')
                .addClass('zmdi-chevron-down');

        } else {

            $this.parent('li')
                .addClass('active')
                .children('ul')
                .slideDown()
                .siblings('a')
                .find('.menu-expand i')
                .removeClass('zmdi-chevron-down')
                .addClass('zmdi-chevron-up');

            $this.parent('li')
                .siblings('li')
                .removeClass('active')
                .find('ul:visible')
                .slideUp()
                .siblings('a')
                .find('.menu-expand i')
                .removeClass('zmdi-chevron-up')
                .addClass('zmdi-chevron-down');
        }
    }
});

// Adding active class to nav menu depending on page
var pageUrl = window.location.href.substr(window.location.href.lastIndexOf("/") + 1);
$('.side-header-menu a').each(function() {
    if ($(this).attr("href") === pageUrl || $(this).attr("href") === '') {
        $(this).closest('li').addClass("active").parents('li').addClass('active').children('ul').slideDown().siblings('a').find('.menu-expand i').removeClass('zmdi-chevron-down').addClass('zmdi-chevron-up');
    }
    else if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        $('.side-header-menu a[href="index.html"]').closest('li').addClass("active").parents('li').addClass('active').children('ul').slideDown().siblings('a').find('.menu-expand i').removeClass('zmdi-chevron-down').addClass('zmdi-chevron-up');
    }
})

/*--
    Tooltip, Popover & Tippy Tooltip
-----------------------------------*/
/*Bootstrap Tooltip*/
//const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
//const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
/*Bootstrap Popover*/
//const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
//const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
/*Tippy Tooltip*/
//tippy('.tippy, [data-tippy-content], [data-tooltip]', {
    //flipOnUpdate: true,
    //boundary: 'window',
//});

/*-- 
    Selectable Table
-----------------------------------*/
function tableSelectable() {
    var $tableSelectable = $('.table-selectable');
    $tableSelectable.find('tbody .selected').find('input[type="checkbox"]').prop('checked', true);
    $tableSelectable.on('click', 'input[type="checkbox"]', function(){
        var $this = $(this);
        if( $this.parent().parent().is('th')) {
            if( !$this.is(':checked') ) {
                $this.closest('table').find('tbody').children('tr').removeClass('selected').find('input[type="checkbox"]').prop('checked', false);
            } else {
                $this.closest('table').find('tbody').children('tr').addClass('selected').find('input[type="checkbox"]').prop('checked', true);
            }
        } else {
            if( !$this.is(':checked') ) {
                $this.closest('tr').removeClass('selected');
            } else {
                $this.closest('tr').addClass('selected');
            }
            if( $this.closest('tbody').children('.selected').length < $this.closest('tbody').children('tr').length ) {
                $this.closest('table').find('thead').find('input[type="checkbox"]').prop('checked', false);
            } else if( $this.closest('tbody').children('.selected').length === $this.closest('tbody').children('tr').length ) {
                $this.closest('table').find('thead').find('input[type="checkbox"]').prop('checked', true);
            }
        }
    });
}
tableSelectable();
    
/*-- 
    To Do List
-----------------------------------*/
function todoList() {
    // Variable
    var $todoList = $('.todo-list'),
        $todoListAddNew = $('.todo-list-add-new');
    //Todo List Check
    $todoList.find('.done').find('input[type="checkbox"]').prop('checked', true);
    $todoList.on('click', 'input[type="checkbox"]', function(){
        var $this = $(this);
        if( !$this.is(':checked') ) {
            $this.closest('li').removeClass('done');
        } else {
            $this.closest('li').addClass('done');
        }
    });
    //Todo List Status Stared
    $todoList.on('click', '.status', function() {
        var $this = $(this);
        if( !$this.hasClass('stared') ) {
            $this.addClass('stared').find('i').removeClass('zmdi-star-outline').addClass('zmdi-star');
        } else {
            $this.removeClass('stared').find('i').removeClass('zmdi-star').addClass('zmdi-star-outline');
        }
    });
    //Todo List Remove
    $todoList.on('click', '.remove', function() {
      $(this).closest('li').remove();
    });
    //Todo List Add New Status Stared
    $todoListAddNew.on('click', '.status input', function() {
        var $this = $(this);
        if( $this.prop('checked') === true ) {
            $this.siblings('.icon').removeClass('zmdi-star-outline').addClass('zmdi-star');
        } else {
            $this.siblings('.icon').removeClass('zmdi-star').addClass('zmdi-star-outline');
        }
    });
    //Todo List Add New
    $todoListAddNew.on("click", '.submit', function(e) {
        e.preventDefault();
        var $content = $(this).siblings('input.content').val(),
            $date = $(this).closest('.todo-list-add-new').data('date') === false ? 'd-none' : 'd-block',
            $status = $(this).siblings('.status').find('input'),
            $stared = $status.prop('checked') === true ? 'stared' : '',
            $staredIcon = $status.prop('checked') === true ? 'zmdi-star' : 'zmdi-star-outline';
        if ($content) {
            $todoList.prepend('<li> <div class="list-action"> <button class="status '+$stared+'"><i class="zmdi '+$staredIcon+'"></i></button> <label class="adomx-checkbox"><input type="checkbox"> <i class="icon"></i></label> </div> <div class="list-content"><p>' + $content + '</p> <span class="time '+$date+'">'+moment(moment.utc().toDate()).format('h:mm a (YYYY-MM-DD)')+'</span> </div> <div class="list-action right"> <button class="remove"><i class="zmdi zmdi-delete"></i></button> </div></li>');
            $(this).siblings('input.content').val("");
            $status.prop('checked', false).siblings('.icon').removeClass('zmdi-star').addClass('zmdi-star-outline');
        }
    });
}
todoList();
    
/*--
    Chat Contact
-----------------------------------*/
var $chatContactOpen = $('.chat-contacts-open'),
    $chatContactClose = $('.chat-contacts-close'),
    $chatContacts = $('.chat-contacts');
$chatContactOpen.on('click', function(){
    $chatContacts.addClass('show');
});
$chatContactClose.on('click', function(){
    $chatContacts.removeClass('show');
});


// Common Resize function
function resize() {
    $sideHeaderClassToggle();
}
// Resize Window Resize
$window.on('resize', function(){
    resize();
});
    
/*--
    Custom Scrollbar (Perfect Scrollbar)
-----------------------------------*/ 
//$('.custom-scroll').each( function() {
 //   var ps = new PerfectScrollbar($(this)[0]);
//});
    
})(jQuery);

/* =====================================================
   KASA APP - MINI SIDEBAR PROFESSIONAL FLYOUT
===================================================== */

(function () {
  let flyout = null;
  let hideTimer = null;
  let activeLi = null;

  function removeFlyout() {
    if (flyout) {
      flyout.remove();
      flyout = null;
    }
    activeLi = null;
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
  removeFlyout();
 }, 300);
  }

  function cancelHide() {
    clearTimeout(hideTimer);
  }

  function buildFlyout(li) {
    const submenu = li.querySelector(".side-header-sub-menu");
    const mainLink = li.querySelector(":scope > a");
    if (!submenu || !mainLink) return null;

    const iconEl = mainLink.querySelector("i");
    const textEl = mainLink.querySelector("span");

    const iconClass = iconEl ? iconEl.className : "zmdi zmdi-menu";
    const titleText = textEl ? textEl.textContent.trim() : "Menü";

    const wrapper = document.createElement("div");
    wrapper.className = "mini-flyout";

    wrapper.innerHTML = `
      <div class="mini-flyout-title">
        <i class="${iconClass}"></i>
        <span>${titleText}</span>
      </div>
    `;

    const clonedSubmenu = submenu.cloneNode(true);
    wrapper.appendChild(clonedSubmenu);

    wrapper.addEventListener("mouseenter", cancelHide);
    wrapper.addEventListener("mouseleave", scheduleHide);

    return wrapper;
  }

  function positionFlyout(li, flyoutEl) {
    const rect = li.getBoundingClientRect();
    const gap = 10;

    flyoutEl.style.visibility = "hidden";
    flyoutEl.style.left = "0px";
    flyoutEl.style.top = "0px";
    document.body.appendChild(flyoutEl);

    const flyoutRect = flyoutEl.getBoundingClientRect();

    let left = rect.right + gap;
    let top = rect.top;

    const maxLeft = window.innerWidth - flyoutRect.width - 12;
    const maxTop = window.innerHeight - flyoutRect.height - 12;

    if (left > maxLeft) left = maxLeft;
    if (top > maxTop) top = Math.max(12, maxTop);
    if (top < 12) top = 12;

    flyoutEl.style.left = `${left}px`;
    flyoutEl.style.top = `${top}px`;
    flyoutEl.style.visibility = "visible";
  }

  function showFlyoutFor(li) {
    if (!document.body.classList.contains("sidebar-collapsed")) {
      removeFlyout();
      return;
    }

    if (activeLi === li && flyout) return;

    removeFlyout();

    const newFlyout = buildFlyout(li);
    if (!newFlyout) return;

    activeLi = li;
    flyout = newFlyout;

    positionFlyout(li, flyout);
  }

  document.addEventListener("mouseover", function (e) {
    if (!document.body.classList.contains("sidebar-collapsed")) return;

    const li = e.target.closest(".side-header-menu > ul > li.has-sub-menu");
    if (!li) return;

    cancelHide();
    showFlyoutFor(li);
  });

  document.addEventListener("mouseout", function (e) {
    if (!document.body.classList.contains("sidebar-collapsed")) return;

    const fromLi = e.target.closest(".side-header-menu > ul > li.has-sub-menu");
    const related = e.relatedTarget;

    if (!fromLi) return;

    const goingToFlyout = related && related.closest && related.closest(".mini-flyout");
    const goingToMenuItem = related && related.closest && related.closest(".side-header-menu > ul > li.has-sub-menu");

    if (!goingToFlyout && !goingToMenuItem) {
      scheduleHide();
    }
  });

  document.addEventListener("click", function (e) {
    const flyoutLink = e.target.closest(".mini-flyout a");
    if (flyoutLink) {
      removeFlyout();
    }
  });

  window.addEventListener("resize", function () {
    removeFlyout();
  });

  document.addEventListener("click", function (e) {
    const insideFlyout = e.target.closest(".mini-flyout");
    const insideSidebarItem = e.target.closest(".side-header-menu > ul > li.has-sub-menu");

    if (!insideFlyout && !insideSidebarItem) {
      removeFlyout();
    }
  });

  document.addEventListener("click", function () {
    if (!document.body.classList.contains("sidebar-collapsed")) {
      removeFlyout();
    }
  });
})();