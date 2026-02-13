
(function () {

    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    function parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    }

    const jwt = parseJwt(token);
    const permissions = jwt.permissions || [];

    function has(p) {
        return permissions.includes(p);
    }

    function deny() {
        window.location.href = "layout.html";
    }

    const path = window.location.pathname.toLowerCase();

    // ================= KASA =================
    if (
        path.includes("kasa-giris") ||
        path.includes("kasa-cikis")
    ) {
        if (!has("KASA")) deny();
    }

    // ================= MASRAF =================
    if (path.includes("masraf")) {
        if (!has("MASRAF")) deny();
    }

    // ================= CEK =================
    if (path.includes("cek")) {
        if (!has("CEK")) deny();
    }

    // ================= SENET =================
    if (path.includes("senet")) {
        if (!has("SENET")) deny();
    }

    // ================= KREDILER =================
    if (path.includes("krediler")) {
        if (!has("KREDILER")) deny();
    }

    // ================= KULLANICI YONETIMI =================
    if (path.includes("kullanici")) {
        if (!has("KULLANICI_YONETIMI")) deny();
    }

})();

