const expenseApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const query = params.toString();
    return apiClient.request(`/expenses${query ? "?" + query : ""}`);
  },
  create: (data) =>
    apiClient.request("/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

window.expenseApi = expenseApi;
