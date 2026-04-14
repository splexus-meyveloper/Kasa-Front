const cashApi = {

  getTransactions: () =>
    apiClient.request("/cash/transactions"),

  addIncome: (data) =>
    apiClient.request("/cash/income", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  addExpense: (data) =>
    apiClient.request("/cash/expense", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

window.cashApi = cashApi;