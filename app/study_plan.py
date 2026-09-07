import json

from ollama import chat

from app.topics import ALGORITHM_TOPICS


def generate_study_plan(profile, priorities, results):

    historical_incorrect_results = [
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

O plano deve ser baseado no desempenho ACUMULADO do aluno.

PERFIL ACUMULADO DO ALUNO:
{json.dumps(profile, ensure_ascii=False, indent=2)}

PRIORIDADES DE ESTUDO:
{json.dumps(priorities, ensure_ascii=False, indent=2)}

ERROS IDENTIFICADOS NO HISTÓRICO:
{json.dumps(historical_incorrect_results, ensure_ascii=False, indent=2)}


Crie um plano de estudos adaptativo.

Para cada tópico que apresentar dificuldade, determine:

1. Quais conteúdos o aluno deve revisar.
2. Quanto tempo aproximadamente deve ser dedicado ao tópico.
3. Atividades que ajudem a corrigir as dificuldades observadas.


REGRAS:

- Considere o desempenho acumulado do aluno, não somente uma avaliação.
- Priorize os tópicos com menor aproveitamento.
- Use os erros observados ao longo do histórico para personalizar o plano.
- Dê maior atenção a dificuldades que aparecem repetidamente.
- Não recomende estudos para tópicos em que o aluno demonstra domínio,
  a menos que sejam necessários para outro tópico.
- Não invente erros que não aparecem no histórico.
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
        format=response_schema,
        think=False,
        keep_alive=-1,
        options={
            "temperature": 0.1,
            "num_predict": 1000
        }
    )

    try:
        return json.loads(response.message.content)

    except json.JSONDecodeError:
        print("JSON do plano incompleto. Tentando novamente...")

        response = chat(
            model="qwen3:4b",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            format=response_schema,
            think=False,
            keep_alive=-1,
            options={
                "temperature": 0.1,
                "num_predict": 1000
            }
        )

        try:
            return json.loads(response.message.content)

        except json.JSONDecodeError:
            print("Resposta recebida:")
            print(response.message.content)

            raise RuntimeError(
                "A LLM não retornou um JSON válido para o plano de estudos."
            )