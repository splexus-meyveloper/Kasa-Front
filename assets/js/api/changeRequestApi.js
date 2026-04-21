const changeRequestApi = {

  getPending: () => {
    console.log("[changeRequestApi.getPending] GET /change-requests/pending");
    return apiClient.request("/change-requests/pending");
  },

  approve: (id) => {
    console.log("[changeRequestApi.approve] POST /change-requests/" + id + "/approve");
    return apiClient.request(`/change-requests/${id}/approve`, { method: "POST" });
  },

  reject: (id) => {
    console.log("[changeRequestApi.reject] POST /change-requests/" + id + "/reject");
    return apiClient.request(`/change-requests/${id}/reject`, { method: "POST" });
  }

};

window.changeRequestApi = changeRequestApi;
