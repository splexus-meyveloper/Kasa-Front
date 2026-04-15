let calendar;

function getCalendarNotes() {
  try {
    return JSON.parse(localStorage.getItem("calendarNotes") || "[]");
  } catch {
    return [];
  }
}

function saveCalendarNotes(notes) {
  localStorage.setItem("calendarNotes", JSON.stringify(notes));
}

function addCalendarNote(note) {
  const notes = getCalendarNotes();
  notes.push(note);
  saveCalendarNotes(notes);
}

async function loadCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  const events = [];

  // ÇEKLER
  const checks = await checkStore.fetchChecks();
  checks.forEach(c => {
    if (!c.dueDate) return;

    const dynamicColor = getDueColor(c.dueDate);

    events.push({
      id: "check-" + c.id,
      title: `Çek: ${c.amount} TL`,
      start: c.dueDate,
      allDay: true,
      color: dynamicColor,
      extendedProps: {
        type: "CHECK",
        data: c
      }
    });
  });

  // SENETLER
  const notesPortfolio = await fetch(`${API_BASE}/notes/portfolio`, {
    headers: getAuthHeaders()
  }).then(r => r.json());

  notesPortfolio.forEach(n => {
    if (!n.dueDate) return;

    const dynamicColor = getDueColor(n.dueDate);

    events.push({
      id: "note-" + n.id,
      title: `Senet: ${n.amount} TL`,
      start: n.dueDate,
      allDay: true,
      color: dynamicColor,
      extendedProps: {
        type: "SENET",
        data: n
      }
    });
  });

  // KREDİLER
  const loans = await loanStore.fetchLoans();
  loans.forEach(l => {
    if (!l.paymentDay) return;

    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), l.paymentDay);
    const dynamicColor = getDueColor(date);

    events.push({
      id: "loan-" + l.id,
      title: `Kredi: ${l.monthlyPayment} TL`,
      start: date,
      allDay: true,
      color: dynamicColor,
      extendedProps: {
        type: "LOAN",
        data: l
      }
    });
  });

  // MANUEL TAKVİM NOTLARI
  const calendarNotes = getCalendarNotes();
  calendarNotes.forEach(n => {
    if (!n.date) return;

    events.push({
      id: "calendar-note-" + n.id,
      title: `Not: ${n.text}`,
      start: n.date,
      allDay: true,
      color: "#0f766e",
      extendedProps: {
        type: "NOTE",
        data: n
      }
    });
  });

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    displayEventTime: false,
    locale: "tr",
    height: 600,

    headerToolbar: {
      left: "",
      center: "title",
      right: ""
    },

    events,

    eventClick: function(info) {
      openEventModal(info.event);
    },

    dateClick: function(info) {
      const noteDate = document.getElementById("noteDate");
      const noteText = document.getElementById("noteText");

      if (noteDate) noteDate.value = info.dateStr;
      if (noteText) noteText.value = "";

      openModal("noteModal");
    },

    eventContent: function(arg) {
      const type = arg.event.extendedProps.type;
      const title = arg.event.title;

      let icon = "";

      if (type === "CHECK") {
        icon = '<i class="zmdi zmdi-money" style="margin-right:4px;"></i>';
      } else if (type === "LOAN") {
        icon = '<i class="zmdi zmdi-balance" style="margin-right:4px;"></i>';
      } else if (type === "SENET") {
        icon = '<i class="zmdi zmdi-file-text" style="margin-right:4px;"></i>';
      } else if (type === "NOTE") {
        icon = '<i class="zmdi zmdi-edit" style="margin-right:4px;"></i>';
      }

      return {
        html: `<div style="display:flex;align-items:center;font-size:12px;">${icon}${title}</div>`
      };
    }
  });

  calendar.render();
}

function refreshCalendar() {
  if (calendar) {
    calendar.destroy();
  }
  loadCalendar();
}

function openEventModal(event) {
  const data = event.extendedProps?.data || {};
  const type = event.extendedProps?.type || "";

  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalIcon = document.getElementById("modalIcon");
  const modalDate = document.getElementById("modalDate");
  const modalAmount = document.getElementById("modalAmount");
  const modalType = document.getElementById("modalType");
  const modalDesc = document.getElementById("modalDesc");
  const modalStatus = document.getElementById("modalStatus");

  // Her açılışta gizlenen alanları geri aç
  if (modalAmount?.parentElement) {
    modalAmount.parentElement.style.display = "flex";
  }
  if (modalType?.parentElement) {
    modalType.parentElement.style.display = "flex";
  }

  let typeText = "";
  if (type === "CHECK") typeText = "Çek";
  else if (type === "SENET") typeText = "Senet";
  else if (type === "LOAN") typeText = "Kredi";
  else if (type === "NOTE") typeText = "Not";

  modalDate.textContent = event.start
    ? new Date(event.start).toLocaleDateString("tr-TR")
    : "-";

  modalType.textContent = typeText;

  if (type === "CHECK") {
    modalTitle.textContent = "Çek Detayı";
    modalSubtitle.textContent = data.checkNo ? `Çek No: ${data.checkNo}` : "";
    modalIcon.innerHTML = '<i class="zmdi zmdi-money-box"></i>';

    modalAmount.textContent = formatMoney(data.amount) + " TL";
    modalDesc.textContent = data.description || "-";
    modalStatus.textContent = "Kasanda";
  }

  else if (type === "SENET") {
    modalTitle.textContent = "Senet Detayı";
    modalSubtitle.textContent = data.noteNo ? `Senet No: ${data.noteNo}` : "";
    modalIcon.innerHTML = '<i class="zmdi zmdi-assignment"></i>';

    modalAmount.textContent = formatMoney(data.amount) + " TL";
    modalDesc.textContent = data.description || "-";
    modalStatus.textContent = "Kasanda";
  }

  else if (type === "LOAN") {
    modalTitle.textContent = "Kredi Detayı";
    modalSubtitle.textContent = data.bankName || "";
    modalIcon.innerHTML = '<i class="zmdi zmdi-balance"></i>';

    modalAmount.textContent = formatMoney(data.monthlyPayment) + " TL";
    modalDesc.textContent = data.bankName || "-";
    modalStatus.textContent =
      data.remainingDebt != null
        ? "Kalan Borç: " + formatMoney(data.remainingDebt) + " TL"
        : "Aktif";
  }

  else if (type === "NOTE") {
    modalTitle.textContent = "Takvim Notu";
    modalSubtitle.textContent = "Manuel eklenen not";
    modalIcon.innerHTML = '<i class="zmdi zmdi-edit"></i>';

    if (modalAmount?.parentElement) {
      modalAmount.parentElement.style.display = "none";
    }
    if (modalType?.parentElement) {
      modalType.parentElement.style.display = "none";
    }

    modalDesc.textContent = data.text || "-";
    modalStatus.textContent = "Not";
  }

  openModal("eventModal");
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function closeAllCalendarModals() {
  closeModal("eventModal");
  closeModal("noteModal");
}

document.addEventListener("click", function(e) {
  const closeTarget = e.target.closest("[data-close]");
  if (closeTarget) {
    const modalId = closeTarget.getAttribute("data-close");
    closeModal(modalId);
    return;
  }

  const saveNoteBtn = e.target.closest("#saveNoteBtn");
  if (saveNoteBtn) {
    const date = document.getElementById("noteDate")?.value;
    const text = document.getElementById("noteText")?.value?.trim();

    if (!date || !text) {
      showToast("Tarih ve not alanını doldurun", "error");
      return;
    }

    addCalendarNote({
      id: Date.now(),
      date,
      text
    });

    showToast("Takvim notu eklendi", "success");
closeModal("noteModal");

// 🔥 SCROLL KONUMUNU KORU
const scrollY = window.scrollY;

refreshCalendar();

setTimeout(() => {
  window.scrollTo(0, scrollY);
}, 50);

return;
  }
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    closeAllCalendarModals();
  }
});


window.loadCalendar = loadCalendar;
window.refreshCalendar = refreshCalendar;