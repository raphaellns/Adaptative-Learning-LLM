import json

from ollama import chat

from app.topics import ALGORITHM_TOPICS


def generate_study_plan(profile, priorities, results):

    incorrect_results = [
        {
            "topico": result["topico"],
            "erro_principal": result["erro_principal"],
            "explicacao": result["explicacao"],
            "recomendacoes": result["recomendacoes"]
        }
        for result in results
        if not result["correta"]
    ]

    prompt = f"""
Você é um professor de Algoritmos responsável por criar
um plano de estudos personalizado para um aluno.

O plano deve ser baseado exclusivamente no desempenho
apresentado pelo aluno.

PERFIL DO ALUNO:
{json.dumps(profile, ensure_ascii=False, indent=2)}

PRIORIDADES DE ESTUDO:
{json.dumps(priorities, ensure_ascii=False, indent=2)}

ERROS COMETIDOS:
{json.dumps(incorrect_results, ensure_ascii=False, indent=2)}


Crie um plano de estudos adaptativo.

Para cada tópico que apresentar dificuldade, determine:

1. Quais conteúdos o aluno deve revisar.
2. Quanto tempo aproximadamente deve ser dedicado ao tópico.


REGRAS:

- Priorize os tópicos com menor aproveitamento.
- Use os erros cometidos pelo aluno para personalizar o plano.
- Não recomende estudos para tópicos em que o aluno demonstrou
  domínio, a menos que seja necessário para outro tópico.
- Não invente erros que não aparecem nos dados fornecidos.
- Não invente informações sobre o desempenho do aluno.
- Os tópicos utilizados devem obrigatoriamente pertencer à lista:

{", ".join(ALGORITHM_TOPICS)}

- Não altere os nomes dos tópicos.
- O plano deve ser prático e adequado para um estudante de Algoritmos.
- As atividades devem ajudar o aluno a corrigir especificamente
  as dificuldades identificadas.
"""

    response_schema = {
        "type": "object",
        "properties": {
            "plano": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "topico": {
                            "type": "string",
                            "enum": ALGORITHM_TOPICS
                        },
                        "prioridade": {
                            "type": "number"
                        },
                        "motivo": {
                            "type": "string"
                        },
                        "objetivo": {
                            "type": "string"
                        },
                        "conteudos": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "atividades": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "tempo_estimado_minutos": {
                            "type": "integer"
                        }
                    },
                    "required": [
                        "topico",
                        "prioridade",
                        "motivo",
                        "objetivo",
                        "conteudos",
                        "atividades",
                        "tempo_estimado_minutos"
                    ]
                }
            }
        },
        "required": [
            "plano"
        ]
    }

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

    return json.loads(response.message.content)