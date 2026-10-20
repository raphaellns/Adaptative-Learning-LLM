(() => {
    const root = document.documentElement;
    const read = (key, fallback) => {
        try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
    };
    const preference = read("adaptive-ui-theme", "system");
    const theme = preference === "system"
        ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : preference;
    root.dataset.theme = ["light", "dark"].includes(theme) ? theme : "light";
    root.dataset.themePreference = ["system", "light", "dark"].includes(preference) ? preference : "system";
    root.dataset.contrast = read("adaptive-ui-contrast", "normal") === "high" ? "high" : "normal";
    root.dataset.textScale = read("adaptive-ui-scale", "normal");
    root.dataset.motion = read("adaptive-ui-reduced-motion", "normal") === "reduced" ? "reduced" : "normal";
    root.style.zoom = { normal: "1", large: "1.08", larger: "1.16" }[root.dataset.textScale] || "1";
})();
