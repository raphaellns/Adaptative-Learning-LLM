# Adaptive Learning LLM

An AI-powered adaptive learning system designed to analyze programming assessments, identify students' learning gaps, and generate personalized study plans based on their performance.

The project aims to combine Large Language Models with educational data to provide individualized learning support, helping students understand their mistakes and focus their studies on the topics where they need the most improvement.

## Author

**Raphaell Nunes e Silva**

Instituto Federal Sul-rio-grandense (IFSul)
Campus Bagé

## Overview

Traditional assessment systems generally focus on determining whether an answer is correct or incorrect. This project goes further by analyzing the student's response in context and using the results to build an individualized learning profile.

The system analyzes programming questions and student answers to identify:

* Whether the answer is correct
* The main error made by the student
* The main topic involved
* A didactic explanation of the mistake
* Recommended topics and activities for further study

The collected performance data is used to identify learning priorities and generate personalized study plans.

## Objectives

The main objective of the project is to develop an adaptive learning environment capable of using artificial intelligence to personalize the learning process.

The system is designed to:

* Analyze programming assessments automatically
* Identify conceptual, logical, and technical mistakes
* Track student performance over time
* Identify topics with greater learning difficulties
* Generate personalized study recommendations
* Adapt future study plans according to the student's history
* Provide a foundation for integrating educational materials into the analysis process

## How It Works

The general process can be summarized as:

```text
Assessment
    ↓
Question and Answer Analysis
    ↓
Error and Topic Identification
    ↓
Student Performance Profile
    ↓
Learning Priorities
    ↓
Personalized Study Plan
    ↓
Historical Performance
    ↓
Adaptive Recommendations
```

The system uses a Large Language Model to interpret the student's responses rather than relying exclusively on predefined answer matching.

## Artificial Intelligence

The project uses **Qwen3** as the language model, running locally through **Ollama**.

Local inference allows the system to process student data without depending on external AI APIs and provides greater control over the model used during development and evaluation.

The AI component is responsible for understanding the question, comparing the student's response with the expected solution, identifying errors, classifying the main topic, and generating educational feedback.

## Initial Learning Domain

The initial educational domain is **Algorithms I**, with a focus on programming fundamentals using the **C programming language**.

The system is designed so that the same architecture can later be expanded to other subjects and learning domains.

## Technology Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* Pydantic

### Artificial Intelligence

* Qwen3
* Ollama

### Frontend

* HTML
* CSS
* JavaScript

## Database

PostgreSQL is used as the persistence layer for the application.

The database stores information required for user management, assessments, question analyses, and student performance history.

This persistent data allows the system to build a long-term learning profile instead of treating each assessment as an isolated event.

## Adaptive Learning

The central concept of the project is the use of historical performance to personalize future recommendations.

For example, repeated difficulties in a specific topic can increase its priority in the student's study plan, while topics with consistently strong performance can receive less emphasis.

This creates a continuous cycle:

```text
Study
  ↓
Assessment
  ↓
Analysis
  ↓
Feedback
  ↓
Personalized Study Plan
  ↓
Study
```

## Validation

The language model is evaluated using manually labeled programming questions.

The evaluation considers different aspects of the analysis, including:

* Correct/incorrect answer classification
* Topic classification
* Identification of the student's main error
* Consistency of the generated explanation

The validation process is intended to measure how reliably the model can support the educational objectives of the system.

## Future Expansion

The architecture is designed to support additional capabilities such as:

* OCR-based exam input
* Historical performance analysis
* Retrieval-Augmented Generation (RAG)
* Integration with course and educational materials
* More advanced adaptive learning strategies
* Web and mobile interfaces
* Additional programming languages and academic subjects

## Running the Project

### Clone the repository

```bash
git clone https://github.com/raphaellns/Adaptative-Learning-LLM.git
cd Adaptative-Learning-LLM
```

### Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate
```

### Install dependencies

```bash
python -m pip install -r requirements.txt
```

### Configure the environment

Create a `.env` file and configure the required environment variables.

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/adaptive_learning
```

### Start the API

```bash
uvicorn app.api:app --reload
```

The API documentation will be available at:

```text
http://127.0.0.1:8000/docs
```

### Start the frontend

```bash
cd frontend
python3 -m http.server 5500
```

The frontend will be available at:

```text
http://127.0.0.1:5500
```

## Fluxo funcional de uma questão

O protótipo agora separa quem publica a questão de quem responde:

1. Uma conta com papel **Professor** cadastra uma avaliação, o enunciado e o gabarito oficial.
2. A conta de **Estudante** vê apenas as avaliações publicadas e o enunciado. O gabarito permanece no servidor.
3. O estudante envia uma foto da resposta, escolhe Qwen-VL para manuscrito/código ou Tesseract para texto impresso e pode recortar a imagem.
4. A transcrição aparece em um campo editável. O estudante revisa o texto e envia para correção.
5. A API busca o gabarito salvo, chama o analisador, grava a resposta e a análise no histórico do estudante e devolve o feedback.

O envio de uma resposta usa `POST /assessments/{assessment_id}/questions/{question_id}/submit`. A rota de estudante não aceita gabarito no corpo. A rota manual antiga `POST /exam/analyze` fica restrita a professores e administradores.

As tabelas `assessments`, `assessment_questions` e `assessment_submissions` são uma migração explícita: a API não tenta criar tabelas durante a inicialização, pois a conta de execução não precisa ter permissão de DDL. O arquivo `database/schema.sql` inclui essas tabelas para instalações novas. Para uma base existente, a pessoa responsável pelo banco deve executar `database/migrations/001_assessment_workflow.sql` como proprietária do schema. A migração concede à conta indicada acesso às tabelas novas. A conexão da API continua configurada em `DATABASE_URL`.

## Testar no navegador

1. Em uma sessão SQL com permissão de criação no schema `public`, execute a migração. Se usar `psql`, informe `app_role` com o nome de usuário que aparece na URL `DATABASE_URL` da API:

   ```bash
   psql "$DATABASE_OWNER_URL" -v app_role='USUARIO_DA_API' -f database/migrations/001_assessment_workflow.sql
   ```

   `DATABASE_OWNER_URL` precisa apontar para a mesma base, usando a conta proprietária do schema. A API não precisa usar essa conta.
2. Inicie PostgreSQL, a API e o servidor do diretório `frontend`, como descrito acima.
3. Entre com a conta que já possui papel `ADMIN`. Em **Usuários**, altere uma conta de estudante para **Professor** e salve.
4. Saia, entre com essa conta de professor e abra **Gerenciar avaliações**. Cadastre um título, um enunciado e o gabarito oficial e publique.
5. Saia e entre com uma conta de estudante. Abra **Responder avaliação**, selecione a avaliação, carregue uma foto da resposta e recorte a área relevante.
6. Transcreva, revise/edite o texto e envie para correção. Confira o feedback na tela e depois abra **Histórico**.
7. Entre novamente como professor e use **Ver respostas** na avaliação para consultar o envio e a correção.

Contas novas sempre começam como `STUDENT`; não é possível escolher `TEACHER` ou `ADMIN` durante o cadastro. Se ainda não existir uma conta administradora na base, a primeira conta `ADMIN` precisa ser provisionada diretamente no banco conforme o procedimento de desenvolvimento do projeto.

O OCR aceita PNG, JPEG e WebP de até 10 MB. A rota `POST /ocr/transcribe` exige autenticação e recebe os campos multipart `file` e `engine` (`vision` ou `tesseract`). A correção de cada resposta usa o modelo de análise já configurado no backend. O plano de estudos não é recalculado a cada envio, para evitar uma chamada extra de LLM no fluxo de correção.

Nesta etapa, o professor cadastra o enunciado e o gabarito manualmente e o estudante responde uma questão por vez. Importar uma prova inteira e extrair enunciado/gabarito automaticamente ficam para uma etapa posterior.

Qwen-VL processing reports the total request time, model load time, image/prompt processing time, and text generation time separately. The first request after a model unload includes the load; the model is kept warm for 15 minutes after an OCR request. Compare a cold request with a second request using a similarly sized crop to measure warm performance.

Tesseract also requires the system executable and Portuguese language data. On Debian or Ubuntu, install `tesseract-ocr` and `tesseract-ocr-por` if they are not already present.

## Academic Context

This project is being developed as an academic project at the **Instituto Federal Sul-rio-grandense (IFSul), Campus Bagé**, with the objective of exploring the application of Large Language Models and adaptive learning techniques in programming education.
