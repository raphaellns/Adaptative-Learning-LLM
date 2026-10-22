const menuButton = document.getElementById("menu-button");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const menuItems = document.querySelectorAll(".menu-item[data-section]");
const sections = document.querySelectorAll(".content-section");

const userName = document.getElementById("user-name");
const userNameShort = document.getElementById("user-name-short");

const logoutButton = document.getElementById("logout-button");
const sidebarCloseButton = document.getElementById("sidebar-close");
const navSearch = document.getElementById("nav-search");
const sidebarNavSearch = document.getElementById("sidebar-nav-search");
const userAvatar = document.getElementById("user-avatar");
const userRoleLabel = document.getElementById("user-role-label");
const openAccountButton = document.getElementById("open-account-button");
const accountDialog = document.getElementById("account-dialog");

const adminUsersMenu = document.getElementById("admin-users-menu");
const adminUsersContainer = document.getElementById("admin-users-container");

const startExamButton = document.getElementById("start-exam-button");
const openExamButton = document.getElementById("open-exam-button");

const profileTotal =
    document.getElementById("profile-total");

const profileCorrect =
    document.getElementById("profile-correct");

const profileIncorrect =
    document.getElementById("profile-incorrect");

const profileAccuracy =
    document.getElementById("profile-accuracy");

const topicPerformanceContainer =
    document.getElementById("topic-performance-container");

const historyContainer =
    document.getElementById("history-container");

const homeTotal =
    document.getElementById("home-total");

const homeCorrect =
    document.getElementById("home-correct");

const homeAccuracy =
    document.getElementById("home-accuracy");

const homePriorities =
    document.getElementById("home-priorities");

const studyPlanContainer =
    document.getElementById("study-plan-container");


const API_URL = "http://127.0.0.1:8000";

let currentUserId = null;
let currentToken = null;
let currentUser = null;
let studyPlanLoaded = false;


function userInitials(name) {
    return String(name || "AL").trim().split(/\s+/).slice(0, 2)
        .map(part => part[0]).join("").toLocaleUpperCase("pt-BR") || "AL";
}


function renderUserInitials(element, user) {
    if (!element) return;
    element.textContent = userInitials(user?.name);
}


function syncAccountUI(user) {
    currentUser = user;
    currentUserId = user.id;
    const roleNames = { STUDENT: "Estudante", TEACHER: "Professor", ADMIN: "Administrador" };
    if (userName) userName.textContent = user.name || "";
    if (userNameShort) userNameShort.textContent = user.name || "";
    if (userRoleLabel) userRoleLabel.textContent = roleNames[user.role] || "Conta";
    renderUserInitials(userAvatar, user);
    const values = {
        "settings-account-name": user.name || "—",
        "settings-account-email": user.email || "—",
        "settings-account-role": roleNames[user.role] || "Conta",
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    const nameInput = document.getElementById("account-name-input");
    const emailInput = document.getElementById("account-email-input");
    if (nameInput) nameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";
}


function openAccount() {
    if (accountDialog && !accountDialog.open) accountDialog.showModal();
}


async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${currentToken}`);
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const detail = Array.isArray(data.detail)
            ? data.detail.map(item => item.msg || JSON.stringify(item)).join("; ")
            : data.detail;
        throw new Error(detail || "Não foi possível concluir a operação.");
    }
    return data;
}


function openMenu() {

    sidebar.classList.add("open");
    overlay.classList.add("active");

}


function closeMenu() {

    sidebar.classList.remove("open");
    overlay.classList.remove("active");

}


function showSection(sectionName) {

    sections.forEach(section => {
        section.classList.remove("active-section");
    });


    menuItems.forEach(item => {
        item.classList.remove("active");
    });


    const selectedSection =
        document.getElementById(`${sectionName}-section`);


    const selectedMenuItem =
        document.querySelector(
            `.menu-item[data-section="${sectionName}"]`
        );


    if (selectedSection) {
        selectedSection.classList.add("active-section");
    }


    if (selectedMenuItem) {
        selectedMenuItem.classList.add("active");
    }

    try {
        sessionStorage.setItem("adaptive-active-section", sectionName);
    } catch {
        // Section navigation still works when browser storage is unavailable.
    }


    closeMenu();


    if (
        sectionName === "study-plan" &&
        !studyPlanLoaded
    ) {
        loadStudyPlan(currentToken);
    }

}


async function loadAdminUsers(token) {

    try {

        const response = await fetch(
            `${API_URL}/admin/users`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            adminUsersContainer.innerHTML = `
                <div class="empty-state">
                    <strong>Erro</strong>
                    <span>
                        ${escapeHtml(data.detail || "Não foi possível carregar os usuários.")}
                    </span>
                </div>
            `;

            return;
        }


        if (data.length === 0) {

            adminUsersContainer.innerHTML = `
                <div class="empty-state">
                    <strong>
                        Nenhum usuário encontrado
                    </strong>

                    <span>
                        Não existem contas cadastradas.
                    </span>
                </div>
            `;

            return;
        }


        const userNamesById = new Map(
            data.map(user => [String(user.id), String(user.name || "")])
        );

        adminUsersContainer.innerHTML = `
            <div class="admin-users-toolbar">
                <div><strong><span class="admin-users-visible-count">${data.length}</span> <span>contas</span></strong><small>Busque por nome ou e-mail e filtre por perfil.</small></div>
                <input id="admin-users-search" type="search" placeholder="Buscar nome ou e-mail" aria-label="Buscar usuários">
                <select id="admin-users-role-filter" aria-label="Filtrar por perfil">
                    <option value="all">Todos os perfis</option><option value="STUDENT">Estudantes</option><option value="TEACHER">Professores</option><option value="ADMIN">Administradores</option>
                </select>
                <button id="refresh-admin-users" type="button" class="secondary-button">Atualizar</button>
            </div>
            <div class="users-list" id="admin-users-list">
                ${data.map(user => {
                    const userId = String(user.id);
                    const userName = String(user.name || "");
                    const userEmail = String(user.email || "");
                    const roleClass = ["ADMIN", "TEACHER", "STUDENT"].includes(user.role)
                        ? user.role.toLowerCase()
                        : "student";
                    const initial = userName.charAt(0).toUpperCase() || "?";

                    return `
                    <div class="user-row" data-user-role="${escapeHtml(user.role)}" data-user-search="${escapeHtml(`${userName} ${userEmail}`.toLocaleLowerCase("pt-BR"))}">
                        <div class="user-main">
                            <div class="user-avatar ${roleClass}">
                                ${escapeHtml(initial)}
                            </div>
                            <div class="user-info">
                                <strong data-no-translate>${escapeHtml(userName)}</strong>
                                <span data-no-translate>${escapeHtml(userEmail)}</span>
                            </div>
                        </div>
                        <div class="user-details">
                            <span class="role-badge ${roleClass}">
                                ${escapeHtml(user.role)}
                            </span>
                            <span class="user-id">ID ${escapeHtml(userId)}</span>
                        </div>
                        <div class="user-actions">
                            ${user.role !== "ADMIN"
                                ? `
                                    <select class="role-select" data-user-id="${escapeHtml(userId)}" aria-label="Função de ${escapeHtml(userName)}">
                                        <option value="STUDENT" ${user.role === "STUDENT" ? "selected" : ""}>Estudante</option>
                                        <option value="TEACHER" ${user.role === "TEACHER" ? "selected" : ""}>Professor</option>
                                    </select>
                                    <button type="button" class="user-action-button role-button" data-user-id="${escapeHtml(userId)}">Salvar função</button>
                                  `
                                : ""
                            }
                            ${Number(user.id) === currentUserId
                                ? `
                                    <span class="current-user-label">Você</span>
                                  `
                                : `
                                    <button type="button" class="user-action-button delete-button" data-user-id="${escapeHtml(userId)}">
                                        Excluir
                                    </button>
                                  `
                            }
                        </div>
                    </div>
                    `;
                }).join("")}
            </div>
        `;

        const applyAdminUserFilters = () => {
            const query = document.getElementById("admin-users-search")?.value.trim().toLocaleLowerCase("pt-BR") || "";
            const role = document.getElementById("admin-users-role-filter")?.value || "all";
            let visible = 0;
            adminUsersContainer.querySelectorAll(".user-row").forEach(row => {
                const matches = (!query || row.dataset.userSearch.includes(query))
                    && (role === "all" || row.dataset.userRole === role);
                row.hidden = !matches;
                visible += matches ? 1 : 0;
            });
            const count = adminUsersContainer.querySelector(".admin-users-visible-count");
            if (count) count.textContent = `${visible} / ${data.length}`;
        };
        document.getElementById("admin-users-search").addEventListener("input", applyAdminUserFilters);
        document.getElementById("admin-users-role-filter").addEventListener("change", applyAdminUserFilters);
        document.getElementById("refresh-admin-users").addEventListener("click", () => loadAdminUsers(token));

        registerDeleteActions(userNamesById);
        registerRoleActions();


    } catch (error) {

        console.error(error);

        adminUsersContainer.innerHTML = `
            <div class="empty-state">
                <strong>
                    Erro de conexão
                </strong>

                <span>
                    Não foi possível conectar com a API.
                </span>
            </div>
        `;

    }

}


async function loadAdminOverview(token) {
    const note = document.getElementById("admin-overview-note");
    try {
        const response = await fetch(`${API_URL}/admin/overview`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Não foi possível carregar os indicadores.");
        const values = {
            "admin-metric-users": data.users,
            "admin-metric-students": data.students,
            "admin-metric-teachers": data.teachers,
            "admin-metric-assessments": data.published_assessments,
        };
        Object.entries(values).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = Number(value).toLocaleString();
        });
        if (note) note.textContent = window.AdaptiveI18n?.getLanguage() === "en"
            ? `${Number(data.submissions).toLocaleString()} student responses submitted.`
            : `${Number(data.submissions).toLocaleString()} respostas recebidas nas avaliações.`;
    } catch (error) {
        if (note) note.textContent = error.message || "Não foi possível carregar os indicadores.";
    }
}


async function loadPerformance(token) {

    try {

        const response = await fetch(
            `${API_URL}/profile/performance`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            const errorMessage =
                data.detail ||
                "Não foi possível carregar o desempenho.";

            homePriorities.innerHTML = `
                <div class="empty-state">

                    <strong>
                        Erro
                    </strong>

                    <span>
                        ${escapeHtml(errorMessage)}
                    </span>

                </div>
            `;

            return;
        }


        /*
         * PERFIL
         */

        profileTotal.textContent =
            data.total_questions;

        profileCorrect.textContent =
            data.correct;

        profileIncorrect.textContent =
            data.incorrect;

        profileAccuracy.textContent =
            `${data.accuracy}%`;


        /*
         * INÍCIO
         */

        homeTotal.textContent =
            data.total_questions;

        homeCorrect.textContent =
            data.correct;

        homeAccuracy.textContent =
            `${data.accuracy}%`;


        /*
         * PRIORIDADES
         *
         * O endpoint já retorna os tópicos
         * ordenados do menor para o maior
         * aproveitamento.
         */

        if (data.topics.length === 0) {

            homePriorities.innerHTML = `
                <div class="empty-state">

                    <strong>
                        Sem dados ainda
                    </strong>

                    <span>
                        Faça uma avaliação para descobrir
                        suas prioridades.
                    </span>

                </div>
            `;

        } else {

            const priorities =
                data.topics.slice(0, 3);


            homePriorities.innerHTML = `

                <div class="home-priority-list">

                    ${priorities.map(topic => {
                        const accuracy = Math.max(0, Math.min(100, Number(topic.accuracy) || 0));
                        const correct = Math.max(0, Number(topic.correct) || 0);
                        const incorrect = Math.max(0, Number(topic.incorrect) || 0);
                        return `

                        <div class="home-priority-row">

                            <div>

                                <strong>
                                    ${escapeHtml(topic.topic)}
                                </strong>

                                <span>
                                    ${correct} acertos
                                    ·
                                    ${incorrect} erros
                                </span>

                            </div>

                            <strong>
                                ${accuracy}%
                            </strong>

                        </div>

                    `;
                    }).join("")}

                </div>

            `;

        }


        /*
         * PERFIL POR TÓPICO
         */

        if (data.topics.length === 0) {

            topicPerformanceContainer.innerHTML = `
                <div class="empty-state">

                    <strong>
                        Ainda não há dados
                    </strong>

                    <span>
                        Faça uma avaliação para construir seu perfil.
                    </span>

                </div>
            `;

            return;
        }


        topicPerformanceContainer.innerHTML = `

            <div class="topic-performance-list">

                ${data.topics.map(topic => {
                    const accuracy = Math.max(0, Math.min(100, Number(topic.accuracy) || 0));
                    const correct = Math.max(0, Number(topic.correct) || 0);
                    const incorrect = Math.max(0, Number(topic.incorrect) || 0);
                    const total = Math.max(0, Number(topic.total) || 0);
                    return `

                    <div class="topic-performance-row">

                        <div class="topic-performance-header">

                            <strong>
                                ${escapeHtml(topic.topic)}
                            </strong>

                            <span>
                                ${accuracy}%
                            </span>

                        </div>


                        <div class="progress-bar">

                            <div
                                class="progress-fill"
                                style="width: ${accuracy}%"
                            ></div>

                        </div>


                        <div class="topic-performance-footer">

                            <span>
                                ${correct} acertos
                            </span>

                            <span>
                                ${incorrect} erros
                            </span>

                            <span>
                                ${total} questões
                            </span>

                        </div>

                    </div>

                `;
                }).join("")}

            </div>

        `;


    } catch (error) {

        console.error(error);

        homePriorities.innerHTML = `
            <div class="empty-state">

                <strong>
                    Erro de conexão
                </strong>

                <span>
                    Não foi possível conectar com a API.
                </span>

            </div>
        `;

    }

}


async function loadHistory(token) {

    try {

        const response = await fetch(
            `${API_URL}/history/`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            historyContainer.innerHTML = `
                <div class="empty-state">
                    <strong>Erro</strong>

                    <span>
                        ${escapeHtml(data.detail || "Não foi possível carregar o histórico.")}
                    </span>
                </div>
            `;

            return;
        }


        if (data.length === 0) {

            historyContainer.innerHTML = `
                <div class="empty-state">
                    <strong>
                        Nenhuma avaliação encontrada
                    </strong>

                    <span>
                        Faça sua primeira prova para começar seu histórico.
                    </span>
                </div>
            `;

            return;
        }


        historyContainer.innerHTML = `
            <div class="history-list">
                ${data.map(exam => {
                    const examId = Number(exam.exam_id);
                    const score = Math.max(0, Math.min(100, Number(exam.accuracy) || 0));
                    const title = exam.assessment_title || `Avaliação #${examId}`;
                    const date = new Date(exam.created_at);
                    const dateLabel = Number.isNaN(date.getTime())
                        ? "Data indisponível"
                        : date.toLocaleString("pt-BR");
                    return `
                        <article class="history-row" aria-label="${escapeHtml(title)}: ${score.toFixed(1)} por cento de aproveitamento">
                            <div class="history-main">
                                <strong>${escapeHtml(title)}</strong>
                                <span>${escapeHtml(dateLabel)}</span>
                            </div>
                            <div class="history-score">
                                <div class="history-score-label"><span>Aproveitamento</span><strong>${score.toFixed(1)}%</strong></div>
                                <div class="history-score-track" role="img" aria-label="Aproveitamento de ${score.toFixed(1)} por cento">
                                    <span style="width: ${score}%"></span>
                                </div>
                            </div>
                            <div class="history-stats">
                                <span class="history-total"><strong>${Number(exam.total_questions) || 0}</strong> questões</span>
                                <span class="history-correct"><strong>${Number(exam.correct_answers) || 0}</strong> acertos</span>
                                <span class="history-incorrect"><strong>${Number(exam.incorrect_answers) || 0}</strong> para revisar</span>
                            </div>
                            <button class="history-detail-button" type="button" data-exam-id="${examId}"
                                aria-expanded="false" aria-controls="history-detail-${examId}">Ver feedback</button>
                            <div class="history-detail" id="history-detail-${examId}" hidden></div>
                        </article>
                    `;
                }).join("")}
            </div>
        `;

        registerHistoryDetailActions(token);

    } catch (error) {

        console.error(error);

        historyContainer.innerHTML = `
            <div class="empty-state">
                <strong>
                    Erro de conexão
                </strong>

                <span>
                    Não foi possível conectar com a API.
                </span>
            </div>
        `;

    }

}


function registerHistoryDetailActions(token) {
    historyContainer.querySelectorAll(".history-detail-button").forEach(button => {
        button.addEventListener("click", async () => {
            const examId = button.dataset.examId;
            const panel = document.getElementById(`history-detail-${examId}`);
            if (!panel) return;

            const expanded = button.getAttribute("aria-expanded") === "true";
            if (expanded) {
                button.setAttribute("aria-expanded", "false");
                button.textContent = "Ver feedback";
                panel.hidden = true;
                return;
            }

            button.setAttribute("aria-expanded", "true");
            button.textContent = "Ocultar feedback";
            panel.hidden = false;
            if (panel.dataset.loaded === "loaded" || panel.dataset.loaded === "loading") return;

            panel.dataset.loaded = "loading";
            panel.innerHTML = `
                <div class="history-detail-loading" role="status">
                    <span class="loading-spinner" aria-hidden="true"></span>
                    <span>Carregando o feedback desta tentativa…</span>
                </div>
            `;

            try {
                const response = await fetch(`${API_URL}/history/${encodeURIComponent(examId)}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || "Não foi possível abrir este resultado.");
                }
                panel.innerHTML = renderHistoryDetails(data);
                panel.dataset.loaded = "loaded";
            } catch (error) {
                console.error(error);
                panel.dataset.loaded = "error";
                panel.innerHTML = `
                    <div class="history-detail-error" role="alert">
                        <span>${escapeHtml(error.message || "Não foi possível carregar o feedback.")}</span>
                        <span>Selecione “Ocultar feedback” e tente novamente.</span>
                    </div>
                `;
            }
        });
    });
}


function renderHistoryDetails(data) {
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
        return `<div class="history-detail-empty">Esta tentativa ainda não tem questões detalhadas.</div>`;
    }

    return `
        <div class="history-detail-list">
            ${data.questions.map((question, index) => {
                const resultClass = question.correct === true
                    ? "is-correct"
                    : question.correct === false ? "needs-review" : "not-analyzed";
                const resultLabel = question.correct === true
                    ? "Correta"
                    : question.correct === false ? "Precisa revisar" : "Sem análise";
                const recommendations = Array.isArray(question.recommendations)
                    ? question.recommendations
                    : [];
                return `
                    <section class="history-question-detail">
                        <div class="history-question-heading">
                            <h3>Questão ${index + 1}</h3>
                            <span class="history-result-badge ${resultClass}">${resultLabel}</span>
                        </div>
                        <div class="history-detail-block">
                            <span>Enunciado</span>
                            <p>${escapeHtml(question.question || "Enunciado indisponível.")}</p>
                        </div>
                        <div class="history-detail-block history-student-answer">
                            <span>Sua resposta</span>
                            <p>${escapeHtml(question.student_answer || "Nenhuma resposta registrada.")}</p>
                        </div>
                        ${question.topic ? `
                            <div class="history-detail-topic"><strong>Conteúdo:</strong> ${escapeHtml(question.topic)}</div>
                        ` : ""}
                        ${question.main_error ? `
                            <div class="history-detail-block"><span>Ponto para revisar</span><p>${escapeHtml(question.main_error)}</p></div>
                        ` : ""}
                        ${question.explanation ? `
                            <div class="history-detail-block"><span>Feedback</span><p>${escapeHtml(question.explanation)}</p></div>
                        ` : ""}
                        ${recommendations.length ? `
                            <div class="history-detail-block">
                                <span>Próximos passos</span>
                                <ul>${recommendations.map(item => {
                                    const text = typeof item === "string" ? item : JSON.stringify(item);
                                    return `<li>${escapeHtml(text)}</li>`;
                                }).join("")}</ul>
                            </div>
                        ` : ""}
                    </section>
                `;
            }).join("")}
        </div>
    `;
}


async function loadStudyPlan(token) {

    studyPlanContainer.innerHTML = `
        <div class="empty-state">

            <strong>
                Gerando plano de estudos...
            </strong>

            <span>
                A IA está analisando seu histórico acumulado.
            </span>

        </div>
    `;


    try {

        const response = await fetch(
            `${API_URL}/profile/study-plan`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            studyPlanContainer.innerHTML = `
                <div class="empty-state">

                    <strong>
                        Erro
                    </strong>

                    <span>
                        ${escapeHtml(data.detail || "Não foi possível gerar o plano.")}
                    </span>

                </div>
            `;

            return;
        }


        if (!data.study_plan) {

            studyPlanContainer.innerHTML = `
                <div class="empty-state">

                    <strong>
                        Ainda não há dados suficientes
                    </strong>

                    <span>
                        Faça algumas avaliações para gerar
                        um plano personalizado.
                    </span>

                </div>
            `;

            return;
        }

        if (Array.isArray(data.study_plan.plano) && data.study_plan.plano.length === 0) {
            studyPlanContainer.innerHTML = `
                <div class="empty-state">
                    <strong>Sem tópicos prioritários por enquanto</strong>
                    <span>Seu histórico não mostra erros que peçam um plano de recuperação. Novas respostas atualizam essa análise.</span>
                </div>
            `;
            studyPlanLoaded = true;
            return;
        }


        studyPlanContainer.innerHTML =
            renderStudyPlan(data.study_plan);

        studyPlanLoaded = true;


    } catch (error) {

        console.error(error);

        studyPlanContainer.innerHTML = `
            <div class="empty-state">

                <strong>
                    Erro de conexão
                </strong>

                <span>
                    Não foi possível conectar com a API.
                </span>

            </div>
        `;

    }

}


function renderStudyPlan(plan) {

    /*
     * Como o formato exato do JSON do plano
     * pode mudar conforme o schema da LLM,
     * esta função transforma objetos, listas
     * e textos em uma estrutura visual.
     */

    if (typeof plan === "string") {

        return `
            <div class="study-plan-text">
                ${escapeHtml(plan)}
            </div>
        `;

    }


    if (Array.isArray(plan)) {

        return `
            <div class="study-plan-list">

                ${plan.map(item => `

                    <div class="study-plan-item">
                        ${renderStudyPlan(item)}
                    </div>

                `).join("")}

            </div>
        `;

    }


    if (typeof plan === "object" && plan !== null) {

        return `

            <div class="study-plan-content" data-no-translate>

                ${Object.entries(plan).map(([key, value]) => `

                    <div class="study-plan-block">

                        <h3>
                            ${escapeHtml(formatStudyPlanKey(key))}
                        </h3>

                        <div>
                            ${renderStudyPlan(value)}
                        </div>

                    </div>

                `).join("")}

            </div>

        `;

    }


    return `
        <div class="study-plan-text">
            ${escapeHtml(String(plan))}
        </div>
    `;

}


function formatStudyPlanKey(key) {

    return key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, char => char.toUpperCase());

}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function localizedText(value) {
    return window.AdaptiveI18n?.translateText(value) || value;
}


function registerDeleteActions(userNamesById) {

    const deleteButtons =
        document.querySelectorAll(".delete-button");


    deleteButtons.forEach(button => {

        button.addEventListener("click", async () => {

            const userId =
                button.dataset.userId;

            const userName =
                userNamesById.get(String(userId)) || "este usuário";


            const confirmed = confirm(window.AdaptiveI18n?.getLanguage() === "en"
                ? `Delete "${userName}"? Their assessments and related submissions will also be removed. This cannot be undone.`
                : `Excluir a conta "${userName}"? As avaliações e respostas vinculadas também serão removidas. Esta ação não pode ser desfeita.`);


            if (!confirmed) {
                return;
            }


            const token =
                localStorage.getItem("access_token");


            try {

                const response = await fetch(
                    `${API_URL}/admin/users/${userId}`,
                    {
                        method: "DELETE",

                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        localizedText(data.detail) ||
                        localizedText("Não foi possível excluir o usuário.")
                    );

                    return;
                }


                alert(
                    localizedText("Usuário excluído com sucesso.")
                );


                await loadAdminUsers(token);
                loadAdminOverview(token);


            } catch (error) {

                console.error(error);

                alert(
                    localizedText("Não foi possível conectar com a API.")
                );

            }

        });

    });

}


function registerRoleActions() {
    document.querySelectorAll(".role-button").forEach(button => {
        button.addEventListener("click", async () => {
            const userId = button.dataset.userId;
            const role = document.querySelector(`.role-select[data-user-id="${userId}"]`).value;
            const token = localStorage.getItem("access_token");
            button.disabled = true;
            try {
                const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ role }),
                });
                const data = await response.json();
                if (!response.ok) {
                    alert(localizedText(data.detail || "Não foi possível alterar a função."));
                    return;
                }
                await loadAdminUsers(token);
                loadAdminOverview(token);
            } catch (error) {
                console.error(error);
                alert(localizedText("Não foi possível conectar com a API."));
            } finally {
                button.disabled = false;
            }
        });
    });
}


async function loadCurrentUser() {

    const token =
        localStorage.getItem("access_token");


    if (!token) {

        window.location.href = "login.html";

        return;

    }


    currentToken = token;


    try {

        const response = await fetch(
            `${API_URL}/auth/me`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

            localStorage.removeItem("access_token");

            window.location.href = "login.html";

            return;
        }


        const user =
            await response.json();


        syncAccountUI(user);


        /*
         * Carregamento dos dados
         */

        if (user.role === "STUDENT") {
            loadHistory(token);
            loadPerformance(token);
        }

        const examMenuLabel = document.querySelector('.menu-item[data-section="exam"] span:last-child');
        const homeExamTitle = startExamButton?.parentElement?.querySelector("h3");
        const homeExamDescription = startExamButton?.parentElement?.querySelector("p");
        if (user.role === "TEACHER") {
            if (examMenuLabel) examMenuLabel.textContent = "Gerenciar avaliações";
            if (homeExamTitle) homeExamTitle.textContent = "Publicar uma avaliação";
            if (homeExamDescription) homeExamDescription.textContent = "Cadastre questões e gabaritos oficiais e acompanhe as respostas dos estudantes.";
            if (startExamButton) startExamButton.textContent = "Gerenciar avaliações";
        } else {
            if (examMenuLabel) examMenuLabel.textContent = "Responder avaliação";
            if (homeExamTitle) homeExamTitle.textContent = "Responder uma questão";
            if (homeExamDescription) homeExamDescription.textContent = "Escolha uma avaliação, envie uma foto da resposta e receba uma correção com inteligência artificial.";
            if (startExamButton) startExamButton.textContent = "Ver avaliações";
        }


        if (user.role === "TEACHER") {
            if (adminUsersMenu) adminUsersMenu.style.display = "none";
            ["history", "profile", "study-plan", "about"].forEach(sectionName => {
                const menuItem = document.querySelector(
                    `.menu-item[data-section="${sectionName}"]`
                );
                if (menuItem) menuItem.style.display = "none";
            });

            [
                "home-student-performance-card",
                "home-study-priorities-card",
                "home-learning-info"
            ].forEach(elementId => {
                const element = document.getElementById(elementId);
                if (element) element.style.display = "none";
            });

            const welcomeEyebrow = document.getElementById("welcome-eyebrow");
            const welcomeText = document.getElementById("welcome-text");
            if (welcomeEyebrow) welcomeEyebrow.textContent = "ÁREA DO PROFESSOR";
            if (welcomeText) {
                welcomeText.textContent = "Publique avaliações com gabarito e acompanhe as respostas dos estudantes.";
            }
        }

        if (user.role === "ADMIN") {
            if (adminUsersMenu) adminUsersMenu.style.display = "flex";
            ["exam", "history", "profile", "study-plan", "about"].forEach(sectionName => {
                const menuItem = document.querySelector(`.menu-item[data-section="${sectionName}"]`);
                if (menuItem) menuItem.style.display = "none";
            });
            ["home-student-performance-card", "home-study-priorities-card", "home-learning-info", "start-exam-button"]
                .forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.style.display = "none";
                });
            startExamButton?.closest(".highlight-card")?.style.setProperty("display", "none");
            const adminOverview = document.getElementById("home-admin-overview");
            if (adminOverview) adminOverview.style.display = "block";
            const welcomeEyebrow = document.getElementById("welcome-eyebrow");
            const welcomeText = document.getElementById("welcome-text");
            if (welcomeEyebrow) welcomeEyebrow.textContent = "ÁREA DO ADMINISTRADOR";
            if (welcomeText) welcomeText.textContent = "Acompanhe a plataforma e gerencie contas e permissões.";
            loadAdminUsers(token);
            loadAdminOverview(token);
        }

        let preferredSection = "home";
        try {
            preferredSection = window.location.hash.slice(1) || sessionStorage.getItem("adaptive-active-section") || "home";
        } catch {
            preferredSection = window.location.hash.slice(1) || "home";
        }
        const preferredMenuItem = [...menuItems].find(item => item.dataset.section === preferredSection);
        if (!preferredMenuItem || !document.getElementById(`${preferredSection}-section`) || preferredMenuItem.style.display === "none") preferredSection = "home";
        if (preferredSection !== "exam") showSection(preferredSection);


    } catch (error) {

        console.error(error);

    }

}


menuButton.addEventListener(
    "click",
    openMenu
);


overlay.addEventListener(
    "click",
    closeMenu
);

sidebarCloseButton?.addEventListener("click", closeMenu);


menuItems.forEach(item => {

    item.addEventListener("click", () => {

        const section =
            item.dataset.section;

        if (section === "exam") {
            if (navSearch) navSearch.value = "";
            if (sidebarNavSearch) sidebarNavSearch.value = "";
            filterNavigation("");
            window.location.href = "exam.html";
            return;
        }

        if (section === "account") {
            openAccount();
            closeMenu();
            return;
        }

        if (navSearch) navSearch.value = "";
        if (sidebarNavSearch) sidebarNavSearch.value = "";
        filterNavigation("");
        showSection(section);

    });

});


openAccountButton?.addEventListener("click", openAccount);
document.getElementById("close-account-dialog")?.addEventListener("click", () => accountDialog?.close());
document.getElementById("open-admin-users-button")?.addEventListener("click", () => showSection("admin-users"));

accountDialog?.addEventListener("click", event => {
    if (event.target === accountDialog) accountDialog.close();
});

document.getElementById("account-profile-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.getElementById("profile-status");
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    status.textContent = "Salvando…";
    try {
        const user = await apiRequest("/auth/me/profile", {
            method: "PATCH",
            body: JSON.stringify({ name: document.getElementById("account-name-input").value.trim() }),
        });
        syncAccountUI(user);
        status.textContent = "Nome atualizado com sucesso.";
    } catch (error) {
        status.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

document.getElementById("account-password-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.getElementById("password-status");
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const newPassword = document.getElementById("new-password-input").value;
    if (newPassword !== document.getElementById("confirm-password-input").value) {
        status.textContent = "As senhas novas não coincidem.";
        return;
    }
    button.disabled = true;
    status.textContent = "Atualizando…";
    try {
        const result = await apiRequest("/auth/me/password", {
            method: "PUT",
            body: JSON.stringify({
                current_password: document.getElementById("current-password-input").value,
                new_password: newPassword,
            }),
        });
        status.textContent = result.message || "Senha atualizada com sucesso.";
        form.reset();
    } catch (error) {
        status.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

function filterNavigation(value) {
    const query = value.trim().toLocaleLowerCase("pt-BR");
    menuItems.forEach(item => {
        const label = item.querySelector("span:last-child")?.textContent?.trim().toLocaleLowerCase("pt-BR") || "";
        item.hidden = Boolean(query) && !label.includes(query);
    });
}

function syncNavigationSearch(source, target) {
    source?.addEventListener("input", () => {
        if (target && target.value !== source.value) target.value = source.value;
        filterNavigation(source.value);
    });
    source?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            const firstMatch = [...menuItems].find(item => !item.hidden && item.style.display !== "none");
            firstMatch?.click();
            if (firstMatch) {
                if (navSearch) navSearch.value = "";
                if (sidebarNavSearch) sidebarNavSearch.value = "";
                filterNavigation("");
            }
        }
        if (event.key === "Escape") {
            source.value = "";
            if (target) target.value = "";
            filterNavigation("");
            source.blur();
            closeMenu();
        }
    });
    source?.addEventListener("focus", () => {
        if (target && target.value !== source.value) target.value = source.value;
    });
}

syncNavigationSearch(navSearch, sidebarNavSearch);
syncNavigationSearch(sidebarNavSearch, navSearch);

document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openMenu();
        (window.matchMedia("(max-width: 820px)").matches ? sidebarNavSearch : navSearch)?.focus();
    }
});


if (startExamButton) {

    startExamButton.addEventListener("click", () => {

        window.location.href =
            "exam.html";

    });

}


if (openExamButton) {

    openExamButton.addEventListener("click", () => {

        window.location.href =
            "exam.html";

    });

}


logoutButton.addEventListener("click", () => {

    localStorage.removeItem("access_token");

    window.location.href =
        "login.html";

});


loadCurrentUser();
