# Adaptive Learning LLM

> Protótipo acadêmico de aprendizagem adaptativa para avaliações de lógica de programação e linguagem C.

O sistema permite que professores publiquem questões com critérios privados de correção e que estudantes enviem respostas digitadas ou fotografadas. A aplicação usa modelos locais para transcrever manuscritos, analisar respostas, explicar dificuldades e organizar prioridades de estudo a partir do histórico.

> **Escopo:** este é um protótipo de TCC. OCR e feedback gerado por IA podem conter erros; o estudante revisa transcrições e o professor continua responsável pela avaliação pedagógica.

## O que o sistema faz

- **Professor:** cria e publica avaliações, importa uma prova completa por PDF/imagem, revisa as questões e os gabaritos extraídos e consulta respostas dos estudantes.
- **Estudante:** escolhe uma avaliação, envia uma foto por questão ou a prova inteira, revisa as transcrições, envia respostas individualmente ou em lote e recebe feedback.
- **OCR:** usa Qwen3-VL para manuscrito e análise de documentos; oferece Tesseract para transcrever texto impresso em imagens individuais. O aluno pode recortar uma região antes da leitura.
- **Correção:** compara a resposta com os critérios cadastrados pelo professor e devolve classificação, tópico, explicação e recomendações.
- **Histórico e adaptação:** guarda as tentativas, mostra feedback por questão e calcula o perfil usando todas as respostas registradas. O plano foca nos tópicos com erros observados e fica em cache na API enquanto o histórico não muda.
- **Acessibilidade:** oferece tema claro/escuro, contraste reforçado, redução de movimento, layout adaptável e o widget VLibras.

O gabarito de uma avaliação publicada permanece no servidor: a rota de consulta do estudante devolve o enunciado, mas não os critérios privados.

## Validação e apresentação

O repositório contém um conjunto sintético/de referência de 30 respostas para avaliar a classificação e o tópico identificados pelo modelo. As imagens, provas e saídas locais de OCR em `data/ocr/` são arquivos de teste e ficam fora do Git; o conjunto pequeno em `data/questions.py` permanece versionado para permitir reproduzir a avaliação. A avaliação registra também latência e matriz de confusão. Para OCR, há um avaliador de CER/WER e separação de questões que usa transcrições de referência revisadas por uma pessoa.

O autor já executou 30 chamadas do avaliador de correção e informou 100% de acerto tanto na classificação de corretude quanto na identificação do tópico. Esse resultado exploratório vale para os 30 casos de referência e não comprova generalização para respostas reais em escala; veja as limitações e o protocolo de repetição em [validação](docs/VALIDACAO.md). Métricas de OCR ainda dependem de transcrições de referência revisadas. Consulte também [a arquitetura](docs/ARQUITETURA.md) e [o roteiro da banca](docs/ROTEIRO_BANCA.md).

Execute o avaliador de correção com python -m app.main; use --limit 2 para uma verificação rápida ou --output /tmp/avaliacao-llm.json para salvar o relatório.

## Como o fluxo funciona

```text
Professor cria avaliação e critérios
                  ↓
Estudante envia foto/PDF e revisa a transcrição
                  ↓
API consulta os critérios privados e chama o modelo de correção
                  ↓
Feedback e tentativa são salvos no PostgreSQL
                  ↓
Perfil acumulado e plano de estudos destacam dificuldades recorrentes
```

O plano usa evidências acumuladas de todas as avaliações, mas envia ao modelo apenas um resumo compacto dos tópicos prioritários e de erros representativos. Isso reduz o tamanho da chamada sem descartar os totais do histórico.

## Tecnologias

| Parte | Tecnologias |
|---|---|
| API | Python, FastAPI, SQLAlchemy, Pydantic |
| Banco de dados | PostgreSQL |
| Modelos locais | Ollama, Qwen3 e Qwen3-VL |
| OCR impresso | Tesseract com idioma português |
| Interface | HTML, CSS e JavaScript |
| Libras | [VLibras Widget](https://vlibras.gov.br/app/), serviço oficial do governo federal |

## Requisitos

- Python 3.11 ou superior (Pillow 13 deixou de suportar Python 3.10)
- PostgreSQL
- Ollama com os modelos configurados abaixo
- Tesseract OCR e dados do idioma português (`por`) para o modo de texto impresso
- Navegador moderno; acesso à internet para carregar o widget VLibras

O VLibras é carregado pelo script oficial do projeto em cada página; a [documentação de integração](https://vlibras.gov.br/doc/widget/installation/webpageintegration.html) informa que o widget é inicializado automaticamente. É uma ferramenta de apoio: a tradução automática não substitui um intérprete humano.

Modelos padrão usados pelo projeto:

```text
ANALYSIS_MODEL=qwen3:4b
STUDY_PLAN_MODEL=qwen3:4b
OCR_VISION_MODEL=qwen3-vl:4b-instruct
LLM_TIMEOUT=180
OLLAMA_MAX_CONCURRENT=1
```

Os nomes podem ser alterados por variáveis de ambiente. Os modelos precisam estar disponíveis no Ollama do computador que executa a API. A primeira inferência após descarregar um modelo pode levar mais tempo; o desempenho também depende de RAM/VRAM e da resolução da imagem.

## Instalação local

Clone o repositório e entre na pasta:

```bash
git clone https://github.com/raphaellns/Adaptative-Learning-LLM.git
cd Adaptative-Learning-LLM
```

Crie o ambiente e instale as dependências da API:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Instale/configure PostgreSQL, Tesseract com o pacote `por` e Ollama conforme o sistema operacional. No Ollama, disponibilize os modelos usados pela aplicação:

```bash
ollama pull qwen3:4b
ollama pull qwen3-vl:4b-instruct
```

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/adaptive_learning
JWT_SECRET_KEY=COLE_AQUI_A_CHAVE_ALEATORIA_GERADA
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
ANALYSIS_MODEL=qwen3:4b
STUDY_PLAN_MODEL=qwen3:4b
OCR_VISION_MODEL=qwen3-vl:4b-instruct
LLM_TIMEOUT=180
OLLAMA_MAX_CONCURRENT=1
```

Gere a chave antes de preencher o `.env` com `python -c 'import secrets; print(secrets.token_hex(32))'`. O backend rejeita chaves JWT com menos de 32 bytes e os tokens expiram após uma hora. Nunca envie o `.env` ao Git ou compartilhe o seu conteúdo. Para publicar a API, use HTTPS, senha forte para o usuário do PostgreSQL e configure `CORS_ALLOWED_ORIGINS` com as origens exatas do frontend.

A API aplica limites locais por IP a login e cadastro e por IP/conta a OCR e envio de respostas, rejeita corpos HTTP acima de 8 MB (JSON) ou 27 MB (uploads), limita reenvios rápidos por questão e mantém no máximo uma chamada simultânea ao Ollama por processo. Esses limites em memória são adequados para o protótipo local, mas reiniciam junto com a API e não são compartilhados entre vários processos. A política CSP do frontend também precisa ser ajustada se a API for publicada em outro endereço. Antes de expor o sistema à internet, configure limites de corpo e rate limiting distribuído no proxy/API gateway, e migre os tokens do `localStorage` para uma sessão protegida com proteção CSRF.

Para uma base nova, crie o banco e execute `database/schema.sql` com uma conta que possa criar as tabelas. Para uma base existente que já contém usuários, provas e análises, execute `database/migrations/001_assessment_workflow.sql` como proprietária do schema `public`, informando o nome da conta de execução da API:

```bash
psql "$DATABASE_OWNER_URL" \
  -v app_role='USUARIO_DA_API' \
  -f database/migrations/001_assessment_workflow.sql
```

O valor de `app_role` deve corresponder ao usuário presente em `DATABASE_URL`.

Inicie a API:

```bash
source .venv/bin/activate
uvicorn app.api:app --reload
```

A documentação interativa fica em <http://127.0.0.1:8000/docs>.

Em outro terminal, sirva os arquivos estáticos do front-end:

```bash
cd frontend
python3 -m http.server 5500
```

Abra <http://127.0.0.1:5500>. A API já permite essa origem local para desenvolvimento.

## Primeiro acesso e papéis

1. Cadastre uma conta pela tela de registro. Contas novas começam como `STUDENT`.
2. A conta administradora deve ser provisionada no banco conforme o procedimento do projeto, se ainda não existir.
3. Entre como administrador, abra **Usuários** e altere a conta desejada para `TEACHER`.
4. O professor cadastra e publica a avaliação. O aluno entra com a própria conta para responder.

O professor não precisa cadastrar a resposta do aluno. Ele informa a solução esperada ou critérios de correção; o estudante envia a própria resposta.

## Rotas principais

| Método e rota | Uso |
|---|---|
| `POST /auth/register`, `POST /auth/login` | Criar conta e iniciar sessão |
| `GET /auth/me`, `PATCH /auth/me/profile` | Consultar a conta e atualizar o nome próprio |
| `PUT /auth/me/password` | Alterar a senha após confirmar a senha atual |
| `GET /admin/overview`, `GET /admin/users` | Indicadores agregados e gestão de contas (somente administrador) |
| `POST /assessments` | Professor cria uma avaliação e suas questões |
| `GET /assessments` | Lista avaliações disponíveis conforme o papel |
| `GET /assessments/{id}/questions` | Busca enunciados; o gabarito só é devolvido a quem pode gerenciar a avaliação |
| `POST /ocr/transcribe-assessment` | Professor importa prova completa para revisar questões e critérios |
| `POST /ocr/transcribe-student-assessment` | Relaciona respostas manuscritas de uma prova aos campos da avaliação |
| `POST /ocr/transcribe` | Transcreve uma imagem individual com Qwen3-VL ou Tesseract |
| `POST /assessments/{id}/questions/{question_id}/submit` | Corrige e salva uma resposta individual |
| `POST /assessments/{id}/submit-all` | Corrige e salva respostas preenchidas em lote |
| `GET /assessments/{id}/submissions` | Professor consulta respostas e correções recebidas |
| `GET /history/` e `GET /history/{exam_id}` | Aluno consulta tentativas próprias e feedback por questão |
| `GET /profile/performance` | Calcula desempenho acumulado e aproveitamento por tópico |
| `GET /profile/study-plan` | Gera ou reutiliza o plano para o histórico atual |

As rotas protegidas exigem o token recebido no login. Professor cria avaliações e consulta as respostas; aluno responde avaliações publicadas; administrador gerencia contas e vê indicadores agregados. O administrador não publica nem corrige avaliações. A API não aceita o gabarito enviado pelo aluno no corpo da submissão.

## OCR e limites de envio

- Imagens individuais: PNG, JPEG ou WebP, até 10 MB.
- Prova completa: PDF, PNG, JPEG ou WebP, até 25 MB e 8 páginas por envio.
- PDFs são convertidos em imagens e processados página por página para manter a entrada visual dentro do contexto do modelo.
- A transcrição volta para campos editáveis. Confira especialmente manuscrito, código, símbolos e separação de questões antes de publicar ou pedir a correção.
- A chamada de OCR de documento usa Qwen3-VL. O Tesseract é opção para texto impresso em transcrições individuais; ele não separa automaticamente manuscrito e enunciado.

## Configurações opcionais

Além de `DATABASE_URL` e dos modelos, é possível ajustar o OCR por ambiente:

| Variável | Padrão | Efeito |
|---|---:|---|
| `LLM_TIMEOUT` | `180` | Prazo máximo de cada chamada ao Ollama para correção e plano, em segundos |
| `OLLAMA_MAX_CONCURRENT` | `1` | Número de chamadas simultâneas ao Ollama neste processo da API |
| `OCR_MAX_IMAGE_SIDE` | `1600` | Reduz fotos maiores antes de enviá-las ao modelo visual |
| `OCR_VISION_TIMEOUT` | `120` | Prazo máximo de uma chamada visual, em segundos |
| `OCR_NUM_CTX` | `8192` | Contexto usado no Ollama visual |
| `OCR_TESSERACT_TIMEOUT` | `25` | Prazo de leitura do Tesseract, em segundos |
| `OCR_DOCUMENT_NUM_PREDICT` | `2400` | Limite de tokens gerados por página de documento |

Não reduza resolução, contexto ou tokens sem comparar transcrições e tempos em imagens representativas do seu conjunto de provas.

## Estrutura do código

~~~text
app/
  controllers/   persistência e coordenação da análise
  models/        entidades SQLAlchemy
  ocr/           leitura de imagens, PDFs e transcrição
  routes/        autenticação, avaliações, OCR, histórico e perfil
  llm_analyzer.py
  study_plan.py
frontend/
  dashboard.html, exam.html, result.html, login.html, register.html
  css/           estilos, temas e layouts responsivos
  js/            interações, fluxo de avaliações e preferências
database/
  schema.sql
  migrations/    migrações explícitas para bases existentes
docs/            arquitetura, protocolo de validação e roteiro da demonstração
scripts/         avaliação offline de transcrições OCR anotadas
~~~

## Autoria

**Raphaell Nunes e Silva**<br>
Instituto Federal Sul-rio-grandense (IFSul) · Campus Bagé
