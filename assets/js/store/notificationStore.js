const notificationStore = {

  async build() {

    const notifications = [];

    try {

      const loans = await loanStore.fetchLoans();
      const checks = await checkStore.fetchChecks();

      const today = new Date();

      const fmtMoney  = v => Number(v || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
      const fmtBank   = k => (window.BANK_LABELS && window.BANK_LABELS[k]) || k;

      // LOAN
      loans.forEach(l => {
        if (!l.paymentDay) return;

        const diff = l.paymentDay - today.getDate();
        const loanLabel = fmtBank(l.bankName) || "Kredi";
        const monthly   = l.monthlyPayment ? ` (${fmtMoney(l.monthlyPayment)}/ay)` : "";

        if (diff < 0) {
          notifications.push({
            message: `${loanLabel} kredisinin ödemesi gecikti${monthly}`,
            level: "danger"
          });
        } else if (diff === 0) {
          notifications.push({
            message: `${loanLabel} kredisinin ödemesi bugün${monthly}`,
            level: "warning"
          });
        } else if (diff <= 3) {
          notifications.push({
            message: `${loanLabel} kredisinin ödemesi ${diff} gün sonra${monthly}`,
            level: "info"
          });
        }
      });

      // CHECK
      checks.forEach(c => {
        if (!c.dueDate) return;

        const due  = new Date(c.dueDate);
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        const amt  = c.amount ? ` — ${fmtMoney(c.amount)}` : "";

        if (diff < 0) {
          notifications.push({
            message: `${c.checkNo} no'lu çekin vadesi geçti${amt}`,
            level: "danger"
          });
        } else if (diff === 0) {
          notifications.push({
            message: `${c.checkNo} no'lu çekin vadesi bugün${amt}`,
            level: "warning"
          });
        } else if (diff <= 3) {
          notifications.push({
            message: `${c.checkNo} no'lu çekin vadesi ${diff} gün sonra${amt}`,
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