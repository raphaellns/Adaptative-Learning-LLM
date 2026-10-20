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
            <form id="assessment-form">
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

function addTeacherQuestion(container) {
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
            <p class="field-help">Abra uma questão e envie uma foto da sua resposta. Revise a transcrição antes de enviar para correção.</p>
            <div id="student-question-list"></div>
        `;
        document.getElementById("back-to-assessments").addEventListener("click", () => {
            section.hidden = true;
            picker.scrollIntoView({ behavior: "smooth" });
        });
        const container = document.getElementById("student-question-list");
        if (!questions.length) {
            container.innerHTML = `<div class="empty-state"><strong>A avaliação não tem questões</strong><span>Avise o professor responsável.</span></div>`;
            return;
        }
        questions.forEach(question => renderStudentQuestion(container, assessmentId, question));
    } catch (error) {
        section.innerHTML = `<div class="empty-state"><strong>Erro</strong><span>${escapeHtml(error.message)}</span></div>`;
    }
}

function renderStudentQuestion(container, assessmentId, question) {
    const card = document.createElement("article");
    card.className = "question-card student-question-card";
    card.innerHTML = `
        <div class="question-card-header"><h3>Questão ${question.order}</h3></div>
        <div class="assessment-question-text">${escapeHtml(question.question).replace(/\n/g, "<br>")}</div>
        <div class="form-group ocr-group">
            <label>Foto da sua resposta</label>
            <p class="field-help">Se a foto incluir o enunciado e sua resposta, use Qwen-VL para extrair só o que você escreveu. Com Tesseract, recorte apenas sua resposta.</p>
            <div class="ocr-controls">
                <input class="answer-image" type="file" accept="image/png,image/jpeg,image/webp">
                <select class="ocr-engine" aria-label="Motor de transcrição">
                    <option value="vision">Manuscrito ou código — Qwen-VL</option>
                    <option value="tesseract">Texto impresso — Tesseract</option>
                </select>
                <button class="secondary-button transcribe-answer" type="button" disabled>Transcrever resposta</button>
            </div>
            <canvas class="answer-image-preview" aria-label="Prévia da foto; arraste para selecionar a resposta" hidden></canvas>
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
        feedback.innerHTML = `<p class="field-help">A resposta está sendo enviada para correção. Isso pode levar alguns segundos.</p>`;
        try {
            const result = await apiRequest(`/assessments/${assessmentId}/questions/${question.id}/submit`, {
                method: "POST",
                body: JSON.stringify({ student_answer: answer }),
            });
            const analysis = result.questions?.[0] || {};
            const elapsed = result.timings?.question_analysis_seconds;
            feedback.innerHTML = `
                <section class="feedback-result ${analysis.correta ? "correct" : "incorrect"}">
                    <h4>${analysis.correta ? "Resposta correta" : "Resposta incorreta"}</h4>
                    <p>${escapeHtml(analysis.explicacao)}</p>
                    ${analysis.erro_principal ? `<p><b>O que revisar:</b> ${escapeHtml(analysis.erro_principal)}</p>` : ""}
                    ${analysis.topico ? `<p><b>Tópico:</b> ${escapeHtml(analysis.topico)}</p>` : ""}
                    ${Number.isFinite(elapsed) ? `<small>Correção em ${Number(elapsed).toFixed(2)} s · Resposta salva no seu histórico.</small>` : `<small>Resposta salva no seu histórico.</small>`}
                </section>
            `;
            button.textContent = "Correção salva";
        } catch (error) {
            feedback.innerHTML = `<p class="submission-error">${escapeHtml(error.message)}</p>`;
            button.disabled = false;
            button.textContent = "Tentar enviar novamente";
        }
    });
}

function bindAnswerImageCropper(container, onImageReady) {
    const fileInput = container.querySelector(".answer-image");
    const canvas = container.querySelector(".answer-image-preview");
    const controls = container.querySelector(".crop-controls");
    const useCropButton = container.querySelector(".use-image-crop");
    const useWholeImageButton = container.querySelector(".use-whole-image");
    const status = container.querySelector(".ocr-status");
    const context = canvas.getContext("2d");
    let sourceFile = null;
    let decodedImage = null;
    let dragStart = null;
    let selection = null;

    fileInput.addEventListener("change", async () => {
        sourceFile = fileInput.files[0] || null;
        selection = null;
        dragStart = null;
        onImageReady(null);
        useCropButton.disabled = true;
        status.textContent = "";
        if (decodedImage) {
            decodedImage.close();
            decodedImage = null;
        }
        if (!sourceFile) {
            canvas.hidden = true;
            controls.hidden = true;
            return;
        }
        try {
            decodedImage = await createImageBitmap(sourceFile);
            canvas.width = decodedImage.width;
            canvas.height = decodedImage.height;
            canvas.hidden = false;
            controls.hidden = false;
            drawPreview();
            status.textContent = "Imagem carregada. Marque a resposta ou use a imagem inteira.";
        } catch (error) {
            console.error(error);
            canvas.hidden = true;
            controls.hidden = true;
            status.textContent = "Não foi possível abrir a imagem. Tente PNG, JPEG ou WebP.";
        }
    });

    canvas.addEventListener("pointerdown", event => {
        if (!decodedImage) return;
        onImageReady(null);
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
            onImageReady(croppedFile);
            status.textContent = `Recorte pronto (${cropCanvas.width} × ${cropCanvas.height} px). Revise e transcreva.`;
        }, outputType, 0.94);
    });
    useWholeImageButton.addEventListener("click", () => {
        if (!sourceFile) return;
        selection = null;
        useCropButton.disabled = true;
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
            context.lineWidth = Math.max(2, canvas.width / 1000);
            context.strokeStyle = "#2563eb";
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
        } else {
            status.textContent = `Resposta separada do enunciado em ${elapsed} s${breakdown}. Revise antes de enviar.`;
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