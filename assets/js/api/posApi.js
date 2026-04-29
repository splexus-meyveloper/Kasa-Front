const posApi = {
  log: (data) =>
    apiClient.request("/pos/log", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getLogs: () => apiClient.request("/pos/logs"),
};
window.posApi = posApi;
