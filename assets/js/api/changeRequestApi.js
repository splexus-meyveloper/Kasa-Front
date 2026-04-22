const changeRequestApi = {

  getPending: () => {
    return apiClient.request("/change-requests/pending");
  },

  getById: async (id) => {
    const paths = [`/admin/change-requests/${id}`, `/change-requests/${id}`];
    for (const path of paths) {
      try {
        const data = await apiClient.request(path);
        if (data) return data;
      } catch (e) {
        console.warn("[changeRequestApi.getById] başarısız:", path, e?.message);
      }
    }
    return null;
  },

  approve: (id) => {
    return apiClient.request(`/change-requests/${id}/approve`, { method: "POST" });
  },

  reject: (id) => {
    return apiClient.request(`/change-requests/${id}/reject`, { method: "POST" });
  },

  // Tüm change-requestleri getir (admin) — birkaç olası endpoint dener
  getAll: async () => {
    const candidates = [
      "/admin/change-requests",
      "/change-requests/all",
      "/change-requests/history",
    ];
    for (const path of candidates) {
      try {
        const data = await apiClient.request(path);
        const list = Array.isArray(data) ? data
                   : Array.isArray(data?.content) ? data.content
                   : Array.isArray(data?.data)    ? data.data
                   : null;
        if (list !== null) {
          console.log("[changeRequestApi.getAll] başarılı endpoint:", path, "kayıt:", list.length);
          return list;
        }
      } catch (e) {
        console.warn("[changeRequestApi.getAll] denendi ama başarısız:", path, e?.message || e);
      }
    }
    return null; // hiçbiri çalışmadı
  }

};

window.changeRequestApi = changeRequestApi;
