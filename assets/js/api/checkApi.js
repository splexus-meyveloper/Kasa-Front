const checkApi = {
  getAll: () => apiClient.request("/checks/portfolio"),

  create: (data) =>
    apiClient.request("/checks/in", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

window.checkApi = checkApi;