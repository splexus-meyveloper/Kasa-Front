window.API_BASE = "http://localhost:8080/api";

async function request(url, options = {}) {
  const token = localStorage.getItem("token");

  const finalHeaders = {
    ...(options.headers || {}),
  };

  const isFormData = options.body instanceof FormData;

  if (!isFormData && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    finalHeaders["Authorization"] = "Bearer " + token;
  }

  const response = await fetch(API_BASE + url, {
    ...options,
    headers: finalHeaders,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    window.location.href = "login.html";
    return null;
  }

  const rawText = await response.text();

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText || null;
  }

  if (!response.ok) {
    const errorMessage =
      (data && data.message) ||
      (typeof data === "string" && data) ||
      "API hatası oluştu";
    throw new Error(errorMessage);
  }

  return data;
}

window.apiClient = { request };