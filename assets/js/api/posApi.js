const posApi = {
  log: (data) =>
    apiClient.request("/pos/log", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getLogs: () => apiClient.request("/pos/logs"),
  getTerminals: () => apiClient.request("/pos/terminals"),
  submitChangeRequest: (posLogId, data) =>
    apiClient.request(`/change-requests/pos/${posLogId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
window.posApi = posApi;
