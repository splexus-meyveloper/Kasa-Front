async function addExpense() {
  const typeEl = document.getElementById("expenseType");
  const tutarEl = document.getElementById("tutar");
  const descEl = document.getElementById("description");

  if (!typeEl || !tutarEl || !descEl) {
    showToast("Form alanları bulunamadı", "error");
    return;
  }

  const payload = {
    expenseType: typeEl.value?.toUpperCase(),
    amount: parseMoney(tutarEl.value),
    description: descEl.value?.trim()
  };

  console.log("EXPENSE PAYLOAD:", payload);

  try {
    await expenseStore.addExpense(payload);

    showToast("Masraf eklendi", "success");

    setTimeout(() => {
      loadPage("dashboard.html");
    }, 1200);

  } catch (e) {
    console.error("EXPENSE ERROR:", e);
    showToast("Masraf eklenemedi: " + e.message, "error");
  }
}

window.addExpense = addExpense;

document.addEventListener("click", function (e) {
  const btn = e.target.closest("#expenseSaveBtn");
  if (btn) {
    e.preventDefault();
    addExpense();
  }
});