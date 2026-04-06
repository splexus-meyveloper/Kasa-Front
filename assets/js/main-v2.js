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

    
// ✅ CLEAN RESIZE
function resizeKasappLayout() {
    // mobile moddan çıkınca sidebar kapanmış kalsın
    if (window.innerWidth > 1199) {
        document.body.classList.remove('sidebar-mobile-open');
    }
}

// event
window.addEventListener('resize', resizeKasappLayout);

// ilk load
resizeKasappLayout();

/*--
    Custom Scrollbar (Perfect Scrollbar)
-----------------------------------*/ 
//$('.custom-scroll').each( function() {
 //   var ps = new PerfectScrollbar($(this)[0]);
//});
    
async function initUserFilter() {

  const select = document.getElementById("userFilterSelect");
  const box = document.getElementById("userFilterBox");

  if (!select || !box) return;

  const jwt = JSON.parse(atob(localStorage.getItem("token").split('.')[1]));
  const role = jwt.role;

  // 👤 USER → hiçbir şey gösterme
  if (role !== "ADMIN") {
    box.style.display = "none";
    return;
  }

  // 👑 ADMIN → göster
  box.style.display = "block";

  // kullanıcıları çek
  const res = await fetch(`${API_BASE}/api/admin/profiles`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) return;

  const users = await res.json();

  // dropdown temizle
  select.innerHTML = `<option value="">Tüm Kullanıcılar</option>`;

  users.forEach(u => {
    select.insertAdjacentHTML("beforeend",
      `<option value="${u.id}">${u.username}</option>`
    );
  });

  // seçim değişince dashboard yenile
  select.addEventListener("change", () => {
    loadDashboardWithFilter();
  });
}

async function loadDashboardWithFilter() {

  const select = document.getElementById("userFilterSelect");
  const userId = select?.value;

  let url = `${API_BASE}/api/dashboard`;

  if (userId) {
    url += `?userId=${userId}`;
  }

  const res = await fetch(url, {
    headers: getAuthHeaders()
  });

  if (!res.ok) return;

  const data = await res.json();

  // 🔥 senin mevcut dashboard update fonksiyonun
  updateDashboardUI(data);

  // chart da yenile
  loadChartWithFilter(userId);
}

async function loadChartWithFilter(userId) {

  let url = `${API_BASE}/api/dashboard/chart`;

  if (userId) {
    url += `?userId=${userId}`;
  }

  const res = await fetch(url, {
    headers: getAuthHeaders()
  });

  if (!res.ok) return;

  const data = await res.json();

  updateChartUI(data);
}


})(jQuery);

