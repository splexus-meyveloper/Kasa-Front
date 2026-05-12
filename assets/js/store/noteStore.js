const noteStore = {
  notes: [],

  async fetchNotes() {
    this.notes = await noteApi.getAll();
    return this.notes;
  },

  async fetchPortfolioNotes() {
    return await noteApi.getPortfolio();
  },

  async createNote(data) {
    return await noteApi.create(data);
  },

  removeNote(id) {
    this.notes = this.notes.filter(n => String(n.id) !== String(id));
  },

  patchNote(id, data) {
    const idx = this.notes.findIndex(n => String(n.id) === String(id));
    if (idx !== -1) this.notes[idx] = { ...this.notes[idx], ...data };
  }
};

window.noteStore = noteStore;
