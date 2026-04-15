const authApi = {
  login: (data) =>
    fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(async (res) => {
      const text = await res.text();
      let parsed = null;

      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text || null;
      }

      if (!res.ok) {
        throw new Error(
          (parsed && parsed.message) ||
            (typeof parsed === "string" ? parsed : "Giriş başarısız")
        );
      }

      return parsed;
    }),

  registerCompany: (data) =>
    fetch("http://localhost:8080/api/auth/register-company", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(async (res) => {
      const text = await res.text();
      let parsed = null;

      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text || null;
      }

      if (!res.ok) {
        throw new Error(
          (parsed && parsed.message) ||
            (typeof parsed === "string" ? parsed : "Firma kaydı başarısız")
        );
      }

      return parsed;
    }),

  registerUser: (data) =>
    apiClient.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

window.authApi = authApi;