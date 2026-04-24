const cashStore = {
  transactions: [],
  pagination: { page: 0, size: 50, totalElements: 0, totalPages: 1 },

  async fetchTransactions(page = 0, size = 50) {
    const res = await cashApi.getTransactions(page, size);
    this.transactions = Array.isArray(res) ? res : (res.content || []);
    if (!Array.isArray(res)) {
      this.pagination = {
        page:          res.page          ?? 0,
        size:          res.size          ?? size,
        totalElements: res.totalElements ?? 0,
        totalPages:    res.totalPages    ?? 1,
      };
    }
    return this.transactions;
  },

  async addIncome(data) {
    await cashApi.addIncome(data);
    return this.fetchTransactions();
  },

  async addExpense(data) {
    await cashApi.addExpense(data);
    return this.fetchTransactions();
  },
};

window.cashStore = cashStore;