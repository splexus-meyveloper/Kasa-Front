const noteApi = {
  getAll: () => apiClient.request("/notes/portfolio"),

  getPortfolio: () => apiClient.request("/notes/portfolio"),

  create: (data) =>
    apiClient.request("/notes/in", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  collect: (data) =>
    apiClient.request("/notes/collect", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  endorse: (data) =>
    apiClient.request("/notes/endorse", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

window.noteApi = noteApi;