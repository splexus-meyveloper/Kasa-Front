const expenseStore = {

  async addExpense(data) {
    return await expenseApi.create(data);
  }

};

window.expenseStore = expenseStore;