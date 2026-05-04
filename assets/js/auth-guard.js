(function () {

    const token = sessionStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    const jwt = parseJwt(token);
    if (!jwt) {
        sessionStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    if (jwt.exp && jwt.exp < Math.floor(Date.now() / 1000)) {
        sessionStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    const permissions = jwt.permissions || [];

    function has(p) {
        return permissions.includes(p);
    }

    function deny() {
        window.location.href = "layout.html";
    }

    const path = window.location.pathname.toLowerCase();

    // ================= SAYFA KORUMA =================
    if (path.includes("kasa") && !has("KASA")) deny();
    if (path.includes("masraf") && !has("MASRAF")) deny();
    if (path.includes("cek") && !has("CEK")) deny();
    if (path.includes("senet") && !has("SENET")) deny();
    if (path.includes("krediler") && !has("KREDILER")) deny();
    if (path.includes("kullanici") && !has("KULLANICI_YONETIMI")) deny();

    // ================= UI GİZLEME =================
    function applyPermissionUI() {
        const elements = document.querySelectorAll("[data-perm]");

        if (elements.length === 0) return false;

        if (jwt.role === "ADMIN") return true;

        elements.forEach(el => {
            const perm = el.getAttribute("data-perm");
            if (!has(perm)) {
                el.remove();
            }
        });

        return true;
    }

    // DOM hazır olunca çalıştır
    document.addEventListener("DOMContentLoaded", () => {

        // İzin UI
        if (!applyPermissionUI()) {
            const interval = setInterval(() => {
                if (applyPermissionUI()) clearInterval(interval);
            }, 100);
            setTimeout(() => clearInterval(interval), 5000);
        }

    });

})();