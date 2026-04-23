// ==============================
// WEBSOCKET CLIENT
// ==============================
// Bağlantı kesilirse uygulama normal çalışmaya devam eder.
// Mesaj gelince ilgili modül otomatik refresh olur.

const wsClient = {
  _stomp: null,
  _companyId: null,

  _getCompanyId() {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.companyId || null;
    } catch {
      return null;
    }
  },

  connect() {
    if (this._stomp) return;

    this._companyId = this._getCompanyId();
    if (!this._companyId) return;

    const token = sessionStorage.getItem("token");
    if (!token) return;

    const baseUrl = API_BASE.replace(/\/api$/, "");

    this._stomp = new StompJs.Client({
      webSocketFactory: () => new SockJS(baseUrl + "/ws"),
      connectHeaders: { Authorization: "Bearer " + token },
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => this._subscribe(),
      onStompError: () => {},
      onWebSocketError: () => {},
      onDisconnect: () => {}
    });

    this._stomp.activate();
  },

  _subscribe() {
    this._stomp.subscribe(
      "/topic/company-" + this._companyId,
      (msg) => {
        try {
          this._handleEvent(JSON.parse(msg.body));
        } catch {}
      }
    );
  },

  _handleEvent(event) {
    const m = event.module;

    if (m === "KASA") {
      window.loadCashTransactions?.();
      window.initDashboard?.();
    } else if (m === "CEK") {
      window.loadChecks?.({ silent: true });
      window.loadCheckSummary?.();
    } else if (m === "SENET") {
      window.loadNotes?.({ silent: true });
      window.loadNotesDashboard?.();
    } else if (m === "KREDI") {
      window.loadLoans?.();
      window.initDashboard?.();
    } else if (m === "MASRAF") {
      window.loadExpenses?.();
      window.initDashboard?.();
    }

    window.loadHeaderNotifications?.();
  },

  disconnect() {
    this._stomp?.deactivate();
    this._stomp = null;
  }
};

window.wsClient = wsClient;
