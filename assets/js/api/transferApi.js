const transferApi = {

  // Adapazarı: transfer oluştur
  create: (data) =>
    apiClient.request("/transfers", { method: "POST", body: JSON.stringify(data) }),

  // Admin: onayla
  approve: (transferId) =>
    apiClient.request("/transfers/approve", {
      method: "POST",
      body: JSON.stringify({ transferId })
    }),

  // Admin: reddet
  reject: (transferId, rejectReason) =>
    apiClient.request("/transfers/reject", {
      method: "POST",
      body: JSON.stringify({ transferId, rejectReason })
    }),

  // Kendi şubenin transferleri
  getMy: () => apiClient.request("/transfers/my"),

  // Admin: bekleyen transferler
  getPending: () => apiClient.request("/transfers/pending"),

  // Admin: tüm transferler
  getAll: () => apiClient.request("/transfers/all"),
};

window.transferApi = transferApi;
