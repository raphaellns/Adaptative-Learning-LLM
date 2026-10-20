const resultContainer =
    document.getElementById("questions-results");

const totalQuestions =
    document.getElementById("total-questions");

const correctAnswers =
    document.getElementById("correct-answers");

const incorrectAnswers =
    document.getElementById("incorrect-answers");

const accuracy =
    document.getElementById("accuracy");

const recommendationsContainer =
    document.getElementById("study-recommendations");

const backButton =
    document.getElementById("back-button");


function escapeHTML(value) {
    const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };

    return String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
}


function renderList(items) {
    if (!Array.isArray(items) || items.length === 0) return "";

    return `<ul>${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
}


const savedResult =
    localStorage.getItem("last_exam_result");


if (!savedResult) {

    resultContainer.innerHTML = `
        <div class="dashboard-card empty-large">

            <span class="large-icon">
                ⚠️
            </span>

            <h2>
                Resultado não encontrado
            </h2>

            <p>
                Faça uma nova análise para visualizar os resultados.
            </p>

        </div>
    `;

} else {

    const data =
        JSON.parse(savedResult);

    const timingElement = document.getElementById("analysis-duration");
    const timings = data.timings || {};
    if (timingElement && Number.isFinite(Number(timings.total_seconds))) {
        const details = [];
        if (Number.isFinite(Number(timings.question_analysis_seconds))) {
            details.push(`correção ${Number(timings.question_analysis_seconds).toFixed(2)}s`);
        }
        if (Number.isFinite(Number(timings.study_plan_seconds))) {
            details.push(`plano ${Number(timings.study_plan_seconds).toFixed(2)}s`);
        }
        timingElement.textContent = `Tempo de processamento: ${Number(timings.total_seconds).toFixed(2)}s${details.length ? ` (${details.join("; ")})` : ""}.`;
    }


    const questions =
        data.questions || [];


    const correct =
        questions.filter(
            question => question.correta
        ).length;


    const incorrect =
        questions.length - correct;


    const percentage =
        questions.length > 0
            ? (correct / questions.length) * 100
            : 0;


    totalQuestions.textContent =
        questions.length;

    correctAnswers.textContent =
        correct;

    incorrectAnswers.textContent =
        incorrect;

    accuracy.textContent =
        `${percentage.toFixed(1)}%`;


    resultContainer.innerHTML =
        questions
            .map((question, index) => {

                const statusClass =
                    question.correta
                        ? "correct-result"
                        : "incorrect-result";


                const statusIcon =
                    question.correta
                        ? "✓"
                        : "✕";


                const errorSection =
                    question.correta
                        ? ""
                        : `
                            <div class="analysis-block error-block">

                                <span class="analysis-label">
                                    Erro principal
                                </span>

                                <p>
                                    ${escapeHTML(question.erro_principal)}
                                </p>

                            </div>
                        `;


                const recommendationSection =
                    question.recomendacoes &&
                        question.recomendacoes.length > 0
                        ? `
                            <div class="analysis-block">

                                <span class="analysis-label">
                                    Recomendações
                                </span>

                                <ul>

                                    ${question.recomendacoes
                            .map(
                                recommendation =>
                                    `<li>${escapeHTML(recommendation)}</li>`
                            )
                            .join("")}

                                </ul>

                            </div>
                        `
                        : "";


                return `

                    <article class="question-result ${statusClass}">

                        <div class="question-result-header">

                            <div class="result-title">

                                <span class="status-icon">
                                    ${statusIcon}
                                </span>

                                <h3>
                                    Questão ${index + 1}
                                </h3>

                            </div>

                            <span class="topic-badge">
                                ${escapeHTML(question.topico)}
                            </span>

                        </div>


                        <div class="analysis-block">

                            <span class="analysis-label">
                                Resultado
                            </span>

                            <strong>
                                ${question.correta
                        ? "Resposta correta"
                        : "Resposta incorreta"
                    }
                            </strong>

                        </div>


                        ${errorSection}


                        <div class="analysis-block">

                            <span class="analysis-label">
                                Explicação
                            </span>

                            <p>
                                    ${escapeHTML(question.explicacao)}
                            </p>

                        </div>


                        ${recommendationSection}

                    </article>

                `;

            })
            .join("");


    const studyPlan = Array.isArray(data.study_plan?.plano)
        ? data.study_plan.plano
        : [];

    if (studyPlan.length > 0) {
        recommendationsContainer.innerHTML = studyPlan.map((item) => {
            const priority = Number(item.prioridade);
            const minutes = Number(item.tempo_estimado_minutos);
            const priorityText = Number.isFinite(priority)
                ? `Prioridade ${Math.round(priority)}%`
                : "Prioridade";
            const durationText = Number.isFinite(minutes)
                ? `${Math.round(minutes)} min`
                : "";

            return `
                <article class="study-plan-item">
                    <div class="question-result-header">
                        <h3>${escapeHTML(item.topico)}</h3>
                        <span class="study-plan-meta">${priorityText}${durationText ? ` · ${durationText}` : ""}</span>
                    </div>
                    <p><strong>Por que estudar:</strong> ${escapeHTML(item.motivo)}</p>
                    <p><strong>Objetivo:</strong> ${escapeHTML(item.objetivo)}</p>
                    ${item.conteudos?.length ? `<strong>Conteúdos</strong>${renderList(item.conteudos)}` : ""}
                    ${item.atividades?.length ? `<strong>Atividades</strong>${renderList(item.atividades)}` : ""}
                </article>
            `;
        }).join("");
    } else {
        const recommendations = [];

        questions.forEach(question => {
            if (Array.isArray(question.recomendacoes)) {
                question.recomendacoes.forEach(recommendation => {
                    if (!recommendations.includes(recommendation)) {
                        recommendations.push(recommendation);
                    }
                });
            }
        });

        if (recommendations.length > 0) {
            recommendationsContainer.innerHTML = `
                <ul class="recommendations-list">
                    ${recommendations.map(recommendation => `<li>${escapeHTML(recommendation)}</li>`).join("")}
                </ul>
            `;
        } else {
            recommendationsContainer.innerHTML = `
                <div class="empty-state">
                    <strong>Nenhuma recomendação necessária.</strong>
                    <span>Não foram identificadas dificuldades nesta avaliação.</span>
                </div>
            `;
        }
    }

}


backButton.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});
