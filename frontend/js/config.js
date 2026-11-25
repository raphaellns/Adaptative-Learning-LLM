// Deployment environments can replace this URL in one place without editing
// each page's request code. Keep the default aligned with the local API setup.
const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

window.AdaptiveLearningConfig = Object.freeze({
    apiBaseUrl: (window.ADAPTIVE_LEARNING_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, ""),
});
