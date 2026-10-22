(() => {
    const LANGUAGE_KEY = "adaptive-ui-language";
    const english = {
        "Pular para o conteúdo": "Skip to content",
        "Abrir menu": "Open menu", "Fechar menu": "Close menu",
        "Ir para uma área…": "Go to a section…", "Buscar no menu": "Search menu",
        "ESPAÇO DE TRABALHO": "WORKSPACE", "Início": "Home", "Avaliações": "Assessments",
        "Gerenciar avaliações": "Manage assessments", "Responder avaliação": "Take an assessment",
        "Histórico": "History", "Meu perfil": "My performance", "Meu desempenho": "My performance",
        "Plano de estudos": "Study plan", "Sobre o projeto": "About the project",
        "Usuários": "Users", "PREFERÊNCIAS": "PREFERENCES", "Minha conta": "My account",
        "Configurações": "Settings", "Sair": "Sign out", "Aprender com propósito": "Learn with purpose",
        "Seu espaço de aprendizagem": "Your learning space", "APRENDIZAGEM ADAPTATIVA": "ADAPTIVE LEARNING",
        "Olá,": "Hello,", "Acompanhe seu desempenho, analise provas e descubra": "Track your progress, review assessments, and find",
        "quais conteúdos precisam de mais atenção.": "the topics that need more attention.",
        "Avaliações": "Assessments", "Professores publicam questões; estudantes enviam suas respostas para correção.": "Teachers publish questions; students submit answers for feedback.",
        "Acessar avaliações": "Open assessments", "Gerenciar contas": "Manage accounts",
        "Seu desempenho": "Your performance", "Acompanhe seu desempenho acumulado nas avaliações.": "Track your overall performance across assessments.",
        "Questões": "Questions", "Acertos": "Correct", "Aproveitamento": "Accuracy",
        "Prioridades de estudo": "Study priorities", "Conteúdos que atualmente precisam de mais atenção.": "Topics that currently need more attention.",
        "PREFERÊNCIAS DA CONTA": "ACCOUNT PREFERENCES", "Configurações": "Settings",
        "Personalize a aparência e a leitura do Adaptive Learning neste navegador.": "Personalize the appearance and reading experience in this browser.",
        "Aparência": "Appearance", "Escolha como o sistema acompanha sua preferência de tela.": "Choose how the interface follows your display preference.",
        "Tema": "Theme", "Você pode acompanhar o tema do dispositivo.": "Match your device theme or choose one manually.",
        "Automático": "System", "Claro": "Light", "Escuro": "Dark",
        "Leitura e acessibilidade": "Reading and accessibility", "Preferências que ajudam a deixar a interface mais confortável.": "Options to make the interface more comfortable.",
        "Tamanho da interface": "Interface size", "Aumenta textos e controles para facilitar a leitura.": "Enlarge text and controls for easier reading.",
        "Padrão": "Default", "Grande": "Large", "Muito grande": "Extra large",
        "Alto contraste": "High contrast", "Reforça contornos e diferenças entre elementos.": "Strengthen outlines and visual distinctions.",
        "Ativar alto contraste": "Enable high contrast", "Reduzir animações": "Reduce motion", "Desativa movimentos decorativos da interface.": "Reduce decorative interface motion.",
        "Idioma": "Language", "Idioma atual da interface.": "Interface language.",
        "Altera os textos da interface; enunciados e respostas permanecem no idioma original.": "Changes interface text; assessment content and answers stay in their original language.",
        "Português (Brasil)": "Portuguese (Brazil)", "Português": "Portuguese", "English": "English",
        "Conforto de leitura": "Reading comfort", "Reduza distrações e destaque os controles da página.": "Reduce distractions and make page controls easier to spot.",
        "Modo de leitura": "Reading mode", "Amplia o espaçamento e limita a largura dos textos longos.": "Adds spacing and limits the width of long text.",
        "Ativar modo de leitura": "Enable reading mode", "Destacar links": "Highlight links", "Aplica sublinhado permanente aos links.": "Always underline links.",
        "Restaurar preferências": "Reset preferences", "Volta ao tema automático e aos ajustes padrão de leitura e acessibilidade.": "Restore the system theme and default reading and accessibility options.",
        "Restaurar padrão": "Restore defaults", "Preferências salvas neste navegador.": "Preferences saved in this browser.",
        "Preferências restauradas.": "Preferences restored.", "PERSONALIZAÇÃO": "PERSONALIZATION", "Preferências rápidas": "Quick preferences",
        "Abrir preferências rápidas": "Open quick preferences", "Fechar preferências": "Close preferences",
        "Abrir todas as configurações": "Open all settings", "Salvo neste navegador.": "Saved in this browser.",
        "SUA CONTA": "YOUR ACCOUNT", "Dados do perfil": "Profile details", "Nome": "Name", "E-mail": "Email", "Perfil": "Role",
        "ATALHOS": "SHORTCUTS", "Navegue mais rápido": "Navigate faster", "Abrir busca do menu": "Open menu search", "Fechar menu ou busca": "Close menu or search",
        "As preferências ficam salvas somente neste navegador.": "Preferences are stored in this browser only.",
        "DESEMPENHO": "PERFORMANCE", "Meu perfil": "My performance", "Este perfil considera todas as respostas das suas avaliações. Use o Histórico para comparar cada tentativa e acompanhar sua evolução.": "This profile includes all your assessment answers. Use History to compare attempts and track your progress.",
        "Desempenho por tópico": "Performance by topic", "Os tópicos estão ordenados do menor para o maior aproveitamento.": "Topics are ordered from lowest to highest accuracy.",
        "Carregando desempenho...": "Loading performance…", "ADMINISTRAÇÃO": "ADMINISTRATION",
        "Gerencie contas e permissões. Professores podem criar avaliações e acompanhar respostas.": "Manage accounts and roles. Teachers can create assessments and review submissions.",
        "Carregando usuários...": "Loading users…", "Nenhum usuário encontrado": "No users found", "Não existem contas cadastradas.": "There are no registered accounts.",
        "Estudante": "Student", "Professor": "Teacher", "Administrador": "Administrator", "Salvar função": "Save role", "Excluir": "Delete", "Você": "You",
        "Função de": "Role for", "Erro": "Error", "Erro de conexão": "Connection error", "Não foi possível conectar com a API.": "Could not connect to the API.",
        "Não foi possível carregar os usuários.": "Could not load users.", "Acesso de professor necessário.": "Teacher access is required.",
        "Visão geral do sistema": "System overview", "ÁREA ADMINISTRATIVA": "ADMIN AREA", "Indicadores da plataforma e gestão de contas.": "Platform overview and account management.",
        "Contas": "Accounts", "Estudantes": "Students", "Professores": "Teachers", "Avaliações publicadas": "Published assessments",
        "Carregando indicadores…": "Loading metrics…", "Não foi possível carregar os indicadores.": "Could not load metrics.",
        "Usuários": "Users", "ID": "ID", "Salvar função": "Save role", "Estudante": "Student", "Professor": "Teacher",
        "Função atualizada.": "Role updated.", "Usuário excluído com sucesso.": "User deleted successfully.", "Não foi possível excluir o usuário.": "Could not delete the user.",
        "Não foi possível alterar a função.": "Could not update the role.", "Confirme a exclusão desta conta. Esta ação não pode ser desfeita.": "Delete this account? This action cannot be undone.",
        "Falha ao carregar": "Could not load", "Acesso indisponível": "Access unavailable", "Este perfil não pode usar as avaliações.": "This account cannot use assessments.",
        "PREFERÊNCIAS DA CONTA": "ACCOUNT PREFERENCES", "Perfil e segurança": "Profile and security",
        "PERFIL E SEGURANÇA": "PROFILE AND SECURITY", "Minha conta": "My account", "Fechar perfil": "Close profile",
        "Dados pessoais": "Personal details", "O e-mail é usado para entrar e não pode ser alterado nesta tela.": "Your email is used to sign in and cannot be changed here.",
        "Salvar nome": "Save name", "Alterar senha": "Change password", "Senha atual": "Current password", "Nova senha": "New password",
        "Use pelo menos 12 caracteres.": "Use at least 12 characters.", "Confirmar nova senha": "Confirm new password", "Atualizar senha": "Update password",
        "A senha atual não confere.": "The current password is incorrect.", "A nova senha precisa ser diferente da senha atual.": "The new password must be different from the current password.", "Senha atualizada com sucesso.": "Password updated successfully.",
        "Nome atualizado com sucesso.": "Name updated successfully.", "O nome não pode ficar em branco.": "Name cannot be blank.",
        "ESTUDO QUE ACOMPANHA VOCÊ": "LEARNING THAT ADAPTS TO YOU", "Transforme cada resposta em um próximo passo.": "Turn every answer into a next step.",
        "Analise avaliações, entenda seus pontos de atenção e organize um caminho de estudo feito a partir do seu desempenho.": "Review assessments, understand your learning needs, and follow a study path based on your performance.",
        "Envie suas respostas": "Submit your answers", "Use texto ou imagem da questão.": "Use text or an image of your work.",
        "Receba uma análise": "Get feedback", "Veja feedback e recomendações.": "Review feedback and recommendations.",
        "Projeto acadêmico · IFSul Campus Bagé": "Academic project · IFSul Bagé Campus", "BEM-VINDO DE VOLTA": "WELCOME BACK",
        "Acesse sua conta": "Sign in to your account", "Continue de onde seus estudos precisam.": "Pick up where your learning needs you.",
        "Entrar": "Sign in", "Ainda não possui uma conta?": "Don't have an account yet?", "Criar conta": "Create account",
        "Mostrar": "Show", "Ocultar": "Hide", "Mostrar senha": "Show password", "Ocultar senha": "Hide password",
        "Seu acesso é protegido e suas preferências ficam neste navegador.": "Your account is protected and preferences stay in this browser.",
        "SEU PRÓXIMO PASSO COMEÇA AQUI": "YOUR NEXT STEP STARTS HERE", "Aprenda no seu ritmo. Evolua com clareza.": "Learn at your pace. See your progress clearly.",
        "Crie sua conta para responder avaliações, acompanhar sua evolução e receber recomendações alinhadas às suas dificuldades.": "Create an account to answer assessments, track progress, and get recommendations tailored to your needs.",
        "Histórico organizado": "A clear history", "Suas correções ficam reunidas.": "Your feedback stays in one place.",
        "Estudo adaptativo": "Adaptive study", "Prioridades baseadas no seu percurso.": "Priorities based on your progress.",
        "COMECE SUA JORNADA": "START YOUR JOURNEY", "Criar sua conta": "Create your account", "Leva só um instante para começar.": "It only takes a moment to get started.",
        "Senha": "Password", "Confirmar senha": "Confirm password", "Digite a senha novamente": "Enter your password again",
        "Já possui uma conta?": "Already have an account?", "Seus dados de acesso são usados para manter seu histórico individual.": "Your sign-in details keep your personal history private.",
        "QUESTÕES E CORREÇÃO": "QUESTIONS AND FEEDBACK", "Carregando...": "Loading…", "Preparando seu espaço de avaliações.": "Preparing your assessment workspace.",
        "Espaço de avaliações": "Assessment workspace", "Voltar ao painel": "Back to dashboard", "Conectando à API...": "Connecting to the API…",
        "Resultado da análise": "Analysis result", "Seu desempenho em detalhes": "Your performance in detail", "Salvar resultado": "Save result",
        "ANÁLISE CONCLUÍDA": "ANALYSIS COMPLETE", "Resultado da avaliação": "Assessment result",
        "Confira o desempenho e a análise detalhada das suas respostas.": "Review your performance and detailed feedback.", "Erros": "Incorrect",
        "Análise das questões": "Question feedback", "PRÓXIMOS PASSOS": "NEXT STEPS", "O que estudar agora?": "What should I study next?",
        "Plano construído a partir das dificuldades encontradas nesta avaliação e no histórico do aluno.": "A study plan based on difficulties found in this assessment and your history.",
        "As recomendações serão exibidas aqui.": "Recommendations will appear here.",
        "Buscar nome ou e-mail": "Search by name or email", "Buscar usuários": "Search users", "Filtrar por perfil": "Filter by role",
        "contas": "accounts",
        "ÁREA DO PROFESSOR": "TEACHER AREA", "Publique avaliações com gabarito e acompanhe as respostas dos estudantes.": "Publish assessments with answer keys and review student submissions.",
        "Publicar uma avaliação": "Publish an assessment", "Cadastre questões e gabaritos oficiais e acompanhe as respostas dos estudantes.": "Create questions and answer keys, then review student submissions.",
        "Gerenciar avaliações": "Manage assessments", "Responder uma questão": "Answer a question", "Escolha uma avaliação, envie uma foto da resposta e receba uma correção com inteligência artificial.": "Choose an assessment, submit a photo of your answer, and receive AI feedback.",
        "Ver avaliações": "Browse assessments", "Acessar avaliações": "Open assessments", "Acompanhe seu desempenho, analise provas e descubra quais conteúdos precisam de mais atenção.": "Track your progress, review assessments, and find the topics that need more attention.",
        "APRENDIZAGEM ADAPTATIVA": "ADAPTIVE LEARNING", "Acompanhe seu desempenho acumulado nas avaliações.": "Track your overall performance across assessments.",
        "Seu desempenho": "Your performance", "Acompanhe seu desempenho acumulado nas avaliações.": "Track your overall performance across assessments.",
        "QUESTÃO E CORREÇÃO": "QUESTION AND FEEDBACK", "Minhas avaliações": "My assessments", "Responder avaliação": "Take an assessment",
        "O professor cadastra o enunciado e o gabarito oficial; o estudante envia a própria resposta para correção.": "Teachers add the prompt and answer key; students submit their own answers for feedback.",
        "Nova avaliação": "New assessment", "Para cada questão, informe o enunciado e a resposta esperada ou os critérios de correção. Você não precisa cadastrar a resposta do estudante: ele enviará a própria resposta depois. O gabarito fica protegido no servidor.": "For each question, enter the prompt and expected answer or grading criteria. Students submit their own answers later. Answer keys stay protected on the server.",
        "Etapas para publicar uma avaliação": "Steps to publish an assessment", "Importe ou escreva": "Import or write", "PDF, foto ou cadastro manual": "PDF, photo, or manual entry",
        "Revise as questões": "Review the questions", "Confira os enunciados e gabaritos": "Check prompts and answer keys", "Publique": "Publish", "O estudante responde depois": "Students answer later",
        "Importar prova completa": "Import a complete assessment", "Envie uma foto ou um PDF de até 8 páginas. O Qwen-VL separa as questões e os gabaritos em cartões para você revisar antes de publicar.": "Upload a photo or PDF of up to 8 pages. Qwen-VL separates questions and answer keys into cards for review before publishing.",
        "Título": "Title", "Adicionar questão": "Add question", "Publicar avaliação": "Publish assessment", "Avaliações publicadas": "Published assessments",
        "Foto da questão e do gabarito (opcional)": "Photo of the question and answer key (optional)", "Digite ou revise aqui o enunciado que o estudante verá": "Enter or review the question students will see",
        "Gabarito oficial ou critérios de correção (privado)": "Official answer key or grading criteria (private)", "Informe a solução esperada, os passos importantes ou os critérios para aceitar respostas equivalentes": "Enter the expected solution, key steps, or criteria for accepting equivalent answers",
        "Este conteúdo é usado pelo sistema para corrigir e fica oculto para o estudante.": "The system uses this content for grading; students cannot see it.",
        "A resposta está correta": "The answer is correct", "A resposta precisa de revisão": "The answer needs review", "Ver respostas": "View submissions", "Respostas enviadas": "Submitted answers",
        "Voltar às avaliações": "Back to assessments", "Resposta do aluno": "Student answer", "Transcrever resposta": "Transcribe answer", "Enviar para correção": "Submit for feedback",
        "O que estudar agora?": "What should I study next?", "Sobre o projeto": "About the project", "A proposta": "The project", "Como funciona": "How it works", "Tecnologias": "Technologies",
        "SOBRE O PROJETO": "ABOUT THE PROJECT", "CONSTRUÇÃO DO PROJETO": "PROJECT BUILD", "Desenvolvido por": "Developed by",
        "Encerrar sessão": "Sign out", "Conta": "Account", "Estatísticas da plataforma": "Platform statistics",
        "COMO FUNCIONA": "HOW IT WORKS", "O sistema aprende com seu desempenho": "The system learns from your performance",
        "A cada avaliação, suas respostas são analisadas, seus erros são identificados e os conteúdos que precisam de mais atenção são encontrados.": "Each assessment is analyzed to identify errors and topics that may need more attention.",
        "Você responde": "You answer", "Faça uma avaliação.": "Complete an assessment.", "A IA analisa": "AI analyzes", "Seus erros e tópicos são identificados.": "Your errors and topics are identified.",
        "O estudo se adapta": "Your study adapts", "Suas prioridades são definidas.": "Your priorities are set.", "Preparar avaliação": "Prepare an assessment",
        "ACOMPANHAMENTO": "PROGRESS", "Acompanhe suas avaliações e sua evolução ao longo do tempo.": "Track your assessments and progress over time.",
        "Carregando histórico": "Loading history", "Buscando suas tentativas recentes.": "Fetching your recent attempts.",
        "Este perfil considera todas as respostas das suas avaliações. Use o Histórico para comparar cada tentativa e acompanhar sua evolução.": "This profile includes all your assessment answers. Use History to compare attempts and track your progress.",
        "Os tópicos estão ordenados do menor para o maior aproveitamento.": "Topics are ordered from lowest to highest accuracy.",
        "Seu plano é gerado com base no seu desempenho acumulado e nas dificuldades identificadas pelo sistema.": "Your plan is based on your overall performance and the learning needs identified by the system.",
        "Carregando plano...": "Loading study plan…", "O sistema está analisando seu histórico.": "The system is reviewing your history.",
        "PROJETO": "PROJECT", "Sobre o Adaptive Learning": "About Adaptive Learning", "Como a plataforma transforma respostas de avaliações em feedback e prioridades de estudo.": "How the platform turns assessment answers into feedback and study priorities.",
        "PROPÓSITO DO TCC": "PROJECT GOAL", "Feedback que ajuda o aluno a saber o próximo passo": "Feedback that helps learners choose their next step",
        "O Adaptive Learning é um protótipo acadêmico para apoiar o ensino de lógica e programação em C. Em vez de guardar apenas uma nota, ele analisa a resposta, explica o principal ponto a revisar e acompanha como o desempenho muda entre as tentativas.": "Adaptive Learning is an academic prototype for teaching logic and C programming. Instead of storing only a score, it analyzes answers, explains what to review, and tracks performance across attempts.",
        "O foco": "The focus", "Usar evidências das respostas para orientar o estudo, mantendo o professor responsável pela avaliação e pelos critérios.": "Use evidence from student answers to guide study while leaving assessment and grading criteria in the teacher's hands.",
        "UM FLUXO PARA CADA PAPEL": "A WORKFLOW FOR EVERY ROLE", "Professor publica. Aluno responde.": "Teachers publish. Students respond.",
        "Cria avaliações, informa o gabarito ou critérios privados e acompanha as respostas recebidas.": "Creates assessments, provides private answer keys or grading criteria, and reviews submissions.",
        "Envia uma foto ou prova, revisa a transcrição, solicita a correção e consulta o feedback.": "Uploads a photo or assessment, reviews the transcription, requests feedback, and reviews the results.",
        "Gerencia usuários e atribui os papéis de estudante e professor.": "Manages user accounts and assigns student and teacher roles.",
        "DA RESPOSTA AO ESTUDO": "FROM ANSWER TO STUDY PLAN", "Fluxo atual do protótipo": "Current prototype workflow", "Avaliação": "Assessment",
        "O professor cadastra questões e critérios de correção. O gabarito fica no servidor.": "The teacher adds questions and grading criteria. The answer key stays on the server.",
        "Imagem e revisão": "Image and review", "O aluno envia uma página ou foto, confere o texto transcrito e pode corrigi-lo antes de enviar.": "The student uploads a page or photo, reviews the transcription, and can edit it before submitting.",
        "Correção e feedback": "Grading and feedback", "O modelo compara a resposta com os critérios, identifica tópico e erro principal e explica o resultado.": "The model compares an answer with the criteria, identifies its topic and main error, and explains the result.",
        "Histórico e plano": "History and study plan", "As tentativas formam um perfil acumulado. O plano destaca dificuldades comprovadas no histórico.": "Attempts build an overall profile. The study plan highlights needs shown in the history.",
        "O perfil usa o histórico completo": "The profile uses your full history", "O desempenho considera as respostas de todas as avaliações registradas para aquele aluno. Assim, uma dificuldade recorrente não desaparece por causa de uma única prova recente. A tela de Histórico mantém cada tentativa disponível para comparar os resultados.": "Performance includes answers from every recorded assessment. Recurring difficulties remain visible even after a single strong result, and History keeps each attempt available for comparison.",
        "A proposta é acompanhar o conjunto de evidências; a interpretação pedagógica continua dependendo do contexto da turma e do professor.": "The platform tracks evidence over time; pedagogical interpretation still depends on the teacher and classroom context.",
        "IA E OCR": "AI AND OCR", "Modelos locais com revisão humana": "Local models with human review",
        "O Ollama executa Qwen3 para correção e plano de estudos e Qwen3-VL para ler manuscrito e separar questões. O Tesseract atende ao texto impresso. O estudante pode revisar a transcrição; o professor define o gabarito e os critérios.": "Ollama runs Qwen3 for feedback and study plans, Qwen3-VL for handwriting and question separation, and Tesseract for printed text. Students can review transcriptions; teachers define answer keys and criteria.",
        "A leitura e a correção podem falhar. O feedback é apoio ao estudo e não substitui a decisão docente.": "OCR and grading can be wrong. Feedback supports learning and does not replace a teacher's judgment.",
        "ACESSIBILIDADE": "ACCESSIBILITY", "Opções para diferentes formas de uso": "Options for different ways of learning",
        "O site inclui tema claro e escuro, contraste reforçado, redução de movimento e controles adaptados a telas menores. O widget oficial VLibras permite solicitar tradução de conteúdo selecionado para Libras.": "The site includes light and dark themes, stronger contrast, reduced motion, and controls for smaller screens. The official VLibras widget can translate selected content into Brazilian Sign Language.",
        "Conheça o VLibras": "Explore VLibras", "Desenvolvido por": "Developed by", "Instituto Federal Sul-rio-grandense (IFSul) · Campus Bagé": "Instituto Federal Sul-rio-grandense (IFSul) · Bagé Campus",
        "Todos os perfis": "All roles", "Administradores": "Administrators", "Atualizar": "Refresh", "Busque por nome ou e-mail e filtre por perfil.": "Search by name or email and filter by role.",
        "Desempenho": "Performance", "ÁREA DO ADMINISTRADOR": "ADMIN AREA", "Acompanhe a plataforma e gerencie contas e permissões.": "Monitor the platform and manage accounts and roles.",
        "As senhas novas não coincidem.": "The new passwords do not match.", "Salvando…": "Saving…", "Atualizando…": "Updating…", "Enviando foto…": "Uploading photo…",
        "O arquivo não é uma imagem válida.": "The file is not a valid image.", "Envie uma imagem PNG, JPEG ou WebP.": "Upload a PNG, JPEG, or WebP image.",
        "Este conteúdo é usado pelo sistema para corrigir e fica oculto para o estudante.": "The system uses this content for grading; students cannot see it.",
        "Clique para continuar": "Click to continue", "Página inicial": "Home page",
    };

    const readLanguage = () => {
        try { return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "pt-BR"; }
        catch { return "pt-BR"; }
    };
    let language = readLanguage();
    const originalText = new WeakMap();
    const originalAttributes = new WeakMap();
    const renderedText = new WeakMap();
    const renderedAttributes = new WeakMap();
    const normalize = value => value.replace(/\s+/g, " ").trim();
    const translated = value => english[normalize(value)];
    const forbidden = "SCRIPT, STYLE, NOSCRIPT, TEXTAREA, CODE, PRE";

    function transformText(node) {
        const current = node.nodeValue;
        if (renderedText.has(node) && current !== renderedText.get(node)) {
            originalText.set(node, current);
            renderedText.delete(node);
        }
        if (!originalText.has(node)) originalText.set(node, current);
        const original = originalText.get(node);
        if (language === "pt-BR") {
            if (node.nodeValue !== original) node.nodeValue = original;
            renderedText.delete(node);
            return;
        }
        const result = translated(original);
        if (!result) { renderedText.delete(node); return; }
        const leading = original.match(/^\s*/)?.[0] || "";
        const trailing = original.match(/\s*$/)?.[0] || "";
        const nextValue = `${leading}${result}${trailing}`;
        if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
        renderedText.set(node, nextValue);
    }

    function transformAttribute(element, attribute) {
        if (!element.hasAttribute(attribute)) return;
        let saved = originalAttributes.get(element);
        if (!saved) { saved = new Map(); originalAttributes.set(element, saved); }
        let rendered = renderedAttributes.get(element);
        if (!rendered) { rendered = new Map(); renderedAttributes.set(element, rendered); }
        const current = element.getAttribute(attribute);
        if (rendered.has(attribute) && current !== rendered.get(attribute)) {
            saved.set(attribute, current);
            rendered.delete(attribute);
        }
        if (!saved.has(attribute)) saved.set(attribute, element.getAttribute(attribute));
        const original = saved.get(attribute);
        if (language === "pt-BR") {
            if (element.getAttribute(attribute) !== original) element.setAttribute(attribute, original);
            rendered.delete(attribute);
            return;
        }
        const result = translated(original);
        if (result) {
            if (element.getAttribute(attribute) !== result) element.setAttribute(attribute, result);
            rendered.set(attribute, result);
        } else rendered.delete(attribute);
    }

    function translateElement(root) {
        if (root.nodeType === Node.TEXT_NODE) { transformText(root); return; }
        if (root.nodeType !== Node.ELEMENT_NODE && root !== document) return;
        const scope = root === document ? document.body : root;
        if (scope.nodeType === Node.ELEMENT_NODE && scope.matches(forbidden)) return;
        if (scope.nodeType === Node.ELEMENT_NODE && scope.closest("[data-no-translate]")) return;
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const parent = node.parentElement;
                return parent && !parent.closest(forbidden) && !parent.closest("[data-no-translate]")
                    ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            },
        });
        let node;
        while ((node = walker.nextNode())) transformText(node);
        if (scope.nodeType === Node.ELEMENT_NODE) {
            ["aria-label", "placeholder", "title", "alt"].forEach(attribute => transformAttribute(scope, attribute));
            scope.querySelectorAll("[aria-label], [placeholder], [title], [alt]").forEach(element => {
                if (element.closest("[data-no-translate]")) return;
                ["aria-label", "placeholder", "title", "alt"].forEach(attribute => transformAttribute(element, attribute));
            });
        }
    }

    function applyLanguage(nextLanguage, persist = true) {
        language = nextLanguage === "en" ? "en" : "pt-BR";
        if (persist) {
            try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* The current page still adopts the selected language. */ }
        }
        document.documentElement.lang = language === "en" ? "en" : "pt-BR";
        const titles = {
            "Painel | Adaptive Learning": "Dashboard | Adaptive Learning",
            "Avaliações | Adaptive Learning": "Assessments | Adaptive Learning",
            "Entrar | Adaptive Learning": "Sign in | Adaptive Learning",
            "Criar conta | Adaptive Learning": "Create account | Adaptive Learning",
            "Resultado | Adaptive Learning": "Results | Adaptive Learning",
        };
        const translatedTitle = titles[document.title];
        if (language === "en" && translatedTitle) document.title = translatedTitle;
        else if (language === "pt-BR") {
            const portugueseTitle = Object.entries(titles).find(([, englishTitle]) => englishTitle === document.title)?.[0];
            if (portugueseTitle) document.title = portugueseTitle;
        }
        translateElement(document);
        document.querySelectorAll("#language-setting, #quick-language-setting").forEach(select => {
            select.value = language;
        });
        window.dispatchEvent(new CustomEvent("adaptive:language-change", { detail: { language } }));
    }

    window.AdaptiveI18n = {
        setLanguage: applyLanguage,
        getLanguage: () => language,
        translateText: value => language === "en" ? translated(String(value)) || value : value,
    };

    document.querySelectorAll("#language-setting, #quick-language-setting").forEach(select => {
        select.addEventListener("change", event => applyLanguage(event.target.value));
    });
    window.addEventListener("storage", event => {
        if (event.key === LANGUAGE_KEY) applyLanguage(readLanguage(), false);
    });

    const observer = new MutationObserver(records => {
        for (const record of records) {
            if (record.type === "characterData") transformText(record.target);
            else {
                record.addedNodes.forEach(node => translateElement(node));
                if (record.type === "attributes") transformAttribute(record.target, record.attributeName);
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title", "alt"] });
    applyLanguage(language);
})();
