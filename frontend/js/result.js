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
                                    ${question.erro_principal}
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
                                    `<li>${recommendation}</li>`
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
                                ${question.topico}
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
                                ${question.explicacao}
                            </p>

                        </div>


                        ${recommendationSection}

                    </article>

                `;

            })
            .join("");


    const recommendations = [];


    questions.forEach(question => {

        if (
            question.recomendacoes &&
            question.recomendacoes.length > 0
        ) {

            question.recomendacoes.forEach(
                recommendation => {

                    if (
                        !recommendations.includes(
                            recommendation
                        )
                    ) {

                        recommendations.push(
                            recommendation
                        );

                    }

                }
            );

        }

    });


    if (recommendations.length > 0) {

        recommendationsContainer.innerHTML = `

            <ul class="recommendations-list">

                ${recommendations
                .map(
                    recommendation =>
                        `<li>${recommendation}</li>`
                )
                .join("")}

            </ul>
        `;

    } else {

        recommendationsContainer.innerHTML = `

            <div class="empty-state">

                <strong>
                    Nenhuma recomendação necessária.
                </strong>

                <span>
                    Não foram identificadas dificuldades nesta avaliação.
                </span>

            </div>
        `;
    }

}


backButton.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});