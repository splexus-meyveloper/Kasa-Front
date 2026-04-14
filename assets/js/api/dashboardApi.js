const dashboardApi = {
  getSummary: (userId = null) => {
    const query = userId ? `?userId=${userId}` : "";
    return apiClient.request(`/dashboard${query}`);
  },

  getChart: (userId = null) => {
    const query = userId ? `?userId=${userId}` : "";
    return apiClient.request(`/dashboard/chart${query}`);
  }
};

window.dashboardApi = dashboardApi;