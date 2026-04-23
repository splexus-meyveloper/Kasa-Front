const checkStore = {
  checks: [],

  async fetchChecks() {
    this.checks = await checkApi.getAll();
    return this.checks;
  },

  async createCheck(data) {
    await checkApi.create(data);
    return this.fetchChecks();
  },

  removeCheck(id) {
    this.checks = this.checks.filter(c => String(c.id) !== String(id));
  },

  patchCheck(id, data) {
    const idx = this.checks.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) this.checks[idx] = { ...this.checks[idx], ...data };
  }
};

window.checkStore = checkStore;
