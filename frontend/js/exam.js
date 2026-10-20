const API_URL = "http://127.0.0.1:8000";
const workflow = document.getElementById("exam-workflow");
const pageTitle = document.getElementById("workflow-title");
const pageDescription = document.getElementById("workflow-description");
const backButton = document.getElementById("back-button");
const token = localStorage.getItem("access_token");

backButton.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function errorMessage(data) {
    if (Array.isArray(data?.detail)) {
        return data.detail.map(item => item.msg || JSON.stringify(item)).join("; ");
    }
    return data?.detail || "Não foi possível concluir a operação.";
}

async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorMessage(data));
    return data;
}

async function initialize() {
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const user = await apiRequest("/auth/me");
        if (user.role === "TEACHER" || user.role === "ADMIN") {
            renderTeacherWorkspace(user);
        } else if (user.role === "STUDENT") {
            renderStudentWorkspace();
        } else {
            workflow.innerHTML = `<div class="empty-state"><strong>Acesso indisponível</strong><span>Este perfil não pode usar as avaliações.</span></div>`;
        }
    } catch (error) {
        workflow.innerHTML = `<div class="empty-state"><strong>Falha ao carregar</strong><span>${escapeHtml(error.message)}</span></div>`;
    }
}

function renderTeacherWorkspace(user) {
    pageTitle.textContent = user.role === "ADMIN" ? "Publicar avaliação" : "Minhas avaliações";
    pageDescription.textContent = "O professor cadastra o enunciado e o gabarito oficial; o estudante envia a própria resposta para correção.";
    workflow.innerHTML = `
        <section class="question-card">
            <h2>Nova avaliação</h2>
            <p class="field-help teacher-workflow-help">Para cada questão, informe o enunciado e a resposta esperada ou os critérios de correção. Você não precisa cadastrar a resposta do estudante: ele enviará a própria resposta depois. O gabarito fica protegido no servidor.</p>
            <ol class="workflow-progress teacher-workflow-progress" aria-label="Etapas para publicar uma avaliação">
                <li><span>01</span><div><strong>Importe ou escreva</strong><small>PDF, foto ou cadastro manual</small></div></li>
                <li><span>02</span><div><strong>Revise as questões</strong><small>Confira os enunciados e gabaritos</small></div></li>
                <li><span>03</span><div><strong>Publique</strong><small>O estudante responde depois</small></div></li>
            </ol>
            <form id="assessment-form">
                <div class="document-import">
                    <h3>Importar prova completa</h3>
                    <p class="field-help">Envie uma foto ou um PDF de até 8 páginas. O Qwen-VL separa as questões e os gabaritos em cartões para você revisar antes de publicar.</p>
                    <div class="ocr-controls">
                        <input id="teacher-assessment-file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" aria-label="PDF ou imagem da prova completa">
                        <button id="transcribe-assessment-file" class="secondary-button" type="button" disabled>Separar prova em questões</button>
                    </div>
                    <p id="assessment-import-status" class="ocr-status" aria-live="polite"></p>
                </div>
                <div class="form-group">
                    <label for="assessment-title">Título</label>
                    <input id="assessment-title" type="text" maxlength="150" placeholder="Ex.: Estruturas de repetição — lista 1" required>
                </div>
                <div id="teacher-questions"></div>
                <div class="exam-actions">
                    <button id="add-teacher-question" class="secondary-button" type="button">+ Adicionar questão</button>
                    <button class="primary-button" type="submit">Publicar avaliação</button>
                </div>
                <p id="teacher-message" class="ocr-status" aria-live="polite"></p>
            </form>
        </section>
        <section class="assessment-section">
            <h2>Avaliações publicadas</h2>
            <div id="teacher-assessment-list" class="assessment-list"><div class="empty-state"><strong>Carregando</strong><span>Buscando avaliações...</span></div></div>
            <div id="teacher-submissions" class="submission-results"></div>
        </section>
    `;

    const questionList = document.getElementById("teacher-questions");
    const form = document.getElementById("assessment-form");
    const message = document.getElementById("teacher-message");
    addTeacherQuestion(questionList);
    bindTeacherAssessmentImport(questionList);

    document.getElementById("add-teacher-question").addEventListener("click", () => {
        addTeacherQuestion(questionList);
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const questions = [...questionList.querySelectorAll(".teacher-question-card")].map(card => ({
            question: card.querySelector(".teacher-question").value.trim(),
            answer_key: card.querySelector(".teacher-answer-key").value.trim(),
        }));
        if (questions.some(item => !item.question || !item.answer_key)) {
            message.textContent = "Preencha o enunciado e o gabarito de todas as questões.";
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');
        submitButton.disabled = true;
        message.textContent = "Publicando e salvando os gabaritos...";
        try {
            const created = await apiRequest("/assessments", {
                method: "POST",
                body: JSON.stringify({
                    title: document.getElementById("assessment-title").value.trim(),
                    questions,
                }),
            });
            form.reset();
            questionList.innerHTML = "";
            addTeacherQuestion(questionList);
            message.textContent = `Avaliação “${created.title}” publicada com ${created.question_count} questão(ões).`;
            await loadTeacherAssessments();
        } catch (error) {
            message.textContent = error.message;
        } finally {
            submitButton.disabled = false;
        }
    });

    loadTeacherAssessments();
}

function addTeacherQuestion(container, values = {}) {
    const card = document.createElement("div");
    card.className = "question-card teacher-question-card";
    card.innerHTML = `
        <div class="question-card-header">
            <h3>Questão ${container.children.length + 1}</h3>
            <button type="button" class="remove-question">Remover</button>
        </div>
        <div class="form-group ocr-group teacher-question-ocr">
            <label>Foto da questão e do gabarito (opcional)</label>
            <p class="field-help">Com Qwen-VL, o OCR separa o enunciado da solução manuscrita ou em código, mesmo sem o título “Gabarito”. Revise os dois campos.</p>
            <div class="ocr-controls">
                <input class="teacher-question-image" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Foto da questão e do gabarito">
                <select class="teacher-question-ocr-engine" aria-label="Motor de transcrição do enunciado">
                    <option value="vision">Qwen-VL — separar questão e gabarito</option>
                    <option value="tesseract">Tesseract — impresso, separa se houver rótulo</option>
                </select>
                <button class="secondary-button transcribe-question" type="button" disabled>Separar campos com OCR</button>
            </div>
            <p class="ocr-status teacher-question-ocr-status" aria-live="polite"></p>
        </div>
        <div class="form-group">
            <label>Enunciado da questão</label>
            <textarea class="teacher-question" placeholder="Digite ou revise aqui o enunciado que o estudante verá" required></textarea>
        </div>
        <div class="form-group">
            <label>Gabarito oficial ou critérios de correção (privado)</label>
            <textarea class="teacher-answer-key" placeholder="Informe a solução esperada, os passos importantes ou os critérios para aceitar respostas equivalentes" required></textarea>
            <p class="field-help">Este conteúdo é usado pelo sistema para corrigir e fica oculto para o estudante.</p>
        </div>
    `;
    card.querySelector(".teacher-question").value = values.question || "";
    card.querySelector(".teacher-answer-key").value = values.answer_key || "";
    card.querySelector(".remove-question").addEventListener("click", () => {
        if (container.children.length === 1) return;
        card.remove();
        [...container.children].forEach((item, index) => {
            item.querySelector("h3").textContent = `Questão ${index + 1}`;
        });
    });
    container.appendChild(card);
    bindTeacherQuestionOcr(card);
}

function bindTeacherAssessmentImport(questionList) {
    const fileInput = document.getElementById("teacher-assessment-file");
    const button = document.getElementById("transcribe-assessment-file");
    const status = document.getElementById("assessment-import-status");

    fileInput.addEventListener("change", () => {
        button.disabled = !fileInput.files?.[0];
        status.textContent = fileInput.files?.[0]
            ? "Arquivo carregado. A leitura pode levar alguns minutos em provas com várias páginas."
            : "";
    });

    button.addEventListener("click", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        button.disabled = true;
        status.textContent = "Lendo a prova e separando as questões. Aguarde...";
        const controller = new AbortController();
        const abortTimer = setTimeout(() => controller.abort(), 360000);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const data = await apiRequest("/ocr/transcribe-assessment", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });
            const questions = (data.questions || []).filter(item => item.question?.trim());
            if (!questions.length) {
                status.textContent = "Não encontrei questões legíveis. Tente uma foto mais nítida ou cadastre os campos manualmente.";
                return;
            }

            const cards = [...questionList.querySelectorAll(".teacher-question-card")];
            const onlyBlankCard = cards.length === 1
                && !cards[0].querySelector(".teacher-question").value.trim()
                && !cards[0].querySelector(".teacher-answer-key").value.trim();
            if (onlyBlankCard) questionList.innerHTML = "";
            questions.forEach(question => addTeacherQuestion(questionList, question));

            const withoutAnswerKey = questions.filter(question => !question.answer_key?.trim()).length;
            const elapsed = Number(data.processing_time_seconds || 0).toFixed(2);
            status.textContent = withoutAnswerKey
                ? `${questions.length} questão(ões) criadas em ${elapsed} s. ${withoutAnswerKey} está(ão) sem gabarito detectado: complete esses campos privados antes de publicar.`
                : `${questions.length} questão(ões) e gabaritos criados em ${elapsed} s. Revise os campos antes de publicar.`;
        } catch (error) {
            status.textContent = error.name === "AbortError"
                ? "A leitura passou de 6 minutos e foi cancelada. Tente enviar menos páginas por vez."
                : (error.message || "Não foi possível ler a prova.");
        } finally {
            clearTimeout(abortTimer);
            button.disabled = !fileInput.files?.[0];
        }
    });
}

function bindTeacherQuestionOcr(card) {
    const fileInput = card.querySelector(".teacher-question-image");
    const engineSelect = card.querySelector(".teacher-question-ocr-engine");
    const transcribeButton = card.querySelector(".transcribe-question");
    const status = card.querySelector(".teacher-question-ocr-status");

    fileInput.addEventListener("change", () => {
        transcribeButton.disabled = !fileInput.files?.[0];
        status.textContent = fileInput.files?.[0]
            ? "Imagem carregada. Escolha o motor e transcreva o enunciado."
            : "";
    });

    transcribeButton.addEventListener("click", async () => {
        const image = fileInput.files?.[0];
        if (!image) return;

        transcribeButton.disabled = true;
        status.textContent = "Identificando enunciado e gabarito na imagem...";
        const formData = new FormData();
        formData.append("file", image);
        formData.append("engine", engineSelect.value);

        try {
            formData.append("purpose", "assessment_question");
            const data = await apiRequest("/ocr/transcribe", {
                method: "POST",
                body: formData,
            });
            const questionText = card.querySelector(".teacher-question");
            const answerKey = card.querySelector(".teacher-answer-key");
            questionText.value = data.question ?? data.text ?? "";
            if (data.answer_key?.trim()) {
                answerKey.value = data.answer_key;
            }
            const elapsed = Number(data.processing_time_seconds || 0).toFixed(2);
            if (data.answer_key?.trim()) {
                status.textContent = `Questão e gabarito separados em ${elapsed} s. Revise os dois campos antes de publicar.`;
            } else if (engineSelect.value === "tesseract") {
                status.textContent = `Texto impresso transcrito em ${elapsed} s. O Tesseract não encontrou um rótulo de gabarito; escolha Qwen-VL ou preencha esse campo manualmente.`;
            } else {
                status.textContent = `Enunciado transcrito em ${elapsed} s, mas não encontrei uma solução ou um gabarito legível. Confira a imagem e preencha o campo privado.`;
            }
        } catch (error) {
            status.textContent = error.message || "Não foi possível transcrever a imagem.";
        } finally {
            transcribeButton.disabled = !fileInput.files?.[0];
        }
    });
}

async function loadTeacherAssessments() {
    const list = document.getElementById("teacher-assessment-list");
    try {
        const assessments = await apiRequest("/assessments");
        if (!assessments.length) {
            list.innerHTML = `<div class="empty-state"><strong>Nenhuma avaliação publicada</strong><span>Crie uma avaliação acima para que os estudantes possam responder.</span></div>`;
            return;
        }
        list.innerHTML = assessments.map(item => `
            <article class="assessment-item">
                <div><strong>${escapeHtml(item.title)}</strong><span>${item.question_count} questão(ões) · ${escapeHtml(item.teacher_name)}</span></div>
                <button type="button" class="secondary-button view-submissions" data-assessment-id="${item.id}" data-assessment-title="${escapeHtml(item.title)}">Ver respostas</button>
            </article>
        `).join("");
        list.querySelectorAll(".view-submissions").forEach(button => {
            button.addEventListener("click", () => loadSubmissions(button.dataset.assessmentId, button.dataset.assessmentTitle));
        });
    } catch (error) {
        list.innerHTML = `<div class="empty-state"><strong>Erro</strong><span>${escapeHtml(error.message)}</span></div>`;
    }
}

async function loadSubmissions(assessmentId, title) {
    const container = document.getElementById("teacher-submissions");
    container.innerHTML = `<div class="empty-state"><strong>Carregando respostas</strong><span>${escapeHtml(title)}</span></div>`;
    try {
        const rows = await apiRequest(`/assessments/${assessmentId}/submissions`);
        if (!rows.length) {
            container.innerHTML = `<div class="empty-state"><strong>Ainda sem respostas</strong><span>As tentativas dos estudantes aparecerão aqui.</span></div>`;
            return;
        }
        container.innerHTML = `<h3>Respostas: ${escapeHtml(title)}</h3>${rows.map(row => `
            <article class="submission-card">
                <strong>${escapeHtml(row.student_name)} · Questão ${row.question_order} · ${row.result.correta ? "CORRETA" : "INCORRETA"}</strong>
                <p><b>Resposta enviada:</b><br>${escapeHtml(row.student_answer)}</p>
                <p><b>Gabarito:</b><br>${escapeHtml(row.answer_key)}</p>
                <p><b>Feedback:</b> ${escapeHtml(row.result.explicacao)}</p>
                <small>${new Date(row.submitted_at).toLocaleString("pt-BR")}</small>
            </article>
        `).join("")}`;
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><strong>Erro</strong><span>${escapeHtml(error.message)}</span></div>`;
    }
}

async function renderStudentWorkspace() {
    pageTitle.textContent = "Responder avaliação";
    pageDescription.textContent = "Escolha uma questão publicada, envie uma foto da sua resposta, revise a transcrição e receba a correção.";
    workflow.innerHTML = `
        <section id="student-assessment-picker" class="assessment-section">
            <h2>Avaliações disponíveis</h2>
            <div id="student-assessment-list" class="assessment-list"><div class="empty-state"><strong>Carregando</strong><span>Buscando avaliações publicadas...</span></div></div>
        </section>
        <section id="student-question-workspace" class="assessment-section" hidden></section>
    `;
    await loadStudentAssessments();
}

async function loadStudentAssessments() {
    const list = document.getElementById("student-assessment-list");
    try {
        const assessments = await apiRequest("/assessments");
        if (!assessments.length) {
            list.innerHTML = `<div class="empty-state"><strong>Nenhuma avaliação disponível</strong><span>Quando seu professor publicar uma avaliação, ela aparecerá aqui.</span></div>`;
            return;
        }
        list.innerHTML = assessments.map(item => `
            <article class="assessment-item">
                <div><strong>${escapeHtml(item.title)}</strong><span>${item.question_count} questão(ões) · Professor(a): ${escapeHtml(item.teacher_name)}</span></div>
                <button type="button" class="primary-button open-assessment" data-assessment-id="${item.id}" data-assessment-title="${escapeHtml(item.title)}">Abrir</button>
            </article>
        `).join("");
        list.querySelectorAll(".open-assessment").forEach(button => {
            button.addEventListener("click", () => openAssessment(button.dataset.assessmentId, button.dataset.assessmentTitle));
        });
    } catch (error) {
        list.innerHTML = `<div class="empty-state"><strong>Erro</strong><span>${escapeHtml(error.message)}</span></div>`;
    }
}

async function openAssessment(assessmentId, title) {
    const section = document.getElementById("student-question-workspace");
    const picker = document.getElementById("student-assessment-picker");
    section.hidden = false;
    section.innerHTML = `<div class="empty-state"><strong>Carregando questões</strong><span>${escapeHtml(title)}</span></div>`;
    try {
        const questions = await apiRequest(`/assessments/${assessmentId}/questions`);
        section.innerHTML = `
            <div class="question-card-header"><h2>${escapeHtml(title)}</h2><button id="back-to-assessments" class="secondary-button" type="button">Voltar às avaliações</button></div>
            <p class="field-help">Envie a prova completa de uma vez ou abra cada questão para enviar uma foto da resposta. Revise toda transcrição antes de enviar para correção.</p>
            <ol id="student-workflow-progress" class="workflow-progress student-workflow-progress" aria-label="Etapas para responder uma avaliação">
                <li data-process-step="photo" aria-current="step"><span>01</span><div><strong>Foto</strong><small>Envie a página ou a resposta</small></div></li>
                <li data-process-step="transcribe"><span>02</span><div><strong>Transcrição</strong><small>Leia o texto da imagem</small></div></li>
                <li data-process-step="review"><span>03</span><div><strong>Revisão</strong><small>Confira e corrija o texto</small></div></li>
                <li data-process-step="submit"><span>04</span><div><strong>Envio</strong><small>Peça a correção</small></div></li>
                <li data-process-step="feedback"><span>05</span><div><strong>Feedback</strong><small>Veja o resultado e salve</small></div></li>
            </ol>
            <div class="document-import">
                <h3>Enviar prova completa</h3>
                <p class="field-help">Envie um PDF ou foto com suas respostas. O sistema separa a escrita manuscrita nos campos das questões desta avaliação.</p>
                <div class="ocr-controls">
                    <input id="student-assessment-file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" aria-label="PDF ou imagem da prova respondida">
                    <button id="transcribe-student-assessment-file" class="secondary-button" type="button" disabled>Separar minhas respostas</button>
                </div>
                <p id="student-assessment-import-status" class="ocr-status" aria-live="polite"></p>
            </div>
            <div id="student-question-list"></div>
            <div class="document-import">
                <h3>Enviar respostas para correção</h3>
                <p class="field-help">Depois de revisar os campos preenchidos, envie todas as respostas de uma vez. Só os campos com texto serão enviados.</p>
                <button id="submit-all-student-answers" class="primary-button" type="button">Enviar prova toda para correção</button>
                <p id="submit-all-student-status" class="ocr-status" aria-live="polite"></p>
            </div>
        `;
        document.getElementById("back-to-assessments").addEventListener("click", () => {
            section.hidden = true;
            picker.scrollIntoView({ behavior: "smooth" });
        });
        updateStudentProgress(section, "photo");
        const container = document.getElementById("student-question-list");
        if (!questions.length) {
            container.innerHTML = `<div class="empty-state"><strong>A avaliação não tem questões</strong><span>Avise o professor responsável.</span></div>`;
            return;
        }
        questions.forEach(question => renderStudentQuestion(container, assessmentId, question));
        bindStudentAssessmentImport(section, assessmentId);
        bindSubmitAllStudentAnswers(section, assessmentId);
    } catch (error) {
        section.innerHTML = `<div class="empty-state"><strong>Erro</strong><span>${escapeHtml(error.message)}</span></div>`;
    }
}

function renderStudentQuestion(container, assessmentId, question) {
    const card = document.createElement("article");
    card.className = "question-card student-question-card";
    card.dataset.questionId = question.id;
    card.innerHTML = `
        <div class="question-card-header"><h3>Questão ${question.order}</h3></div>
        <div class="assessment-question-text">${escapeHtml(question.question).replace(/\n/g, "<br>")}</div>
        <div class="form-group ocr-group">
            <label>Foto da sua resposta</label>
            <p class="field-help">Se a foto incluir o enunciado e sua resposta, use Qwen-VL para extrair só o que você escreveu. Com Tesseract, recorte apenas sua resposta.</p>
            <div class="ocr-controls">
                <input class="answer-image" type="file" accept="image/png,image/jpeg,image/webp" capture="environment">
                <select class="ocr-engine" aria-label="Motor de transcrição">
                    <option value="vision">Manuscrito ou código — Qwen-VL</option>
                    <option value="tesseract">Texto impresso — Tesseract</option>
                </select>
                <button class="secondary-button transcribe-answer" type="button" disabled>Transcrever resposta</button>
            </div>
            <div class="image-review-grid" hidden>
                <figure class="image-preview-card">
                    <figcaption>Imagem original <span>Arraste para selecionar a resposta</span></figcaption>
                    <canvas class="answer-image-preview" aria-label="Prévia da foto; arraste para selecionar a resposta"></canvas>
                </figure>
                <figure class="crop-preview-card" hidden>
                    <figcaption>Recorte para transcrição</figcaption>
                    <img class="cropped-image-preview" alt="Prévia da área recortada para transcrição">
                    <p>Confira se a resposta está inteira e legível.</p>
                </figure>
            </div>
            <div class="crop-controls" hidden>
                <span>Arraste na imagem para marcar o recorte.</span>
                <button class="secondary-button use-image-crop" type="button" disabled>Usar recorte</button>
                <button class="secondary-button use-whole-image" type="button">Usar imagem inteira</button>
            </div>
            <p class="ocr-status" aria-live="polite"></p>
        </div>
        <div class="form-group">
            <label>Sua resposta transcrita (revise antes de enviar)</label>
            <textarea class="student-answer" placeholder="Transcreva a imagem ou digite sua resposta aqui" required></textarea>
        </div>
        <button class="primary-button submit-student-answer" type="button">Enviar para correção</button>
        <div class="student-feedback" aria-live="polite"></div>
    `;
    container.appendChild(card);

    let imageToTranscribe = null;
    const transcribeButton = card.querySelector(".transcribe-answer");
    transcribeButton.addEventListener("click", async () => {
        await transcribeAnswerImage(card, imageToTranscribe, question);
    });
    bindAnswerImageCropper(card, file => {
        imageToTranscribe = file;
        transcribeButton.disabled = !file;
    });

    card.querySelector(".submit-student-answer").addEventListener("click", async event => {
        const answer = card.querySelector(".student-answer").value.trim();
        const feedback = card.querySelector(".student-feedback");
        const button = event.currentTarget;
        if (!answer) {
            feedback.innerHTML = `<p class="submission-error">Transcreva ou digite sua resposta antes de enviar.</p>`;
            return;
        }
        button.disabled = true;
        button.textContent = "Corrigindo e salvando...";
        updateStudentProgress(card.closest("#student-question-workspace"), "submit");
        feedback.innerHTML = `<p class="submission-loading" role="status">A resposta está sendo enviada para correção. Isso pode levar alguns segundos.</p>`;
        try {
            const result = await apiRequest(`/assessments/${assessmentId}/questions/${question.id}/submit`, {
                method: "POST",
                body: JSON.stringify({ student_answer: answer }),
            });
            const analysis = result.questions?.[0] || {};
            const elapsed = result.timings?.question_analysis_seconds;
            renderStudentFeedback(feedback, analysis, elapsed);
            button.textContent = "Correção salva";
            const workspace = card.closest("#student-question-workspace");
            const allQuestionsSubmitted = [...workspace.querySelectorAll(".submit-student-answer")]
                .every(submitButton => submitButton.disabled && submitButton.textContent === "Correção salva");
            updateStudentProgress(workspace, allQuestionsSubmitted ? "complete" : "review");
        } catch (error) {
            feedback.innerHTML = `<p class="submission-error">${escapeHtml(error.message)}</p>`;
            button.disabled = false;
            button.textContent = "Tentar enviar novamente";
            updateStudentProgress(card.closest("#student-question-workspace"), "review");
        }
    });

    card.querySelector(".student-answer").addEventListener("input", event => {
        if (event.currentTarget.value.trim()) {
            updateStudentProgress(card.closest("#student-question-workspace"), "review");
        }
    });
}

function updateStudentProgress(section, activeStep) {
    const list = section?.querySelector("#student-workflow-progress");
    if (!list) return;
    const steps = ["photo", "transcribe", "review", "submit", "feedback"];
    const currentIndex = activeStep === "complete" ? steps.length : steps.indexOf(activeStep);
    list.querySelectorAll("[data-process-step]").forEach(item => {
        const index = steps.indexOf(item.dataset.processStep);
        const complete = index < currentIndex;
        const current = index === currentIndex;
        item.classList.toggle("is-complete", complete);
        item.classList.toggle("is-current", current);
        item.dataset.state = complete ? "complete" : current ? "current" : "upcoming";
        if (current) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
    });
}

function renderStudentFeedback(container, analysis, elapsed) {
    container.innerHTML = `
        <section class="feedback-result ${analysis.correta ? "correct" : "incorrect"}">
            <h4>${analysis.correta ? "Resposta correta" : "Resposta incorreta"}</h4>
            <p>${escapeHtml(analysis.explicacao)}</p>
            ${analysis.erro_principal ? `<p><b>O que revisar:</b> ${escapeHtml(analysis.erro_principal)}</p>` : ""}
            ${analysis.topico ? `<p><b>Tópico:</b> ${escapeHtml(analysis.topico)}</p>` : ""}
            ${Number.isFinite(elapsed) ? `<small>Correção em ${Number(elapsed).toFixed(2)} s · Resposta salva no seu histórico.</small>` : `<small>Resposta salva no seu histórico.</small>`}
        </section>
    `;
}

function bindSubmitAllStudentAnswers(section, assessmentId) {
    const button = section.querySelector("#submit-all-student-answers");
    const status = section.querySelector("#submit-all-student-status");

    button.addEventListener("click", async () => {
        const cards = [...section.querySelectorAll(".student-question-card")];
        const answers = cards.map(card => ({
            question_id: Number(card.dataset.questionId),
            student_answer: card.querySelector(".student-answer").value.trim(),
        })).filter(answer => answer.student_answer);
        if (!answers.length) {
            status.textContent = "Preencha ou transcreva pelo menos uma resposta antes de enviar.";
            return;
        }

        button.disabled = true;
        updateStudentProgress(section, "submit");
        status.textContent = `Enviando ${answers.length} resposta(s) para correção e salvamento...`;
        const controller = new AbortController();
        const abortTimer = setTimeout(() => controller.abort(), 360000);
        try {
            const result = await apiRequest(`/assessments/${assessmentId}/submit-all`, {
                method: "POST",
                body: JSON.stringify({ answers }),
                signal: controller.signal,
            });
            const elapsed = result.timings?.question_analysis_seconds;
            (result.submissions || []).forEach(submission => {
                const card = section.querySelector(`.student-question-card[data-question-id="${submission.question_id}"]`);
                if (!card) return;
                renderStudentFeedback(card.querySelector(".student-feedback"), submission.result, elapsed);
                const singleButton = card.querySelector(".submit-student-answer");
                singleButton.disabled = true;
                singleButton.textContent = "Correção salva";
            });
            status.textContent = `${answers.length} resposta(s) corrigida(s) e salva(s) no seu histórico.`;
            button.textContent = "Prova corrigida e salva";
            updateStudentProgress(section, "complete");
        } catch (error) {
            status.textContent = error.name === "AbortError"
                ? "A correção passou de 6 minutos e foi cancelada. Tente enviar menos respostas por vez."
                : (error.message || "Não foi possível enviar a prova para correção.");
            button.disabled = false;
            updateStudentProgress(section, "review");
        } finally {
            clearTimeout(abortTimer);
        }
    });
}

function bindStudentAssessmentImport(section, assessmentId) {
    const fileInput = section.querySelector("#student-assessment-file");
    const button = section.querySelector("#transcribe-student-assessment-file");
    const status = section.querySelector("#student-assessment-import-status");

    fileInput.addEventListener("change", () => {
        button.disabled = !fileInput.files?.[0];
        if (fileInput.files?.[0]) updateStudentProgress(section, "transcribe");
        status.textContent = fileInput.files?.[0]
            ? "Arquivo carregado. A leitura pode levar alguns minutos em provas com várias páginas."
            : "";
    });

    button.addEventListener("click", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        button.disabled = true;
        updateStudentProgress(section, "transcribe");
        status.textContent = "Lendo a prova e relacionando suas respostas às questões. Aguarde...";
        const controller = new AbortController();
        const abortTimer = setTimeout(() => controller.abort(), 360000);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("assessment_id", assessmentId);
            const data = await apiRequest("/ocr/transcribe-student-assessment", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });
            const answers = (data.answers || []).filter(item => item.student_answer?.trim());
            answers.forEach(answer => {
                const card = section.querySelector(`.student-question-card[data-question-id="${answer.question_id}"]`);
                const input = card?.querySelector(".student-answer");
                if (input) input.value = answer.student_answer;
            });
            const elapsed = Number(data.processing_time_seconds || 0).toFixed(2);
            status.textContent = answers.length
                ? `${answers.length} resposta(s) separada(s) em ${elapsed} s. Revise cada campo e envie para correção.`
                : "Não encontrei respostas manuscritas legíveis. Tente uma foto mais nítida ou use o envio por questão.";
            if (answers.length) updateStudentProgress(section, "review");
        } catch (error) {
            status.textContent = error.name === "AbortError"
                ? "A leitura passou de 6 minutos e foi cancelada. Tente enviar menos páginas por vez."
                : (error.message || "Não foi possível ler sua prova.");
        } finally {
            clearTimeout(abortTimer);
            button.disabled = !fileInput.files?.[0];
        }
    });
}

function bindAnswerImageCropper(container, onImageReady) {
    const fileInput = container.querySelector(".answer-image");
    const canvas = container.querySelector(".answer-image-preview");
    const imageReview = container.querySelector(".image-review-grid");
    const cropPreviewCard = container.querySelector(".crop-preview-card");
    const cropPreviewImage = container.querySelector(".cropped-image-preview");
    const controls = container.querySelector(".crop-controls");
    const useCropButton = container.querySelector(".use-image-crop");
    const useWholeImageButton = container.querySelector(".use-whole-image");
    const status = container.querySelector(".ocr-status");
    const context = canvas.getContext("2d");
    let sourceFile = null;
    let decodedImage = null;
    let dragStart = null;
    let selection = null;
    let cropPreviewUrl = null;

    function clearCropPreview() {
        if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
        cropPreviewUrl = null;
        cropPreviewImage.removeAttribute("src");
        cropPreviewCard.hidden = true;
    }

    fileInput.addEventListener("change", async () => {
        sourceFile = fileInput.files[0] || null;
        selection = null;
        dragStart = null;
        onImageReady(null);
        useCropButton.disabled = true;
        clearCropPreview();
        imageReview.hidden = true;
        status.textContent = "";
        if (decodedImage) {
            decodedImage.close();
            decodedImage = null;
        }
        if (!sourceFile) {
            controls.hidden = true;
            return;
        }
        try {
            decodedImage = await createImageBitmap(sourceFile);
            canvas.width = decodedImage.width;
            canvas.height = decodedImage.height;
            imageReview.hidden = false;
            controls.hidden = false;
            updateStudentProgress(container.closest("#student-question-workspace"), "transcribe");
            drawPreview();
            status.textContent = "Imagem carregada. Marque a resposta ou use a imagem inteira.";
        } catch (error) {
            console.error(error);
            imageReview.hidden = true;
            controls.hidden = true;
            status.textContent = "Não foi possível abrir a imagem. Tente PNG, JPEG ou WebP.";
        }
    });

    canvas.addEventListener("pointerdown", event => {
        if (!decodedImage) return;
        onImageReady(null);
        clearCropPreview();
        dragStart = canvasPoint(event);
        selection = { x: dragStart.x, y: dragStart.y, width: 0, height: 0 };
        canvas.setPointerCapture(event.pointerId);
        useCropButton.disabled = true;
        drawPreview();
    });
    canvas.addEventListener("pointermove", event => {
        if (!dragStart) return;
        const point = canvasPoint(event);
        selection = {
            x: Math.min(dragStart.x, point.x),
            y: Math.min(dragStart.y, point.y),
            width: Math.abs(point.x - dragStart.x),
            height: Math.abs(point.y - dragStart.y),
        };
        drawPreview();
    });
    canvas.addEventListener("pointerup", () => {
        if (!dragStart || !selection) return;
        dragStart = null;
        const valid = selection.width >= 30 && selection.height >= 20;
        useCropButton.disabled = !valid;
        status.textContent = valid ? "Área selecionada. Clique em Usar recorte." : "Selecione uma área maior.";
    });
    canvas.addEventListener("pointercancel", () => {
        dragStart = null;
        selection = null;
        onImageReady(null);
        useCropButton.disabled = true;
        drawPreview();
    });
    useCropButton.addEventListener("click", () => {
        if (!decodedImage || !selection) return;
        const cropCanvas = document.createElement("canvas");
        const cropX = Math.round(selection.x);
        const cropY = Math.round(selection.y);
        cropCanvas.width = Math.min(Math.round(selection.width), canvas.width - cropX);
        cropCanvas.height = Math.min(Math.round(selection.height), canvas.height - cropY);
        cropCanvas.getContext("2d").drawImage(decodedImage, cropX, cropY, cropCanvas.width, cropCanvas.height, 0, 0, cropCanvas.width, cropCanvas.height);
        const outputType = sourceFile.type === "image/png" ? "image/png" : "image/jpeg";
        cropCanvas.toBlob(blob => {
            if (!blob) {
                status.textContent = "Não foi possível criar o recorte. Tente novamente.";
                return;
            }
            const extension = blob.type === "image/png" ? "png" : "jpg";
            const croppedFile = new File([blob], `resposta-${Date.now()}.${extension}`, { type: blob.type });
            clearCropPreview();
            cropPreviewUrl = URL.createObjectURL(blob);
            cropPreviewImage.src = cropPreviewUrl;
            cropPreviewCard.hidden = false;
            onImageReady(croppedFile);
            status.textContent = `Recorte pronto (${cropCanvas.width} × ${cropCanvas.height} px). Revise e transcreva.`;
        }, outputType, 0.94);
    });
    useWholeImageButton.addEventListener("click", () => {
        if (!sourceFile) return;
        selection = null;
        useCropButton.disabled = true;
        clearCropPreview();
        drawPreview();
        onImageReady(sourceFile);
        status.textContent = "Imagem inteira selecionada. O recorte costuma melhorar a leitura e reduzir o tempo.";
    });

    function canvasPoint(event) {
        const bounds = canvas.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(canvas.width, (event.clientX - bounds.left) * canvas.width / bounds.width)),
            y: Math.max(0, Math.min(canvas.height, (event.clientY - bounds.top) * canvas.height / bounds.height)),
        };
    }
    function drawPreview() {
        if (!decodedImage) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(decodedImage, 0, 0);
        if (selection && selection.width > 0 && selection.height > 0) {
            context.fillStyle = "rgba(10, 20, 36, .48)";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.clearRect(selection.x, selection.y, selection.width, selection.height);
            context.drawImage(
                decodedImage,
                selection.x, selection.y, selection.width, selection.height,
                selection.x, selection.y, selection.width, selection.height,
            );
            context.lineWidth = Math.max(2, canvas.width / 1000);
            context.strokeStyle = "#2563eb";
            context.fillStyle = "rgba(49, 94, 201, .1)";
            context.fillRect(selection.x, selection.y, selection.width, selection.height);
            context.strokeRect(selection.x, selection.y, selection.width, selection.height);
        }
    }
}

async function transcribeAnswerImage(card, image, question) {
    const status = card.querySelector(".ocr-status");
    const answerInput = card.querySelector(".student-answer");
    const button = card.querySelector(".transcribe-answer");
    if (!image) {
        status.textContent = "Selecione uma imagem e escolha o recorte ou a imagem inteira.";
        return;
    }
    button.disabled = true;
    updateStudentProgress(card.closest("#student-question-workspace"), "transcribe");
    status.textContent = "Lendo a imagem...";
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 180000);
    try {
        const engine = card.querySelector(".ocr-engine").value;
        const formData = new FormData();
        formData.append("file", image);
        formData.append("engine", engine);
        formData.append("purpose", "student_answer");
        formData.append("question_context", question?.question || "");
        const response = await fetch(`${API_URL}/ocr/transcribe`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
            signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(errorMessage(data));
        answerInput.value = data.student_answer ?? data.text ?? "";
        const details = [];
        if (data.model_load_time_seconds > 0) details.push(`carga do modelo ${data.model_load_time_seconds.toFixed(2)} s`);
        if (data.prompt_processing_time_seconds > 0) details.push(`leitura ${data.prompt_processing_time_seconds.toFixed(2)} s`);
        if (data.generation_time_seconds > 0) details.push(`geração ${data.generation_time_seconds.toFixed(2)} s`);
        const breakdown = details.length ? ` (${details.join("; ")})` : "";
        const elapsed = Number(data.processing_time_seconds || 0).toFixed(2);
        if (!answerInput.value.trim()) {
            status.textContent = `Não encontrei uma resposta legível na imagem (${elapsed} s). Tente outro recorte ou revise manualmente.`;
        } else if (engine === "tesseract") {
            status.textContent = `Transcrição concluída em ${elapsed} s${breakdown}. O Tesseract não separa enunciado e resposta; confira o texto ou recorte apenas sua resposta.`;
            updateStudentProgress(card.closest("#student-question-workspace"), "review");
        } else {
            status.textContent = `Resposta separada do enunciado em ${elapsed} s${breakdown}. Revise antes de enviar.`;
            updateStudentProgress(card.closest("#student-question-workspace"), "review");
        }
    } catch (error) {
        status.textContent = error.name === "AbortError"
            ? "A leitura passou de 3 minutos e foi cancelada. Veja o terminal da API ou recorte só a sua resposta."
            : (error.message || "Não foi possível conectar com a API.");
    } finally {
        clearTimeout(abortTimer);
        button.disabled = false;
    }
}

initialize();
