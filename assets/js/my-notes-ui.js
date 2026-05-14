// ==============================
// NOTLARIM UI MODULE
// ==============================

let _allNotes     = [];
let _activeNoteId = null;
let _editMode     = false;
let _savedTitle   = "";
let _savedContent = "";

// ── Yardımcılar ──────────────────────────────────────────
function _fmtNoteDate(iso) {
  if (!iso) return "";
  const d   = new Date(iso);
  const now = new Date();
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const noteDay = new Date(d.getFullYear(),   d.getMonth(),   d.getDate());
  if (noteDay.getTime() === today.getTime())
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (d.getFullYear() === now.getFullYear())
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  return d.toLocaleDateString("tr-TR");
}

function _preview(content) {
  if (!content) return "İçerik yok";
  return content.replace(/\n+/g, " ").slice(0, 70);
}

// ── Element kısayolları ───────────────────────────────────
const _el = (id) => document.getElementById(id);

// ── Edit modu geçişi ──────────────────────────────────────
function _setEditMode(isEdit) {
  _editMode = isEdit;

  const titleInput   = _el("mnTitleInput");
  const contentInput = _el("mnContentInput");

  if (titleInput)   titleInput.readOnly   = !isEdit;
  if (contentInput) contentInput.readOnly = !isEdit;

  if (isEdit) {
    _show("mnSaveBtn");
    _hide("mnEditBtn");
    _activeNoteId ? _show("mnCancelBtn") : _hide("mnCancelBtn");
    _hide("mnDeleteBtn");
  } else {
    _show("mnEditBtn");
    _hide("mnSaveBtn");
    _hide("mnCancelBtn");
    _activeNoteId ? _show("mnDeleteBtn") : _hide("mnDeleteBtn");
  }
}

function _show(id) { const el = _el(id); if (el) el.style.display = "inline-flex"; }
function _hide(id) { const el = _el(id); if (el) el.style.display = "none"; }

function startEditNote() {
  _savedTitle   = _el("mnTitleInput")?.value   || "";
  _savedContent = _el("mnContentInput")?.value || "";
  _setEditMode(true);
  _el("mnTitleInput")?.focus();
}

function cancelEditNote() {
  const t = _el("mnTitleInput");
  const c = _el("mnContentInput");
  if (t) t.value = _savedTitle;
  if (c) c.value = _savedContent;
  _updateCharCount();
  _setEditMode(false);
}

// ── Liste ─────────────────────────────────────────────────
function _renderNotesList(notes) {
  const list = _el("notesList");
  if (!list) return;

  if (!notes || !notes.length) {
    list.innerHTML = `<div class="notes-empty">Henüz not yok.<br>Yeni not oluşturun.</div>`;
    return;
  }

  list.innerHTML = notes.map(n => `
    <div class="note-item ${n.id === _activeNoteId ? "active" : ""}"
         data-id="${n.id}"
         onclick="selectNote(${n.id})">
      <div class="note-item-title">${escapeHtml(n.title || "Başlıksız")}</div>
      <div class="note-item-bottom">
        <span class="note-item-date">${_fmtNoteDate(n.updatedAt)}</span>
        <span class="note-item-preview">${escapeHtml(_preview(n.content))}</span>
      </div>
    </div>
  `).join("");
}

async function _loadNotes() {
  try {
    const data = await myNotesApi.getAll();
    _allNotes  = Array.isArray(data) ? data : [];
    _renderNotesList(_allNotes);
  } catch (e) {
    showToast("Notlar yüklenemedi: " + (e.message || ""), "error");
    _allNotes = [];
    _renderNotesList([]);
  }
}

// ── Not seç (görüntüleme modu) ────────────────────────────
function selectNote(id) {
  _activeNoteId = id;
  const note = _allNotes.find(n => n.id === id);
  if (!note) return;

  const t = _el("mnTitleInput");
  const c = _el("mnContentInput");
  if (t) t.value = note.title   || "";
  if (c) c.value = note.content || "";
  _updateCharCount();
  _updateMeta(note.updatedAt);
  _showEditor();
  _setEditMode(false);

  document.querySelectorAll(".note-item").forEach(el => el.classList.remove("active"));
  document.querySelector(`.note-item[data-id="${id}"]`)?.classList.add("active");
  _showEditorMobile();
}

// ── Yeni not (düzenleme modu) ─────────────────────────────
function newNote() {
  _activeNoteId = null;
  _savedTitle   = "";
  _savedContent = "";

  const t = _el("mnTitleInput");
  const c = _el("mnContentInput");
  if (t) t.value = "";
  if (c) c.value = "";
  _updateCharCount();
  _updateMeta(null);
  _showEditor();
  _setEditMode(true);

  document.querySelectorAll(".note-item").forEach(el => el.classList.remove("active"));
  _showEditorMobile();
  setTimeout(() => _el("mnTitleInput")?.focus(), 50);
}

// ── Kaydet ────────────────────────────────────────────────
async function saveNote() {
  const title   = (_el("mnTitleInput")?.value   || "").trim();
  const content = (_el("mnContentInput")?.value || "").trim();

  if (!title) {
    showToast("Başlık boş olamaz", "error");
    _el("mnTitleInput")?.focus();
    return;
  }
  if (title.length > 120) {
    showToast("Başlık en fazla 120 karakter olabilir", "error");
    return;
  }
  if (!content) {
    showToast("İçerik boş olamaz", "error");
    _el("mnContentInput")?.focus();
    return;
  }
  if (content.length > 20000) {
    showToast("İçerik en fazla 20.000 karakter olabilir", "error");
    return;
  }

  const btn = _el("mnSaveBtn");
  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i> Kaydediliyor...'; }

    let saved;
    if (_activeNoteId) {
      saved = await myNotesApi.update(_activeNoteId, { title, content });
    } else {
      saved = await myNotesApi.create({ title, content });
      _activeNoteId = saved.id;
    }

    showToast("Not kaydedildi", "success");
    await _loadNotes();

    document.querySelectorAll(".note-item").forEach(el => el.classList.remove("active"));
    document.querySelector(`.note-item[data-id="${_activeNoteId}"]`)?.classList.add("active");
    _updateMeta(saved.updatedAt);
    _setEditMode(false);

  } catch (e) {
    showToast("Kaydedilemedi: " + (e.message || ""), "error");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="zmdi zmdi-check"></i> Kaydet'; }
  }
}

// ── Sil ───────────────────────────────────────────────────
function deleteNote() {
  if (!_activeNoteId) return;
  showConfirmToast("Bu not silinsin mi?", async () => {
    try {
      await myNotesApi.remove(_activeNoteId);
      showToast("Not silindi", "success");
      _activeNoteId = null;
      _editMode     = false;
      _hideEditor();
      await _loadNotes();
    } catch (e) {
      showToast("Silinemedi: " + (e.message || ""), "error");
    }
  });
}

// ── Editor göster/gizle ───────────────────────────────────
function _showEditor() {
  const noSel = _el("notesNoSelection");
  const inner = _el("notesEditorInner");
  if (noSel) noSel.style.display = "none";
  if (inner) inner.style.display = "flex";
}

function _hideEditor() {
  const noSel = _el("notesNoSelection");
  const inner = _el("notesEditorInner");
  if (noSel) noSel.style.display = "flex";
  if (inner) inner.style.display = "none";
}

function _showEditorMobile() {
  if (window.innerWidth >= 768) return;
  _el("notesPanel")?.classList.add("hidden-mobile");
  _el("notesEditorArea")?.classList.add("visible-mobile");
}

function showNotesList() {
  _el("notesPanel")?.classList.remove("hidden-mobile");
  _el("notesEditorArea")?.classList.remove("visible-mobile");
}

// ── Meta & char count ─────────────────────────────────────
function _updateMeta(updatedAt) {
  const meta = _el("mnEditorMeta");
  if (!meta) return;
  meta.textContent = updatedAt ? `Son güncelleme: ${_fmtNoteDate(updatedAt)}` : "Yeni not";
}

function _updateCharCount() {
  const len = _el("mnContentInput")?.value?.length || 0;
  const el  = _el("mnCharCount");
  if (!el) return;
  el.textContent = `${len.toLocaleString("tr-TR")} / 20.000`;
  el.style.color = len > 19000 ? "#ef4444" : len > 17000 ? "#f59e0b" : "";
}

// ── Arama ─────────────────────────────────────────────────
function _initNotesSearch() {
  const input = _el("notesSearchInput");
  if (!input) return;
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    _renderNotesList(q
      ? _allNotes.filter(n =>
          (n.title || "").toLowerCase().includes(q) ||
          (n.content || "").toLowerCase().includes(q))
      : _allNotes
    );
  });
}

// ── INIT ──────────────────────────────────────────────────
async function initMyNotesPage() {
  _activeNoteId = null;
  _editMode     = false;
  _allNotes     = [];
  _hideEditor();
  await _loadNotes();
  _initNotesSearch();
  _el("mnContentInput")?.addEventListener("input", _updateCharCount);
}

// ── Exports ───────────────────────────────────────────────
window.initMyNotesPage = initMyNotesPage;
window.selectNote      = selectNote;
window.newNote         = newNote;
window.saveNote        = saveNote;
window.deleteNote      = deleteNote;
window.showNotesList   = showNotesList;
window.startEditNote   = startEditNote;
window.cancelEditNote  = cancelEditNote;
