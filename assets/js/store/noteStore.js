const noteStore = {
  notes: [],

  async fetchNotes() {
    this.notes = await noteApi.getAll();
    return this.notes;
  },

  async fetchPortfolioNotes() {
    this.notes = await noteApi.getPortfolio();
    return this.notes;
  },

  async createNote(data) {
    return await noteApi.create(data);
  },

  removeNote(id) {
    this.notes = this.notes.filter(n => String(n.id) !== String(id));
  }
};

window.noteStore = noteStore;
