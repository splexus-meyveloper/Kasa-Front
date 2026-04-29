const myActivityApi = {

  getAll: () => apiClient.request("/my-activities"),

  getFiltered: (params = {}) => {
    const q = new URLSearchParams();
    if (params.action)    q.set("action",    params.action);
    if (params.startDate) q.set("startDate", params.startDate);
    if (params.endDate)   q.set("endDate",   params.endDate);
    if (params.page  != null) q.set("page",  params.page);
    if (params.size  != null) q.set("size",  params.size);
    const qs = q.toString();
    return apiClient.request("/my-activities" + (qs ? "?" + qs : ""));
  },

  getPdf: (params = {}) => {
    const q = new URLSearchParams();
    if (params.action)    q.set("action",    params.action);
    if (params.startDate) q.set("startDate", params.startDate);
    if (params.endDate)   q.set("endDate",   params.endDate);
    const qs = q.toString();
    const token = sessionStorage.getItem("token");
    return fetch(
      API_BASE + "/my-activities/pdf" + (qs ? "?" + qs : ""),
      { headers: { Authorization: "Bearer " + token } }
    );
  },

  submitUpdateRequest: (entityId, entityType, data) => {
    const typeMap = {
      CASH_INCOME: "cash",
      CASH_EXPENSE: "cash",
      CHECK_IN: "check",
      CHECK_COLLECT: "check",
      NOTE_IN: "note",
      NOTE_COLLECT: "note",
      LOAN_CREATE: "loan",
    };
    const segment = typeMap[entityType] || "cash";
    return apiClient.request(`/change-requests/${segment}/${entityId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

};

window.myActivityApi = myActivityApi;
