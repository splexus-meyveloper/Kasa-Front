// ==============================
// WEBSOCKET CLIENT
// ==============================

const wsClient = {
  _stomp:     null,
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
      reconnectDelay:    5000,

      onConnect: () => {
        console.log("[WS] Bağlandı, topic dinleniyor:", "/topic/company-" + this._companyId);
        this._subscribe();
      },

      onStompError:     (frame) => console.warn("[WS] STOMP hatası:", frame),
      onWebSocketError: (err)   => console.warn("[WS] WebSocket hatası:", err),
      onDisconnect:     ()      => console.log("[WS] Bağlantı kesildi, yeniden bağlanılacak..."),
    });

    this._stomp.activate();
  },

  _subscribe() {
    this._stomp.subscribe(
      "/topic/company-" + this._companyId,
      (msg) => {
        try {
          const event = JSON.parse(msg.body);
          console.log("[WS] Event alındı:", event, "| Sayfa:", this.getCurrentPage());
          this._handleEvent(event);
        } catch (err) {
          console.error("[WS] Event işlenemedi:", err);
        }
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
        if (page.includes("dashboard")) {
            window.loadDashboard?.();
        }

    } else if (m === "CEK") {
        if (page.includes("cek")) window.loadChecks?.({ silent: true });
        if (page.includes("dashboard")) window.loadDashboard?.();
        if (sessionStorage.getItem("role") === "ADMIN") window.loadCheckSummary?.();

    } else if (m === "SENET") {
        if (page.includes("senet")) window.loadNotes?.({ silent: true });
        if (page.includes("dashboard")) window.loadDashboard?.();
        if (sessionStorage.getItem("role") === "ADMIN") window.loadNotesDashboard?.();

    } else if (m === "KREDI") {
        window.loadLoans?.();
        if (page.includes("dashboard")) window.loadDashboard?.();

    } else if (m === "MASRAF") {
        if (page.includes("masraf")) loadPage("masraflar.html");
        if (page.includes("dashboard")) window.loadDashboard?.();

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
