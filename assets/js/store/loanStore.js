const loanStore = {
  loans: [],

  async fetchLoans() {
    const data = await apiClient.request("/loans");
    this.loans = Array.isArray(data) ? data : [];
    return this.loans;
  },

  async createLoan(data) {
    await loanApi.create(data);
    return this.fetchLoans();
  },

  async payLoan(id) {
    await loanApi.pay(id);
    return this.fetchLoans();
  },
};

window.loanStore = loanStore;