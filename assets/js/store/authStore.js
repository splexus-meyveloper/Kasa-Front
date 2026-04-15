const authStore = {
  getToken() {
    return localStorage.getItem("token");
  },

  getUsername() {
    return localStorage.getItem("username");
  },

  getRole() {
    return localStorage.getItem("role");
  },

  getPermissions() {
    try {
      return JSON.parse(localStorage.getItem("permissions") || "[]");
    } catch {
      return [];
    }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  setSession(data) {
    localStorage.setItem("token", data.token || "");
    localStorage.setItem("username", data.username || "");
    localStorage.setItem("role", data.role || "");
    localStorage.setItem(
      "permissions",
      JSON.stringify(data.permissions || [])
    );
  },

  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
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