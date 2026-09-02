import json
import time
from ollama import chat


def analyze_answer(question, answer_key, student_answer):

    prompt = f"""
    Você é um professor de Algoritmos.

    Analise a resposta de um aluno comparando o enunciado,
    o gabarito e a resposta fornecida.

    ENUNCIADO:
    {question}

    GABARITO:
    {answer_key}

    RESPOSTA DO ALUNO:
    {student_answer}

    Determine:

    1. Se a resposta está correta.
    2. Qual é o principal erro cometido.
    3. Qual tópico de Algoritmos está relacionado ao erro.
    4. Explique o erro de forma didática para o aluno.
    5. Recomende conteúdos que o aluno deveria estudar.

    A resposta deve seguir exatamente o formato solicitado.
    """

    response_schema = {
        "type": "object",
        "properties": {
            "correta": {"type": "boolean"},
            "topico": {"type": "string"},
            "erro_principal": {"type": "string"},
            "explicacao": {"type": "string"},
            "recomendacoes": {
                "type": "array",
                "items": {"type": "string"}
            }
        },
        "required": [
            "correta",
            "topico",
            "erro_principal",
            "explicacao",
            "recomendacoes"
        ]
    }

    start = time.time()

    response = chat(
        model="qwen3:4b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        format=response_schema
    )

    total_time = time.time() - start

    print(f"Tempo total do chat: {total_time:.2f}s")
    print(f"Tokens gerados: {response.eval_count}")
    print(f"Tempo de geração: {response.eval_duration / 1e9:.2f}s")
    print(f"Tempo de prompt: {response.prompt_eval_duration / 1e9:.2f}s")
    print(f"Tokens do prompt: {response.prompt_eval_count}")

    result = json.loads(response.message.content)

    return result