const myNotesApi = {
  getAll:  ()       => apiClient.request("/my-notes"),
  getOne:  (id)     => apiClient.request(`/my-notes/${id}`),
  create:  (data)   => apiClient.request("/my-notes", { method: "POST", body: JSON.stringify(data) }),
  update:  (id, d)  => apiClient.request(`/my-notes/${id}`, { method: "PUT",  body: JSON.stringify(d) }),
  remove:  (id)     => apiClient.request(`/my-notes/${id}`, { method: "DELETE" }),
};

window.myNotesApi = myNotesApi;
