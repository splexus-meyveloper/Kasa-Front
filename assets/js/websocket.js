// ==============================
// WEBSOCKET CLIENT
// ==============================

const MAX_RECONNECT = 5;

const wsClient = {
  _stomp:             null,
  _companyId:         null,
  _reconnectAttempts: 0,

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

  getCurrentPage() {
    return window.currentPage || "";
  },

  connect() {
    if (this._stomp) return;

    this._companyId = this._getCompanyId();
    if (!this._companyId) return;

    const token = sessionStorage.getItem("token");
    if (!token) return;

    const baseUrl = API_BASE.replace(/\/api$/, "");

    this._stomp = new StompJs.Client({
      webSocketFactory:  () => new SockJS(baseUrl + "/ws"),
      connectHeaders:    { Authorization: "Bearer " + token },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay:    0,
      debug: () => {},

      onConnect: () => {
        this._reconnectAttempts = 0;
        this._subscribe();
      },

      onStompError: () => this._scheduleReconnect(),
      onWebSocketError: () => this._scheduleReconnect(),
      onDisconnect: () => {}
    });

    this._stomp.activate();
  },

  _scheduleReconnect() {
    if (this._reconnectAttempts >= MAX_RECONNECT) return;
    this._reconnectAttempts++;
    setTimeout(() => {
      this._stomp = null;
      this.connect();
    }, 3000 * this._reconnectAttempts);
  },

  _subscribe() {
    this._stomp.subscribe(
      "/topic/company-" + this._companyId,
      (msg) => {
        try { this._handleEvent(JSON.parse(msg.body)); } catch {}
      }
    );
  },

  _handleEvent(event) {
    const m    = event.module;
    const page = this.getCurrentPage();

    if (m === "KASA") {
        if (page.includes("kasa")) {
            window.loadCashTransactions?.();
        }
        // Dashboard her zaman yenile
        if (page.includes("dashboard")) {
            loadPage("dashboard.html");
        }

    } else if (m === "CEK") {
        if (page.includes("cek")) window.loadChecks?.({ silent: true });
        if (page.includes("dashboard")) loadPage("dashboard.html");
        window.loadCheckSummary?.();

    } else if (m === "SENET") {
        if (page.includes("senet")) window.loadNotes?.({ silent: true });
        if (page.includes("dashboard")) loadPage("dashboard.html");
        window.loadNotesDashboard?.();

    } else if (m === "KREDI") {
        window.loadLoans?.();
        if (page.includes("dashboard")) loadPage("dashboard.html");

    } else if (m === "MASRAF") {
        if (page.includes("masraf")) loadPage("masraflar.html");
        if (page.includes("dashboard")) loadPage("dashboard.html");

    } else if (m === "BANKA") {
        if (page.includes("banka-detay"))    window.initBankaDetay?.();
        if (page.includes("banka-hesaplar")) window.initBankaHesaplari?.();

    } else if (m === "SYSTEM" && event.action === "WS_PING") {
        console.log("WS OK");
    }

    window.loadHeaderNotifications?.();
},

  disconnect() {
    this._stomp?.deactivate();
    this._stomp = null;
  }
};

window.wsClient = wsClient;
