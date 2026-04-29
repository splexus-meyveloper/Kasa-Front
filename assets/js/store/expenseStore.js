const expenseStore = {

  async listExpenses(filters = {}) {
    return await expenseApi.list(filters);
  },

  async addExpense(data) {
    return await expenseApi.create(data);
  }

};

window.expenseStore = expenseStore;
