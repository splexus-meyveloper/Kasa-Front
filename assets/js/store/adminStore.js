const adminStore = {
  profiles: [],

  async fetchProfiles() {
    const data = await adminApi.getProfiles();
    this.profiles = Array.isArray(data)
      ? data
      : (Array.isArray(data?.content) ? data.content : []);
    return this.profiles;
  },

  async updateUserRole(userId, role) {
    return await adminApi.updateUserRole(userId, role);
  },

  async deleteUser(userId) {
    return await adminApi.deactivateUser(userId);
  },

  async fetchUserPermissions(userId) {
    return await adminApi.getUserPermissions(userId);
  },

  async setUserPermissions(userId, permissions) {
    return await adminApi.setUserPermissions(userId, permissions);
  },

  // 🔥 BUNU EKLE
  async updateUserPermissions(userId, permissions) {
    return await this.setUserPermissions(userId, permissions);
  },

  async createUser(data) {
  return await adminApi.createUser(data);
  }
};

window.adminStore = adminStore;