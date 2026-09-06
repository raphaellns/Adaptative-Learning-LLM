const form = document.getElementById("exam-form");
const questionsContainer = document.getElementById("questions-container");
const addQuestionButton = document.getElementById("add-question");
const message = document.getElementById("exam-message");
const backButton = document.getElementById("back-button");

const API_URL = "http://127.0.0.1:8000";


function addQuestion() {

    const questionNumber =
        questionsContainer.children.length + 1;


    const questionContainer =
        document.createElement("div");


    questionContainer.classList.add(
        "question-card"
    );


    questionContainer.innerHTML = `

        <div class="question-card-header">

            <h2>
                Questão ${questionNumber}
            </h2>

            <button
                type="button"
                class="remove-question"
            >
                Remover
            </button>

        </div>


        <div class="form-group">

            <label>
                Enunciado
            </label>

            <textarea
                class="question"
                placeholder="Digite o enunciado da questão..."
                required
            ></textarea>

        </div>


        <div class="form-group">

            <label>
                Gabarito
            </label>

            <textarea
                class="answer-key"
                placeholder="Digite o gabarito..."
                required
            ></textarea>

        </div>


        <div class="form-group">

            <label>
                Resposta do aluno
            </label>

            <textarea
                class="student-answer"
                placeholder="Digite a resposta do aluno..."
                required
            ></textarea>

        </div>
    `;


    const removeButton =
        questionContainer.querySelector(
            ".remove-question"
        );


    removeButton.addEventListener("click", () => {

        questionContainer.remove();

        updateQuestionNumbers();

    });


    questionsContainer.appendChild(
        questionContainer
    );
}


function updateQuestionNumbers() {

    const questionCards =
        document.querySelectorAll(
            ".question-card"
        );


    questionCards.forEach((card, index) => {

        const title =
            card.querySelector("h2");

        title.textContent =
            `Questão ${index + 1}`;

    });
}


addQuestionButton.addEventListener(
    "click",
    addQuestion
);


backButton.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});


form.addEventListener("submit", async (event) => {

    event.preventDefault();


    const token =
        localStorage.getItem("access_token");


    if (!token) {

        window.location.href = "login.html";

        return;
    }


    const questions =
        document.querySelectorAll(".question");


    const answerKeys =
        document.querySelectorAll(".answer-key");


    const studentAnswers =
        document.querySelectorAll(".student-answer");


    const exam =
        Array.from(questions).map((question, index) => {

            return {
                question: question.value,
                answer_key: answerKeys[index].value,
                student_answer: studentAnswers[index].value
            };

        });


    if (exam.length === 0) {

        message.textContent =
            "Adicione pelo menos uma questão.";

        return;
    }


    message.textContent =
        "Analisando prova... Isso pode levar alguns segundos.";


    try {

        const response = await fetch(
            `${API_URL}/exam/analyze`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    questions: exam
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.detail || "Erro ao analisar a prova.";

            return;
        }


        localStorage.setItem(
            "last_exam_result",
            JSON.stringify(data)
        );


        window.location.href =
            "result.html";


    } catch (error) {

        console.error(error);

        message.textContent =
            "Não foi possível conectar com a API.";

    }

});