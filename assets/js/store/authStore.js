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
    sessionStorage.setItem("token", data.token || "");
    sessionStorage.setItem("username", data.username || "");
    sessionStorage.setItem("role", data.role || "");
    sessionStorage.setItem(
      "permissions",
      JSON.stringify(data.permissions || [])
    );
  },

  clearSession() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("permissions");
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