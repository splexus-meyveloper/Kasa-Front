const bankaApi = {
  getHesaplar: () => apiClient.request("/banka/hesaplar"),
  getHesap: (id) => apiClient.request(`/banka/hesaplar/${id}`),
  createHesap: (data) => apiClient.request("/banka/hesaplar", { method: "POST", body: JSON.stringify(data) }),
  deleteHesap: (id) => apiClient.request(`/banka/hesaplar/${id}`, { method: "DELETE" }),
  excelYukle: (hesapId, file) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.request(`/banka/hesaplar/${hesapId}/excel`, { method: "POST", body: form });
  },
  getIslemler: (hesapId, page = 0, size = 50) =>
    apiClient.request(`/banka/hesaplar/${hesapId}/islemler?page=${page}&size=${size}`),
  deleteIslem: (hesapId, islemId) =>
    apiClient.request(`/banka/hesaplar/${hesapId}/islemler/${islemId}`, { method: "DELETE" }),
  getIslemKodlari: () => apiClient.request("/banka/islem-kodlari"),
  createIslemKodu: (data) => apiClient.request("/banka/islem-kodlari", { method: "POST", body: JSON.stringify(data) }),
  deleteIslemKodu: (id)  => apiClient.request(`/banka/islem-kodlari/${id}`, { method: "DELETE" }),
};

window.bankaApi = bankaApi;
