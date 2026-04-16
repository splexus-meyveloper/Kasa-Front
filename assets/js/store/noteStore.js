const noteStore = {

  async fetchNotes() {
    return await noteApi.getAll();
  },

  async fetchPortfolioNotes() {
    return await noteApi.getPortfolio();
  },

  async createNote(data) {
    return await noteApi.create(data);
  },

  async collectNote(data) {
    return await noteApi.collect(data);
  },

  async endorseNote(data) {
    return await noteApi.endorse(data);
  }

};

window.noteStore = noteStore;