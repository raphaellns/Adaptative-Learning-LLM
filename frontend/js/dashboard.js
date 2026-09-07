const menuButton = document.getElementById("menu-button");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const menuItems = document.querySelectorAll(".menu-item[data-section]");
const sections = document.querySelectorAll(".content-section");

const userName = document.getElementById("user-name");
const userNameShort = document.getElementById("user-name-short");

const logoutButton = document.getElementById("logout-button");

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
let studyPlanLoaded = false;


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
                        ${data.detail || "Não foi possível carregar os usuários."}
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


        adminUsersContainer.innerHTML = `

            <div class="users-list">

                ${data.map(user => `

                    <div class="user-row">

                        <div class="user-main">

                            <div class="user-avatar ${user.role.toLowerCase()}">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>


                            <div class="user-info">

                                <strong>
                                    ${user.name}
                                </strong>

                                <span>
                                    ${user.email}
                                </span>

                            </div>

                        </div>


                        <div class="user-details">

                            <span class="role-badge ${user.role.toLowerCase()}">
                                ${user.role}
                            </span>

                            <span class="user-id">
                                ID ${user.id}
                            </span>

                        </div>


                        <div class="user-actions">

                            ${user.id === currentUserId
                ? `
                                    <span class="current-user-label">
                                        Você
                                    </span>
                                  `
                : `
                                    <button
                                        type="button"
                                        class="user-action-button delete-button"
                                        data-user-id="${user.id}"
                                        data-user-name="${user.name}"
                                    >
                                        Excluir
                                    </button>
                                  `
            }

                        </div>

                    </div>

                `).join("")}

            </div>

        `;


        registerDeleteActions();


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
                        ${errorMessage}
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

                    ${priorities.map(topic => `

                        <div class="home-priority-row">

                            <div>

                                <strong>
                                    ${topic.topic}
                                </strong>

                                <span>
                                    ${topic.correct} acertos
                                    ·
                                    ${topic.incorrect} erros
                                </span>

                            </div>

                            <strong>
                                ${topic.accuracy}%
                            </strong>

                        </div>

                    `).join("")}

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

                ${data.topics.map(topic => `

                    <div class="topic-performance-row">

                        <div class="topic-performance-header">

                            <strong>
                                ${topic.topic}
                            </strong>

                            <span>
                                ${topic.accuracy}%
                            </span>

                        </div>


                        <div class="progress-bar">

                            <div
                                class="progress-fill"
                                style="width: ${topic.accuracy}%"
                            ></div>

                        </div>


                        <div class="topic-performance-footer">

                            <span>
                                ${topic.correct} acertos
                            </span>

                            <span>
                                ${topic.incorrect} erros
                            </span>

                            <span>
                                ${topic.total} questões
                            </span>

                        </div>

                    </div>

                `).join("")}

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
                        ${data.detail || "Não foi possível carregar o histórico."}
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

                ${data.map(exam => `

                    <div class="history-row">

                        <div class="history-main">

                            <strong>
                                Avaliação #${exam.exam_id}
                            </strong>

                            <span>
                                ${new Date(exam.created_at).toLocaleString("pt-BR")}
                            </span>

                        </div>


                        <div class="history-stats">

                            <span>
                                ${exam.total_questions} questões
                            </span>

                            <span class="history-correct">
                                ${exam.correct_answers} acertos
                            </span>

                            <span class="history-incorrect">
                                ${exam.incorrect_answers} erros
                            </span>

                            <strong>
                                ${exam.accuracy}%
                            </strong>

                        </div>

                    </div>

                `).join("")}

            </div>

        `;

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
                        ${data.detail || "Não foi possível gerar o plano."}
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

            <div class="study-plan-content">

                ${Object.entries(plan).map(([key, value]) => `

                    <div class="study-plan-block">

                        <h3>
                            ${formatStudyPlanKey(key)}
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


function registerDeleteActions() {

    const deleteButtons =
        document.querySelectorAll(".delete-button");


    deleteButtons.forEach(button => {

        button.addEventListener("click", async () => {

            const userId =
                button.dataset.userId;

            const userName =
                button.dataset.userName;


            const confirmed =
                confirm(
                    `Tem certeza que deseja excluir o usuário "${userName}"?`
                );


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
                        data.detail ||
                        "Não foi possível excluir o usuário."
                    );

                    return;
                }


                alert(
                    "Usuário excluído com sucesso."
                );


                loadAdminUsers(token);


            } catch (error) {

                console.error(error);

                alert(
                    "Não foi possível conectar com a API."
                );

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


        currentUserId =
            user.id;


        /*
         * Carregamento dos dados
         */

        loadHistory(token);
        loadPerformance(token);


        userName.textContent =
            user.name;

        userNameShort.textContent =
            user.name;


        if (user.role === "ADMIN") {

            adminUsersMenu.style.display = "flex";

            loadAdminUsers(token);

        }


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


menuItems.forEach(item => {

    item.addEventListener("click", () => {

        const section =
            item.dataset.section;

        showSection(section);

    });

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