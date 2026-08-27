import json
from ollama import chat


def analyze_answer(question, student_answer):

    prompt = f"""
Você é um professor de Algoritmos.

Analise a resposta de um aluno comparando o enunciado,
o gabarito e a resposta fornecida.

ENUNCIADO:
{question}

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
            "correta": {
                "type": "boolean"
            },
            "topico": {
                "type": "string"
            },
            "erro_principal": {
                "type": "string"
            },
            "explicacao": {
                "type": "string"
            },
            "recomendacoes": {
                "type": "array",
                "items": {
                    "type": "string"
                }
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

    response = chat(
        model="qwen3:8b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        format=response_schema
    )

    result = json.loads(response.message.content)

    return result