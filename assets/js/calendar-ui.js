let calendar;

// ==============================
// CALENDAR NOTES API
// ==============================

async function fetchCalendarNotes() {
  return apiClient.request("/calendar-notes");
}

async function createCalendarNote(date, text) {
  return apiClient.request("/calendar-notes", {
    method: "POST",
    body: JSON.stringify({ date, text }),
  });
}

async function deleteCalendarNote(id) {
  return apiClient.request("/calendar-notes/" + id, { method: "DELETE" });
}

// ==============================
// EVENT BUILDERS
// ==============================

function buildCheckEvents(checks = []) {
  const events = [];

  checks.forEach((c) => {
    if (!c?.dueDate) return;

    const dynamicColor = getDueColor(c.dueDate);

    events.push({
      id: "check-" + c.id,
      title: `Çek: ${c.amount} TL`,
      start: c.dueDate,
      allDay: true,
      color: dynamicColor,
      extendedProps: {
        type: "CHECK",
        data: c,
      },
    });
  });

  return events;
}

function buildNoteEvents(notesPortfolio = []) {
  const events = [];

  notesPortfolio.forEach((n) => {
    if (!n?.dueDate) return;

    const dynamicColor = getDueColor(n.dueDate);

    events.push({
      id: "note-" + n.id,
      title: `Senet: ${n.amount} TL`,
      start: n.dueDate,
      allDay: true,
      color: dynamicColor,
      extendedProps: {
        type: "SENET",
        data: n,
      },
    });
  });

  return events;
}

function buildLoanEvents(loans = []) {
  const events = [];

  loans.forEach((l) => {
    if (!l?.paymentDay) return;

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
        data: l,
      },
    });
  });

  return events;
}

function buildManualNoteEvents(calendarNotes = []) {
  const events = [];

  calendarNotes.forEach((n) => {
    if (!n?.date) return;

    events.push({
      id: "calendar-note-" + n.id,
      title: `Not: ${n.text}`,
      start: n.date,
      allDay: true,
      color: "#0f766e",
      extendedProps: {
        type: "NOTE",
        data: n,
      },
    });
  });

  return events;
}

// ==============================
// LOAD CALENDAR
// ==============================

async function loadCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  if (calendar) {
    calendar.destroy();
    calendar = null;
  }

  const events = [];

  let checks = [];
  let notesPortfolio = [];
  let loans = [];
  let calendarNotes = [];

  try {
    checks = await checkStore.fetchChecks();
  } catch (err) {
    console.error("Çekler takvime yüklenemedi:", err);
  }

  try {
    notesPortfolio = await noteStore.fetchPortfolioNotes();
  } catch (err) {
    console.error("Senetler takvime yüklenemedi:", err);
  }

  try {
    loans = await loanStore.fetchLoans();
  } catch (err) {
    console.error("Krediler takvime yüklenemedi:", err);
  }

  try {
    calendarNotes = await fetchCalendarNotes() || [];
  } catch (err) {
    console.error("Takvim notları yüklenemedi:", err);
  }

  events.push(...buildCheckEvents(checks));
  events.push(...buildNoteEvents(notesPortfolio));
  events.push(...buildLoanEvents(loans));
  events.push(...buildManualNoteEvents(calendarNotes));

  try {
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      displayEventTime: false,
      locale: "tr",
      height: 600,

      customButtons: {
        calendarTitle: { text: "Finans Takvimi" }
      },

      headerToolbar: {
        left: "calendarTitle",
        center: "title",
        right: "prev,next today",
      },

      buttonText: {
        today: "Bugün",
      },

      events,

      eventClick: function (info) {
        openEventModal(info.event);
      },

      dateClick: function (info) {
        const noteDate = document.getElementById("noteDate");
        const noteText = document.getElementById("noteText");

        if (noteDate) noteDate.value = info.dateStr;
        if (noteText) noteText.value = "";

        openModal("noteModal");
      },

      eventContent: function (arg) {
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
          html: `<div style="display:flex;align-items:center;font-size:12px;">${icon}${title}</div>`,
        };
      },
    });

    calendar.render();
  } catch (err) {
    console.error("Takvim render hatası:", err);
    showToast("Takvim yüklenemedi", "error");
  }
}

function refreshCalendar() {
  loadCalendar();
}

// ==============================
// EVENT MODAL
// ==============================

function openEventModal(event) {
  const data = event.extendedProps?.data || {};
  const type = event.extendedProps?.type || "";

  const modalTitle    = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalIcon     = document.getElementById("modalIcon");
  const modalDate     = document.getElementById("modalDate");
  const modalAmount   = document.getElementById("modalAmount");
  const modalType     = document.getElementById("modalType");
  const modalDesc     = document.getElementById("modalDesc");
  const modalStatus   = document.getElementById("modalStatus");

  if (!modalTitle || !modalSubtitle || !modalIcon || !modalDate || !modalDesc || !modalStatus) {
    console.error("Takvim modal elementleri eksik");
    return;
  }

  if (modalAmount?.parentElement) {
    modalAmount.parentElement.style.display = "flex";
  }
  if (modalType?.parentElement) {
    modalType.parentElement.style.display = "flex";
  }

  // NOT tipine özel silme butonu — her açılışta sıfırla
  const modalCard = document.querySelector("#eventModal .kasa-modal-card");
  const existingFooter = document.getElementById("eventModalFooter");
  if (existingFooter) existingFooter.remove();

  let typeText = "";
  if (type === "CHECK") typeText = "Çek";
  else if (type === "SENET") typeText = "Senet";
  else if (type === "LOAN") typeText = "Kredi";
  else if (type === "NOTE") typeText = "Not";

  modalDate.textContent = event.start
    ? new Date(event.start).toLocaleDateString("tr-TR")
    : "-";

  if (modalType) {
    modalType.textContent = typeText;
  }

  if (type === "CHECK") {
    modalTitle.textContent = "Çek Detayı";
    modalSubtitle.textContent = data.checkNo ? `Çek No: ${data.checkNo}` : "";
    modalIcon.innerHTML = '<i class="zmdi zmdi-money-box"></i>';

    if (modalAmount) modalAmount.textContent = formatMoney(data.amount) + " TL";
    modalDesc.textContent = data.description || "-";
    modalStatus.textContent = "Kasanda";
  } else if (type === "SENET") {
    modalTitle.textContent = "Senet Detayı";
    modalSubtitle.textContent = data.noteNo ? `Senet No: ${data.noteNo}` : "";
    modalIcon.innerHTML = '<i class="zmdi zmdi-assignment"></i>';

    if (modalAmount) modalAmount.textContent = formatMoney(data.amount) + " TL";
    modalDesc.textContent = data.description || "-";
    modalStatus.textContent = "Kasanda";
  } else if (type === "LOAN") {
    modalTitle.textContent = "Kredi Detayı";
    modalSubtitle.textContent = data.bankName || "";
    modalIcon.innerHTML = '<i class="zmdi zmdi-balance"></i>';

    if (modalAmount) modalAmount.textContent = formatMoney(data.monthlyPayment) + " TL";
    modalDesc.textContent = data.bankName || "-";
    modalStatus.textContent =
      data.remainingDebt != null
        ? "Kalan Borç: " + formatMoney(data.remainingDebt) + " TL"
        : "Aktif";
  } else if (type === "NOTE") {
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

    // Silme butonu ekle
    const footer = document.createElement("div");
    footer.id = "eventModalFooter";
    footer.className = "kasa-modal-footer";
    footer.innerHTML = `<button type="button" class="btn-delete" id="deleteCalendarNoteBtn">Notu Sil</button>`;
    modalCard.appendChild(footer);

    footer.querySelector("#deleteCalendarNoteBtn").addEventListener("click", async function () {
      try {
        await deleteCalendarNote(data.id);
        showToast("Not silindi", "success");
        closeModal("eventModal");
        refreshCalendar();
      } catch (err) {
        showToast(err.message || "Not silinemedi", "error");
      }
    });
  }

  openModal("eventModal");
}

// ==============================
// MODAL HELPERS
// ==============================

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

// ==============================
// EVENT LISTENERS
// ==============================

document.addEventListener("click", function (e) {
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

    saveNoteBtn.disabled = true;

    createCalendarNote(date, text)
      .then(() => {
        showToast("Takvim notu eklendi", "success");
        closeModal("noteModal");

        const scrollY = window.scrollY;
        refreshCalendar();
        setTimeout(() => window.scrollTo(0, scrollY), 50);
      })
      .catch((err) => {
        showToast(err.message || "Not kaydedilemedi", "error");
      })
      .finally(() => {
        saveNoteBtn.disabled = false;
      });

    return;
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeAllCalendarModals();
  }
});

window.loadCalendar    = loadCalendar;
window.refreshCalendar = refreshCalendar;
