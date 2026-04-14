window.API_BASE = "http://localhost:8080/api";

async function request(url, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(API_BASE + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: "Bearer " + token }),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API Hatası");
  }

  const text = await res.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

window.apiClient = { request };