const authStore = {
  user: null,

  getToken() {
    return localStorage.getItem("token");
  },

  setToken(token) {
    localStorage.setItem("token", token);
  },

  logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  },
};

window.authStore = authStore;