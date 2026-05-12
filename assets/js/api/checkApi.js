const checkApi = {

  getAll: () => apiClient.request("/checks/all"),

  getPortfolio: () => apiClient.request("/checks/portfolio"),

  create: (data) =>
    apiClient.request("/checks/in", { method: "POST", body: JSON.stringify(data) }),

  collect: (data) =>
    apiClient.request("/checks/collect", { method: "POST", body: JSON.stringify(data) }),

  endorse: (data) =>
    apiClient.request("/checks/endorse", { method: "POST", body: JSON.stringify(data) }),

  /** İade: tahsil/cirodan portföye geri al */
  returnToPortfolio: (data) =>
    apiClient.request("/checks/return", { method: "POST", body: JSON.stringify(data) }),

  /** Karşılıksız / Protestolu giriş */
  markAsBadDebt: (data) =>
    apiClient.request("/checks/bad-debt", { method: "POST", body: JSON.stringify(data) }),

  /** Karşılıksız/protestoludan çıkış */
  exitBadDebt: (data) =>
    apiClient.request("/checks/bad-debt/exit", { method: "POST", body: JSON.stringify(data) }),

  markAsPaid: (data) =>
    apiClient.request("/checks/paid", { method: "POST", body: JSON.stringify(data) }),
};

window.checkApi = checkApi;
