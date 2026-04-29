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

  const baseDesc = descEl.value?.trim() || "";
  let description = baseDesc;
  let aracPlaka   = null;

  if (typeEl.value === "ARAC_GIDERLERI") {
    const plakaEl = document.getElementById("aracPlaka");
    aracPlaka = plakaEl?.value || null;
    // Plakayı açıklamaya da ekle — backend DTO'da alan yoksa kayıt yine de anlamlı olsun
    if (aracPlaka) {
      description = aracPlaka + (baseDesc ? " — " + baseDesc : "");
    }
  }

  const payload = {
    expenseType: typeEl.value,
    amount:      parseMoney(tutarEl.value),
    description,
  };

  if (aracPlaka) payload.aracPlaka = aracPlaka;

  try {
    await expenseStore.addExpense(payload);
    showToast("Masraf eklendi", "success");
    setTimeout(() => loadPage("dashboard.html"), 1200);
  } catch (e) {
    console.error("EXPENSE ERROR:", e);
    // Backend aracPlaka alanını tanımıyorsa field olmadan tekrar dene
    if (aracPlaka && e.message && (e.message.includes("500") || e.message.toLowerCase().includes("hata"))) {
      try {
        const fallback = { expenseType: payload.expenseType, amount: payload.amount, description: payload.description };
        await expenseStore.addExpense(fallback);
        showToast("Masraf eklendi", "success");
        setTimeout(() => loadPage("dashboard.html"), 1200);
        return;
      } catch (e2) {
        showToast("Masraf eklenemedi: " + e2.message, "error");
        return;
      }
    }
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
