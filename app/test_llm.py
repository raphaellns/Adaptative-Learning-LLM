import json
from ollama import chat


question = """
Implemente uma função que retorne a soma de todos os elementos
de um vetor de inteiros.
"""

answer_key = """
public int soma(int[] vetor) {
    int soma = 0;

    for (int i = 0; i < vetor.length; i++) {
        soma += vetor[i];
    }

    return soma;
}
"""

student_answer = """
public int soma(int[] vetor) {
    int soma = 0;

    for (int i = 0; i <= vetor.length; i++) {
        soma += vetor[i];
    }

    return soma;
}
"""


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
4. Qual subtópico está relacionado ao erro.
5. Explique o erro de forma didática para o aluno.
6. Classifique o nível do conceito que o aluno precisa revisar.
7. Recomende conteúdos que o aluno deveria estudar.

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


print("\n===== ANÁLISE DA RESPOSTA =====\n")

if result["correta"]:
    print("Resultado: CORRETA")
else:
    print("Resultado: INCORRETA")

print(f"Tópico: {result['topico']}")

print(f"\nErro identificado:")
print(result["erro_principal"])

print(f"\nExplicação:")
print(result["explicacao"])

print(f"\nO que estudar:")

for recommendation in result["recomendacoes"]:
    print(f"- {recommendation}")