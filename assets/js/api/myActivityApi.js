const myActivityApi = {

  getAll: () => apiClient.request("/my-activities"),

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
