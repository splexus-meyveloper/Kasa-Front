const myActivityStore = {

  activities: [],

  async load() {
    try {
      const data = await myActivityApi.getAll();
      this.activities = data || [];
      return this.activities;
    } catch (err) {
      console.error("MyActivity load error:", err);
      return [];
    }
  }

};

window.myActivityStore = myActivityStore;