import json
import time
from ollama import chat
from app.topics import ALGORITHM_TOPICS


def analyze_answer(question, answer_key, student_answer):

    prompt = f"""
    Você é um professor de Algoritmos responsável por avaliar a resposta de um aluno.

    Sua tarefa é analisar cuidadosamente a resposta do aluno comparando:
    - o enunciado da questão;
    - o gabarito;
    - a resposta fornecida pelo aluno.

    ENUNCIADO:
    {question}

    GABARITO:
    {answer_key}

    RESPOSTA DO ALUNO:
    {student_answer}


    Determine:

    1. Se a resposta está correta.
    2. Qual é o principal erro cometido, caso exista.
    3. Qual tópico de Algoritmos está relacionado à questão.
    4. Explique o resultado de forma didática.
    5. Recomende conteúdos que o aluno deveria estudar, caso tenha cometido um erro.


    REGRAS IMPORTANTES PARA AVALIAÇÃO:

    - Avalie a resposta pelo seu significado e pelo conceito apresentado,
    e não apenas pelas palavras utilizadas.

    - Não considere uma resposta incorreta apenas porque o aluno utilizou
    uma terminologia diferente da utilizada no gabarito.

    - Respostas escritas em linguagem natural podem estar corretas mesmo
    que não utilizem exatamente os mesmos termos do gabarito.

    - Não exija que o aluno utilize uma implementação, estrutura de código
    ou explicação idêntica ao gabarito.

    - Se a resposta demonstrar corretamente o conceito solicitado pela
    questão, considere-a correta.

    - Só marque a resposta como incorreta quando existir um erro conceitual,
    lógico ou técnico relevante.

    - Não invente erros que não estejam presentes na resposta do aluno.

    - Não interprete uma diferença de terminologia como um erro conceitual
    sem antes verificar o significado da resposta no contexto da questão.

    - Considere o que a questão realmente está perguntando antes de avaliar
    a resposta.

    - Se a resposta estiver correta, "erro_principal" deve ser uma string vazia
    e "recomendacoes" deve ser uma lista vazia.

    - Se a resposta estiver parcialmente correta, determine se existe um erro
    conceitual relevante. Não marque automaticamente como incorreta apenas
    porque a resposta não possui todos os detalhes do gabarito.

    - Não exija detalhes que não foram solicitados explicitamente pela questão.


    Antes de marcar uma resposta como incorreta, siga estas etapas:

    1. Identifique exatamente o que a questão solicita.
    2. Identifique qual conceito o aluno apresentou.
    3. Compare o conceito apresentado pelo aluno com o conceito correto.
    4. Verifique se existe realmente uma contradição ou erro.
    5. Diferencie erros conceituais de diferenças de terminologia.
    6. Somente depois determine se a resposta está correta ou incorreta.


    O tópico deve ser obrigatoriamente um dos seguintes:

    {", ".join(ALGORITHM_TOPICS)}

    Não invente novos tópicos.
    Não altere os nomes dos tópicos.
    Escolha apenas um tópico da lista.
    """

    response_schema = {
        "type": "object",
        "properties": {
            "correta": {"type": "boolean"},
            "topico": {
                "type": "string",
                "enum": ALGORITHM_TOPICS
            },
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