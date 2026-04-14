const calendarMapper = {

  mapChecks(checks) {
    return checks.map(c => ({
      id: "check-" + c.id,
      title: "💰 Çek: " + (c.amount || 0) + " TL",
      date: c.dueDate,
      color: "#f59e0b", // sarı
      type: "CHECK",
      raw: c
    }))
  },

  mapLoans(loans) {
    return loans.map(l => ({
      id: "loan-" + l.id,
      title: "🏦 Kredi: " + (l.monthlyPayment || 0) + " TL",
      date: l.nextPaymentDate,
      color: "#ef4444", // kırmızı
      type: "LOAN",
      raw: l
    }))
  },

  mapSenetler(senetler) {
    return senetler.map(s => ({
      id: "senet-" + s.id,
      title: "📄 Senet: " + (s.amount || 0) + " TL",
      date: s.dueDate,
      color: "#3b82f6", // mavi
      type: "SENET",
      raw: s
    }))
  },

  mapNotes(notes) {
    return notes.map(n => ({
      id: "note-" + n.id,
      title: "📝 " + n.text,
      date: n.date,
      color: "#10b981",
      type: "NOTE",
      raw: n
    }))
  }

}

window.calendarMapper = calendarMapper;