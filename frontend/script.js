const questionsContainer = document.getElementById("questions-container");
const addQuestionButton = document.getElementById("add-question");
const form = document.getElementById("question-form");
const result = document.getElementById("result");


function addQuestion() {

    const questionContainer = document.createElement("div");

    questionContainer.innerHTML = `
        <h3>Questão</h3>

        <label>Enunciado:</label>
        <br>
        <textarea class="question"></textarea>

        <br><br>

        <label>Gabarito:</label>
        <br>
        <textarea class="answer-key"></textarea>

        <br><br>

        <label>Resposta do aluno:</label>
        <br>
        <textarea class="student-answer"></textarea>

        <br><br>
    `;

    questionsContainer.appendChild(questionContainer);
}


addQuestionButton.addEventListener("click", addQuestion);


form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const questions = document.querySelectorAll(".question");
    const answerKeys = document.querySelectorAll(".answer-key");
    const studentAnswers = document.querySelectorAll(".student-answer");

    const exam = Array.from(questions).map((question, index) => {

        return {
            question: question.value,
            answer_key: answerKeys[index].value,
            student_answer: studentAnswers[index].value
        };

    });

    result.innerHTML = "<p>Analisando prova...</p>";

    try {

        const response = await fetch("http://127.0.0.1:8000/exam/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                questions: exam
            })
        });

        const data = await response.json();

        result.innerHTML = `
            <h2>Resultado</h2>

            <h3>Desempenho</h3>

            <p>
                <strong>Questões:</strong>
                ${data.profile.total_questions}
            </p>

            <p>
                <strong>Acertos:</strong>
                ${data.profile.correct}
            </p>

            <p>
                <strong>Erros:</strong>
                ${data.profile.incorrect}
            </p>

            <p>
                <strong>Aproveitamento:</strong>
                ${data.profile.accuracy}%
            </p>

            <h3>Prioridades</h3>

            <ul>
                ${data.priorities
                .map(priority => `
                        <li>
                            ${priority.topic}:
                            ${priority.accuracy}%
                            de aproveitamento
                        </li>
                    `)
                .join("")}
            </ul>

            <h3>Plano de estudos</h3>

            ${data.study_plan.plano
                .map(item => `
                    <div>
                        <h4>${item.topico}</h4>

                        <p>
                            <strong>Motivo:</strong>
                            ${item.motivo}
                        </p>

                        <p>
                            <strong>Objetivo:</strong>
                            ${item.objetivo}
                        </p>

                        <p>
                            <strong>Tempo:</strong>
                            ${item.tempo_estimado_minutos} minutos
                        </p>

                        <strong>Conteúdos:</strong>
                        <ul>
                            ${item.conteudos
                        .map(content => `<li>${content}</li>`)
                        .join("")}
                        </ul>

                        <strong>Atividades:</strong>
                        <ul>
                            ${item.atividades
                        .map(activity => `<li>${activity}</li>`)
                        .join("")}
                        </ul>
                    </div>
                `)
                .join("")}
        `;

    } catch (error) {

        result.innerHTML = `
            <p>Erro ao conectar com a API.</p>
            <p>${error}</p>
        `;
    }
});