const cashApi = {

  getTransactions: (page = 0, size = 50) =>
    apiClient.request(`/cash/transactions?page=${page}&size=${size}`),

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