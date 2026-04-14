const dashboardStore = {
  summary: null,
  chart: null,

  async fetchSummary(userId = null) {
    this.summary = await dashboardApi.getSummary(userId);
    return this.summary;
  },

  async fetchChart(userId = null) {
    this.chart = await dashboardApi.getChart(userId);
    return this.chart;
  }
};

window.dashboardStore = dashboardStore;