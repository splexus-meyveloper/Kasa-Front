const cashStore = {
  transactions: [],

  async fetchTransactions() {
    this.transactions = await cashApi.getTransactions();
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