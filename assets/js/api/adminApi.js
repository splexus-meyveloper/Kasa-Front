const adminApi = {
  getUsers: () => apiClient.request("/admin/users"),

  createUser: (data) =>
    apiClient.request("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
window.adminApi = adminApi;