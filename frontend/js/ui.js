(() => {
    const keys = {
        theme: "adaptive-ui-theme",
        contrast: "adaptive-ui-contrast",
        scale: "adaptive-ui-scale",
        motion: "adaptive-ui-reduced-motion",
        reading: "adaptive-ui-reading-mode",
        links: "adaptive-ui-link-highlight",
    };
    const defaults = { theme: "system", contrast: "normal", scale: "normal", motion: "normal", reading: "off", links: "normal" };
    const root = document.documentElement;
    const scaleValues = { normal: "1", large: "1.08", larger: "1.16" };

    const read = (key, fallback) => {
        try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    };
    const save = (key, value) => {
        try { localStorage.setItem(key, value); } catch { /* Preferences remain available for this page. */ }
    };
    const readPreferences = () => ({
        theme: ["system", "light", "dark"].includes(read(keys.theme, defaults.theme)) ? read(keys.theme, defaults.theme) : defaults.theme,
        contrast: read(keys.contrast, defaults.contrast) === "high" ? "high" : "normal",
        scale: Object.hasOwn(scaleValues, read(keys.scale, defaults.scale)) ? read(keys.scale, defaults.scale) : defaults.scale,
        motion: read(keys.motion, defaults.motion) === "reduced" ? "reduced" : "normal",
        reading: read(keys.reading, defaults.reading) === "on" ? "on" : "off",
        links: read(keys.links, defaults.links) === "highlight" ? "highlight" : "normal",
    });
    let preferences = readPreferences();

    const resolveTheme = () => {
        if (preferences.theme !== "system") return preferences.theme;
        return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };
    const apply = () => {
        root.dataset.theme = resolveTheme();
        root.dataset.themePreference = preferences.theme;
        root.dataset.contrast = preferences.contrast;
        root.dataset.textScale = preferences.scale;
        root.dataset.motion = preferences.motion;
        root.dataset.readingMode = preferences.reading;
        root.dataset.linkHighlight = preferences.links;
        root.style.zoom = scaleValues[preferences.scale];
        syncControls();
    };
    const update = (name, value, announce = true) => {
        preferences = { ...preferences, [name]: value };
        save(keys[name], value);
        apply();
        if (announce) window.dispatchEvent(new CustomEvent("adaptive:preferences-change", { detail: { ...preferences } }));
    };

    function syncControls() {
        const theme = document.getElementById("theme-setting");
        const scale = document.getElementById("text-scale-setting");
        const contrast = document.getElementById("contrast-setting");
        const motion = document.getElementById("motion-setting");
        if (theme) theme.value = preferences.theme;
        if (scale) scale.value = preferences.scale;
        if (contrast) contrast.checked = preferences.contrast === "high";
        if (motion) motion.checked = preferences.motion === "reduced";
        const quickTheme = document.getElementById("quick-theme-setting");
        if (quickTheme) quickTheme.value = preferences.theme;
        const quickContrast = document.getElementById("quick-contrast-setting");
        if (quickContrast) quickContrast.checked = preferences.contrast === "high";
        const quickMotion = document.getElementById("quick-motion-setting");
        if (quickMotion) quickMotion.checked = preferences.motion === "reduced";
        const quickScale = document.getElementById("quick-scale-setting");
        if (quickScale) quickScale.value = preferences.scale;
        const reading = document.getElementById("reading-mode-setting");
        if (reading) reading.checked = preferences.reading === "on";
        const linkHighlight = document.getElementById("link-highlight-setting");
        if (linkHighlight) linkHighlight.checked = preferences.links === "highlight";
        const quickReading = document.getElementById("quick-reading-setting");
        if (quickReading) quickReading.checked = preferences.reading === "on";
        const quickLinks = document.getElementById("quick-links-setting");
        if (quickLinks) quickLinks.checked = preferences.links === "highlight";
    }

    apply();
    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
        if (preferences.theme === "system") apply();
    });
    window.addEventListener("storage", event => {
        if (Object.values(keys).includes(event.key)) {
            preferences = readPreferences();
            apply();
        }
    });

    const main = document.querySelector("main");
    if (main) {
        const skipLink = document.createElement("a");
        skipLink.className = "skip-link";
        skipLink.href = "#main-content";
        skipLink.textContent = "Pular para o conteúdo";
        main.id ||= "main-content";
        main.tabIndex = -1;
        document.body.prepend(skipLink);
    }

    function mountSettingsPanel() {
        const tools = document.createElement("div");
        tools.className = "accessibility-tools";
        tools.innerHTML = `
            <button class="accessibility-trigger" type="button" aria-expanded="false" aria-controls="quick-settings-panel" aria-label="Abrir preferências rápidas"><span aria-hidden="true">⚙</span></button>
            <section id="quick-settings-panel" class="accessibility-panel" aria-label="Preferências rápidas" hidden>
                <div class="accessibility-panel-heading"><div><span class="eyebrow">PERSONALIZAÇÃO</span><h2>Preferências rápidas</h2></div><button class="accessibility-close" type="button" aria-label="Fechar preferências">×</button></div>
                <label class="quick-setting-row" for="quick-theme-setting"><span>Tema</span><select id="quick-theme-setting"><option value="system">Automático</option><option value="light">Claro</option><option value="dark">Escuro</option></select></label>
                <label class="quick-setting-row" for="quick-scale-setting"><span>Tamanho</span><select id="quick-scale-setting"><option value="normal">Padrão</option><option value="large">Grande</option><option value="larger">Muito grande</option></select></label>
                <label class="quick-check-row" for="quick-contrast-setting"><span>Alto contraste</span><input id="quick-contrast-setting" type="checkbox"></label>
                <label class="quick-check-row" for="quick-motion-setting"><span>Reduzir animações</span><input id="quick-motion-setting" type="checkbox"></label>
                <label class="quick-check-row" for="quick-reading-setting"><span>Modo de leitura</span><input id="quick-reading-setting" type="checkbox"></label>
                <label class="quick-check-row" for="quick-links-setting"><span>Destacar links</span><input id="quick-links-setting" type="checkbox"></label>
                <label class="quick-setting-row" for="quick-language-setting"><span>Idioma</span><select id="quick-language-setting"><option value="pt-BR">Português</option><option value="en">English</option></select></label>
                <a class="quick-settings-link" href="dashboard.html#settings">Abrir todas as configurações <span aria-hidden="true">→</span></a>
                <p class="accessibility-note" role="status">Salvo neste navegador.</p>
            </section>`;
        document.body.append(tools);

        const trigger = tools.querySelector(".accessibility-trigger");
        const panel = tools.querySelector(".accessibility-panel");
        const close = tools.querySelector(".accessibility-close");
        const setPanelOpen = open => {
            panel.hidden = !open;
            trigger.setAttribute("aria-expanded", String(open));
            if (open) close.focus(); else trigger.focus();
        };
        trigger.addEventListener("click", () => setPanelOpen(panel.hidden));
        close.addEventListener("click", () => setPanelOpen(false));
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && !panel.hidden) setPanelOpen(false);
        });
        document.addEventListener("pointerdown", event => {
            if (!panel.hidden && !tools.contains(event.target)) {
                panel.hidden = true;
                trigger.setAttribute("aria-expanded", "false");
            }
        });
        tools.querySelector("#quick-theme-setting").addEventListener("change", event => update("theme", event.target.value));
        tools.querySelector("#quick-scale-setting").addEventListener("change", event => update("scale", event.target.value));
        tools.querySelector("#quick-contrast-setting").addEventListener("change", event => update("contrast", event.target.checked ? "high" : "normal"));
        tools.querySelector("#quick-motion-setting").addEventListener("change", event => update("motion", event.target.checked ? "reduced" : "normal"));
        tools.querySelector("#quick-reading-setting").addEventListener("change", event => update("reading", event.target.checked ? "on" : "off"));
        tools.querySelector("#quick-links-setting").addEventListener("change", event => update("links", event.target.checked ? "highlight" : "normal"));
    }

    mountSettingsPanel();
    document.getElementById("theme-setting")?.addEventListener("change", event => update("theme", event.target.value));
    document.getElementById("text-scale-setting")?.addEventListener("change", event => update("scale", event.target.value));
    document.getElementById("contrast-setting")?.addEventListener("change", event => update("contrast", event.target.checked ? "high" : "normal"));
    document.getElementById("motion-setting")?.addEventListener("change", event => update("motion", event.target.checked ? "reduced" : "normal"));
    document.getElementById("reading-mode-setting")?.addEventListener("change", event => update("reading", event.target.checked ? "on" : "off"));
    document.getElementById("link-highlight-setting")?.addEventListener("change", event => update("links", event.target.checked ? "highlight" : "normal"));

    const resetButton = document.getElementById("reset-settings-button");
    resetButton?.addEventListener("click", () => {
        preferences = { ...defaults };
        Object.entries(keys).forEach(([name, key]) => save(key, defaults[name]));
        apply();
        window.AdaptiveI18n?.setLanguage("pt-BR");
        window.dispatchEvent(new CustomEvent("adaptive:preferences-change", { detail: { ...preferences } }));
        const status = document.getElementById("settings-status");
        if (status) status.textContent = "Preferências restauradas.";
    });
    window.addEventListener("adaptive:preferences-change", () => {
        const status = document.getElementById("settings-status");
        if (status) status.textContent = "Preferências salvas neste navegador.";
    });

    document.querySelectorAll('input[type="password"]').forEach(input => {
        const wrapper = document.createElement("div");
        wrapper.className = "password-input-wrap";
        input.parentNode.insertBefore(wrapper, input);
        wrapper.append(input);
        const toggle = document.createElement("button");
        toggle.className = "password-visibility-toggle";
        toggle.type = "button";
        toggle.textContent = "Mostrar";
        toggle.setAttribute("aria-label", "Mostrar senha");
        toggle.setAttribute("aria-pressed", "false");
        toggle.addEventListener("click", () => {
            const reveal = input.type === "password";
            input.type = reveal ? "text" : "password";
            toggle.textContent = reveal ? "Ocultar" : "Mostrar";
            toggle.setAttribute("aria-label", reveal ? "Ocultar senha" : "Mostrar senha");
            toggle.setAttribute("aria-pressed", String(reveal));
            input.focus();
        });
        wrapper.append(toggle);
    });

    document.getElementById("print-result-button")?.addEventListener("click", () => window.print());

    function classifyStatusMessage(element) {
        const message = element.textContent.trim();
        if (!message) {
            delete element.dataset.state;
            return;
        }
        if (/lendo|identificando|publicando|enviando|carregando|corrigindo|aguarde|separando as quest/i.test(message)) {
            element.dataset.state = "loading";
        } else if (/não encontrei.*(respostas?|questões?|gabarito|solução)|sem gabarito|gabarito detectado/i.test(message)) {
            element.dataset.state = "warning";
        } else if (/erro|falha|não foi possível|não encontrei|cancelad|tente (outro|outra|novamente)|preencha|selecione uma área maior|não tem questões/i.test(message)) {
            element.dataset.state = "error";
        } else if (/conclu[ií]d|transcrit|separad|recorte pronto|publicad|salv[ao]|corrigid[ao]|questão e gabarito/i.test(message)) {
            element.dataset.state = "success";
        } else {
            element.dataset.state = "info";
        }
    }

    const refreshStatusMessages = () => {
        document.querySelectorAll(".ocr-status, [role='status']").forEach(classifyStatusMessage);
    };
    refreshStatusMessages();
    new MutationObserver(refreshStatusMessages).observe(document.body, {
        childList: true,
        characterData: true,
        subtree: true,
    });
})();
