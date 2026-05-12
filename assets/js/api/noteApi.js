const noteApi = {

  getAll: () => apiClient.request("/notes/all"),

  getPortfolio: () => apiClient.request("/notes/portfolio"),

  create: (data) =>
    apiClient.request("/notes/in", { method: "POST", body: JSON.stringify(data) }),

  collect: (data) =>
    apiClient.request("/notes/collect", { method: "POST", body: JSON.stringify(data) }),

  endorse: (data) =>
    apiClient.request("/notes/endorse", { method: "POST", body: JSON.stringify(data) }),

  /** İade: tahsil/cirodan portföye geri al */
  returnToPortfolio: (data) =>
    apiClient.request("/notes/return", { method: "POST", body: JSON.stringify(data) }),

  /** Protestolu giriş */
  markAsBadDebt: (data) =>
    apiClient.request("/notes/protested", { method: "POST", body: JSON.stringify(data) }),

  /** Protestoludan çıkış */
  exitBadDebt: (data) =>
    apiClient.request("/notes/protested/exit", { method: "POST", body: JSON.stringify(data) }),
};

window.noteApi = noteApi;
