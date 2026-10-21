# Arquitetura do sistema

## Componentes

~~~text
Navegador (HTML/CSS/JavaScript)
        │ requisições HTTP e token de sessão
        ▼
FastAPI ── SQLAlchemy ── PostgreSQL
   │                         │
   ├── OCR                   ├── contas e papéis
   │   ├── Qwen3-VL          ├── avaliações e questões
   │   └── Tesseract          └── tentativas e análises
   │
   ├── Qwen3 para correção
   └── Qwen3 para plano de estudos
~~~

## Fluxo de uma avaliação

1. Um professor cria a avaliação. A importação por imagem ou PDF sugere enunciados e critérios; o professor revisa os campos antes de publicar.
2. O estudante abre uma avaliação publicada. A interface pode enviar a prova toda ou uma resposta por vez.
3. A transcrição é devolvida à interface para revisão. O conteúdo reconhecido ainda pode conter erros, sobretudo em manuscrito e código.
4. A API associa a resposta aos critérios cadastrados pelo professor e chama o modelo de correção.
5. A tentativa e a análise são persistidas. O histórico do estudante alimenta o perfil por tópico e as prioridades do plano de estudos.

## Persistência conceitual

~~~mermaid
erDiagram
    USER ||--o{ EXAM : realiza
    EXAM ||--o{ EXAM_QUESTION : contem
    EXAM_QUESTION ||--|| ANALYSIS : recebe
    USER ||--o{ ASSESSMENT : cria
    ASSESSMENT ||--o{ ASSESSMENT_QUESTION : organiza
    ASSESSMENT_QUESTION ||--o{ ASSESSMENT_SUBMISSION : recebe
    USER ||--o{ ASSESSMENT_SUBMISSION : envia
    EXAM_QUESTION ||--o| ASSESSMENT_SUBMISSION : referencia
~~~

AssessmentQuestion guarda o enunciado e os critérios definidos pelo professor. AssessmentSubmission relaciona uma questão publicada, o estudante e a questão de tentativa que contém a resposta e a análise.

## Limites do desenho atual

- A inferência ocorre localmente pelo Ollama, então tempo e capacidade dependem do computador e do modelo carregado.
- A chamada de correção é sequencial por questão; uma prova longa pode demorar mais que uma resposta isolada.
- O plano é uma recomendação gerada a partir dos resultados registrados. Ele ajuda a priorizar estudo, mas não substitui avaliação docente.
- As transcrições e correções devem ser conferidas pelo estudante e pelo professor. O sistema não apresenta a saída da IA como verdade garantida.
