const checkStore = {
  checks: [],

  async fetchChecks() {
    this.checks = await checkApi.getAll(); // bu endpoint doğru olmalı
    return this.checks;
  },

  async createCheck(data) {
    await checkApi.create(data);
    return this.fetchChecks();
  }
};

window.checkStore = checkStore;