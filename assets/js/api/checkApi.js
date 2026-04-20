const checkApi = {
  getAll: () => apiClient.request("/checks/portfolio"),

  create: (data) =>
    apiClient.request("/checks/in", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  collect: (data) =>
    apiClient.request("/checks/collect", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  endorse: (data) =>
    apiClient.request("/checks/endorse", {
      method: "POST",
      body: JSON.stringify(data),
    }),

    markAsPaid: (data) =>
  apiClient.request("/checks/paid", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

window.checkApi = checkApi;