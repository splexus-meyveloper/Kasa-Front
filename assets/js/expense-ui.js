function toggleAracPlaka() {
  const typeEl = document.getElementById("expenseType");
  const wrapper = document.getElementById("aracPlakaWrapper");
  if (wrapper) {
    wrapper.style.display = typeEl?.value === "ARAC_GIDERLERI" ? "" : "none";
  }
}

async function addExpense() {
  const typeEl  = document.getElementById("expenseType");
  const tutarEl = document.getElementById("tutar");
  const descEl  = document.getElementById("description");

  if (!typeEl || !tutarEl || !descEl) {
    showToast("Form alanları bulunamadı", "error");
    return;
  }

  if (!typeEl.value) {
    showToast("Masraf türü seçiniz", "error");
    return;
  }

  const payload = {
    expenseType: typeEl.value,
    amount:      parseMoney(tutarEl.value),
    description: descEl.value?.trim(),
  };

  if (typeEl.value === "ARAC_GIDERLERI") {
    const plakaEl = document.getElementById("aracPlaka");
    if (plakaEl?.value) payload.aracPlaka = plakaEl.value;
  }

  try {
    await expenseStore.addExpense(payload);
    showToast("Masraf eklendi", "success");
    setTimeout(() => loadPage("dashboard.html"), 1200);
  } catch (e) {
    console.error("EXPENSE ERROR:", e);
    showToast("Masraf eklenemedi: " + e.message, "error");
  }
}

window.addExpense    = addExpense;
window.toggleAracPlaka = toggleAracPlaka;

document.addEventListener("click", function (e) {
  const btn = e.target.closest("#expenseSaveBtn");
  if (btn) {
    e.preventDefault();
    addExpense();
  }
});
