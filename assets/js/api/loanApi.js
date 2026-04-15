const loanApi = {
  getAll: () => apiClient.request("/loans"),

  create: (data) =>
    apiClient.request("/loans", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  pay: (id) =>
    apiClient.request(`/loans/${id}/pay`, {
      method: "POST",
    }),
};

window.loanApi = loanApi;