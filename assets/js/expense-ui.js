function toggleAracPlaka() {
  const typeEl = document.getElementById("expenseType");
  const wrapper = document.getElementById("aracPlakaWrapper");
  if (wrapper) {
    wrapper.style.display = typeEl?.value === "ARAC_GIDERLERI" ? "" : "none";
  }
}

function updatePaymentMethodHelp() {
  const method = document.getElementById("paymentMethod")?.value || "";
  const helpEl = document.getElementById("paymentMethodHelp");
  if (!helpEl) return;

  helpEl.textContent = !method
    ? "Ödeme yöntemini seçiniz."
    : method === "CREDIT_CARD"
      ? "Kredi kartı ile ödenen masraflar kasaya yansımaz."
      : "Nakit masraflar kasaya gider olarak yansır.";
  helpEl.style.color = method === "CREDIT_CARD" ? "#f59e0b" : "#64748b";
}

const EXPENSE_TYPE_LABELS = {
  ELEKTRIK: "ELEKTRİK",
  SU: "SU",
  ILETISIM: "İLETİŞİM",
  KARGO_NAKLIYE: "KARGO-NAKLİYE",
  ARAC_GIDERLERI: "ARAÇ GİDERLERİ",
  IS_YERI: "İŞ YERİ",
  ATOLYE: "ATÖLYE",
  YEMEK: "YEMEK",
  MARKET: "MARKET",
  KIRTASIYE: "KIRTASİYE",
  SEYAHAT: "SEYAHAT",
  NILUFERKOY: "NİLÜFERKÖY",
  ORTAK_GIDER: "ORTAK GİDER",
  ALI_ALTIKARDESLER: "ALİ ALTIKARDEŞLER",
  ATINC_ALTIKARDESLER: "ATINÇ ALTIKARDEŞLER",
  KIVANC_ALTIKARDESLER: "KIVANÇ ALTIKARDEŞLER",
  PERVIN_ALTIKARDESLER: "PERVİN ALTIKARDEŞLER",
  VERGI_ODEMESI: "Vergi Ödemesi",
  KIRA: "Kira",
  CEZA: "CEZA",
  YAKIT: "YAKIT",
  DIGER: "DİĞER",
};

const PAYMENT_METHOD_LABELS = {
  CASH: "Nakit",
  CREDIT_CARD: "Kredi Kartı",
};

const _PLATE_REGEX = /^\d{2}\s*[A-ZÇĞİÖŞÜa-zçğışöşü]{1,3}\s*\d{2,4}$/;

async function addExpense() {
  const typeEl    = document.getElementById("expenseType");
  const paymentEl = document.getElementById("paymentMethod");
  const tutarEl   = document.getElementById("tutar");
  const descEl    = document.getElementById("description");

  if (!typeEl || !paymentEl || !tutarEl || !descEl) {
    showToast("Form alanları bulunamadı", "error");
    return;
  }

  if (!typeEl.value) {
    showToast("Masraf türü seçiniz", "error");
    return;
  }

  if (!paymentEl.value) {
    showToast("Ödeme yöntemi seçiniz", "error");
    return;
  }

  const description = descEl.value?.trim() || "";
  let plaka = null;

  if (typeEl.value === "ARAC_GIDERLERI") {
    if (!description) {
      showToast("Araç gideri için açıklama zorunludur (örn: Yağ değişimi)", "error");
      descEl.focus();
      return;
    }
    if (_PLATE_REGEX.test(description)) {
      showToast("Açıklama alanına plaka yazmayın, işlem türünü yazın (örn: Yağ değişimi)", "error");
      descEl.focus();
      return;
    }
    const plakaEl = document.getElementById("aracPlaka");
    plaka = plakaEl?.value?.trim() || null;
  }

  const payload = {
    expenseType:   typeEl.value,
    paymentMethod: paymentEl.value,
    amount:        parseMoney(tutarEl.value),
    description,
  };

  if (plaka) payload.plaka = plaka;

  const btn = document.getElementById("expenseSaveBtn");
  try {
    await withLoadingBtn(btn, async () => {
      await expenseStore.addExpense(payload);
      showToast("Masraf eklendi", "success");
      _resetExpenseForm();
      setTimeout(() => loadPage("dashboard.html"), 1200);
    });
  } catch (e) {
    console.error("EXPENSE ERROR:", e);
    showToast("Masraf eklenemedi: " + e.message, "error");
  }
}

function _resetExpenseForm() {
  const typeEl = document.getElementById("expenseType");
  const paymentEl = document.getElementById("paymentMethod");
  const tutarEl = document.getElementById("tutar");
  const descEl = document.getElementById("description");
  const plakaEl = document.getElementById("aracPlaka");

  if (typeEl) typeEl.value = "";
  if (paymentEl) paymentEl.value = "";
  if (tutarEl) tutarEl.value = "";
  if (descEl) descEl.value = "";
  if (plakaEl) plakaEl.value = "";
  toggleAracPlaka();
  updatePaymentMethodHelp();
}

function _expenseFilters() {
  return {
    expenseType: document.getElementById("expenseFilterType")?.value || "",
    paymentMethod: document.getElementById("expenseFilterPaymentMethod")?.value || "",
    startDate: document.getElementById("expenseFilterStartDate")?.value || "",
    endDate: document.getElementById("expenseFilterEndDate")?.value || "",
  };
}

function _pickExpenseDate(item) {
  const value = item.expenseDate || item.date || item.createdAt || "";
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d) ? String(value) : d.toLocaleDateString("tr-TR");
}

function _renderExpenses(list) {
  const tbody = document.getElementById("expenseListBody");
  const countEl = document.getElementById("expenseListCount");
  if (!tbody) return;

  if (countEl) countEl.textContent = `${list.length} kayıt`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:30px">Masraf kaydı bulunamadı</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const method = item.paymentMethod || "CASH";
    const isCredit = method === "CREDIT_CARD";
    return `
      <tr>
        <td style="white-space:nowrap">${escapeHtml(_pickExpenseDate(item))}</td>
        <td>${escapeHtml(EXPENSE_TYPE_LABELS[item.expenseType] || item.expenseType || "-")}</td>
        <td>
          <span class="badge" style="background:${isCredit ? "#f59e0b" : "#22c55e"};color:#fff">
            ${escapeHtml(PAYMENT_METHOD_LABELS[method] || method)}
          </span>
        </td>
        <td>${escapeHtml(item.description || "-")}</td>
        <td class="text-end" style="font-weight:700;color:#ef4444">${formatMoney(item.amount ?? 0)} TL</td>
      </tr>`;
  }).join("");
}

async function loadExpenses() {
  const tbody = document.getElementById("expenseListBody");
  if (!tbody) return;

  const filters = _expenseFilters();
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    showToast("Başlangıç tarihi bitiş tarihinden büyük olamaz", "error");
    return;
  }

  tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:30px">Yükleniyor...</td></tr>`;

  try {
    const result = await expenseStore.listExpenses(filters);
    const list = result?.content || result?.expenses || (Array.isArray(result) ? result : []);
    _renderExpenses(list);
  } catch (e) {
    const msg = e?.message || "Masraflar yüklenemedi";
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:#ef4444;padding:30px">${escapeHtml(msg)}</td></tr>`;
    showToast(msg, "error");
  }
}

function clearExpenseFilters() {
  ["expenseFilterType","expenseFilterPaymentMethod","expenseFilterStartDate","expenseFilterEndDate"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  loadExpenses();
}

function initExpensePage() {
  updatePaymentMethodHelp();
  loadExpenses();
}

window.addExpense    = addExpense;
window.toggleAracPlaka = toggleAracPlaka;
window.initExpensePage = initExpensePage;

document.addEventListener("click", function (e) {
  const btn = e.target.closest("#expenseSaveBtn");
  if (btn) {
    e.preventDefault();
    addExpense();
    return;
  }

  if (e.target.closest("#expenseFilterBtn")) {
    e.preventDefault();
    loadExpenses();
    return;
  }

  if (e.target.closest("#expenseFilterClearBtn")) {
    e.preventDefault();
    clearExpenseFilters();
  }
});

document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "paymentMethod") {
    updatePaymentMethodHelp();
  }
});
