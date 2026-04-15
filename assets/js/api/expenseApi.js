const expenseApi = {
  create: (data) =>
    apiClient.request("/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

window.expenseApi = expenseApi;