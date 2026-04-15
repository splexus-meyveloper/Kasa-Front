const adminApi = {
  getProfiles: () => apiClient.request("/admin/profiles"),

  deactivateUser: (id) =>
    apiClient.request(`/admin/users/${id}`, {
      method: "DELETE",
    }),

  updateUserRole: (id, role) =>
    apiClient.request(`/admin/users/${id}/role?role=${encodeURIComponent(role)}`, {
      method: "PUT",
    }),

  getUserPermissions: (userId) =>
    apiClient.request(`/admin/users/${userId}/permissions`),

  setUserPermissions: (userId, permissions) =>
    apiClient.request(`/admin/users/${userId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    }),
};

window.adminApi = adminApi;