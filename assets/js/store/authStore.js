const authStore = {
  getToken() {
    return sessionStorage.getItem("token");
  },

  getUsername() {
    return sessionStorage.getItem("username");
  },

  getRole() {
    return sessionStorage.getItem("role");
  },

  getPermissions() {
    try {
      return JSON.parse(sessionStorage.getItem("permissions") || "[]");
    } catch {
      return [];
    }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  setSession(data) {
    sessionStorage.setItem("token",       data.token       || "");
    sessionStorage.setItem("username",    data.username    || "");
    sessionStorage.setItem("role",        data.role        || "");
    sessionStorage.setItem("permissions", JSON.stringify(data.permissions || []));
    sessionStorage.setItem("branchType",  data.branchType  || "");
    sessionStorage.setItem("companyId",   data.companyId   != null ? String(data.companyId) : "");
    sessionStorage.setItem("companyName", data.companyName || "");
  },

  clearSession() {
    ["token", "username", "role", "permissions",
     "branchType", "companyId", "companyName"].forEach(k => sessionStorage.removeItem(k));
  },

  async login(credentials) {
    const data = await authApi.login(credentials);
    this.setSession(data);
    return data;
  },

  logout() {
    this.clearSession();
    window.location.href = "login.html";
  },
};

window.authStore = authStore;