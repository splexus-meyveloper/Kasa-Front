console.log("🔥 YENI notificationStore CALISTI");

const notificationStore = {

  async build() {

    const notifications = [];

    try {

      const loans = await loanStore.fetchLoans();
      const checks = await checkStore.fetchChecks();

      const today = new Date();

      // LOAN
      loans.forEach(l => {
        if (!l.paymentDay) return;

        const diff = l.paymentDay - today.getDate();

        if (diff < 0) {
          notifications.push({
            message: `${l.bankName} kredisi gecikti`,
            level: "danger"
          });
        } else if (diff === 0) {
          notifications.push({
            message: `${l.bankName} kredisi bugün`,
            level: "warning"
          });
        } else if (diff <= 3) {
          notifications.push({
            message: `${l.bankName} kredisi ${diff} gün sonra`,
            level: "info"
          });
        }
      });

      // CHECK
      checks.forEach(c => {
        if (!c.dueDate) return;

        const due = new Date(c.dueDate);
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

        if (diff < 0) {
          notifications.push({
            message: `${c.checkNo} no'lu çek gecikti`,
            level: "danger"
          });
        } else if (diff === 0) {
          notifications.push({
            message: `${c.checkNo} no'lu çek bugün`,
            level: "warning"
          });
        } else if (diff <= 3) {
          notifications.push({
            message: `${c.checkNo} no'lu çek ${diff} gün sonra`,
            level: "info"
          });
        }
      });

    } catch (e) {
      console.error("Notification hata:", e);
    }

    return notifications;
  }

};

window.notificationStore = notificationStore;