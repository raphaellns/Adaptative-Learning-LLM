import json
import time

from ollama import chat

from app.topics import ALGORITHM_TOPICS


def analyze_answer(question, answer_key, student_answer):

    prompt = f"""
Você é um professor de Algoritmos avaliando uma resposta de aluno.

A disciplina utiliza a linguagem C.

ENUNCIADO:
{question}

GABARITO:
{answer_key}

RESPOSTA DO ALUNO:
{student_answer}

Determine:

1. Se a resposta está correta.
2. O principal erro, caso exista.
3. O principal tópico da questão.
4. Uma explicação didática.
5. Recomendações de estudo somente se houver erro.

REGRAS:

A resposta só pode ser classificada como CORRETA quando realmente
atender ao que foi solicitado no enunciado.

Classifique como INCORRETA quando existir erro conceitual, lógico,
técnico ou de sintaxe que torne a resposta inadequada.

Avalie o conceito e o significado da resposta, não apenas palavras
iguais ao gabarito.

Não exija uma implementação idêntica ao gabarito quando existir
outra solução válida em C.

Uma construção válida em outra linguagem, mas inválida em C,
deve ser considerada INCORRETA.

EXEMPLO:

Pergunta:
Qual tipo deve ser usado para armazenar um número inteiro?

Gabarito:
int

Aluno:
float

Resposta:
INCORRETA

EXEMPLO:

Pergunta:
Declare uma variável para armazenar um único caractere.

Gabarito:
char nome;

Aluno:
string nome;

Resposta:
INCORRETA

VALIDAÇÃO DA SOLUÇÃO:

A resposta do aluno NÃO precisa ser idêntica ao gabarito.

Avalie primeiro se a solução atende ao objetivo do enunciado.

Considere CORRETA uma solução que utilize:
- variáveis com nomes diferentes;
- tamanhos de arrays diferentes, desde que sejam adequados;
- espaços e formatação diferentes;
- mensagens adicionais na saída, quando não contradizem o enunciado;
- estruturas de código diferentes que produzam o resultado solicitado;
- outra sequência de instruções que resolva corretamente o problema;
- outras funções ou construções válidas da linguagem C.

Não considere uma resposta incorreta apenas porque ela é diferente
do gabarito.

Exemplo:

Enunciado:
"Leia o nome de um aluno e exiba o nome informado."

Gabarito:
char nome[50];
scanf("%49s", nome);
printf("%s", nome);

Resposta do aluno:
char nome[100];
scanf("%99s", nome);
printf("%s", nome);

Classificação:
CORRETA

Motivo:
A solução utiliza outra capacidade de armazenamento, mas continua
lendo o nome e exibindo o valor informado corretamente.

Outro exemplo:

Enunciado:
"Leia o nome de um aluno e exiba o nome informado."

Gabarito:
printf("%s", nome);

Resposta do aluno:
printf("Nome: %s", nome);

Classificação:
CORRETA

Motivo:
O nome informado continua sendo exibido. O texto adicional não torna
a solução incorreta, pois o enunciado não exige uma saída textual exata.

Porém, se o enunciado disser explicitamente:
"A saída deve ser exatamente o nome informado, sem nenhum texto adicional."

então:
printf("Nome: %s", nome);

deve ser considerada INCORRETA.

REGRA IMPORTANTE:

Só considere diferenças de saída como erro quando o enunciado exigir
explicitamente um formato exato de saída.


REGRAS PARA O TÓPICO:

Escolha exatamente UM tópico da lista abaixo:

{", ".join(ALGORITHM_TOPICS)}

O tópico deve representar o PRINCIPAL CONCEITO PEDAGÓGICO COBRADO
pela questão, e não simplesmente uma característica do código.

Para determinar o tópico, siga ESTA ORDEM DE PRIORIDADE:

1. SINTAXE DA LINGUAGEM C

Se a questão pedir para:
- identificar um erro de sintaxe;
- encontrar o erro em um código;
- corrigir um código que não compila;
- identificar símbolo, parêntese, chave, ponto e vírgula ou
  outra construção sintaticamente inválida;

classifique como "Sintaxe da linguagem C".

Nesse caso, não escolha outro tópico apenas porque o código contém
if, for, while, scanf, declaração de variável etc.

Exemplo:
for (int i = 0; i < 10; i++
    printf("%d", i);


Mesmo contendo um for, o tópico é "Sintaxe da linguagem C"
porque o objetivo da questão é identificar um erro de sintaxe.


2. LÓGICA DE PROGRAMAÇÃO

Se a questão pedir para:
- realizar um cálculo;
- montar uma expressão;
- aplicar uma fórmula;
- resolver um problema por meio de operações;
- transformar valores;
- calcular área, média, conversão ou outro resultado;
- desenvolver o raciocínio necessário para chegar a um resultado;

classifique como "Lógica de programação".

Não escolha "Entrada e saída de dados" apenas porque a questão
utiliza scanf ou printf.

Não escolha "Declaração de variáveis" apenas porque existem
variáveis no código.

Exemplo:
scanf("%f", &lado);
area = lado * lado;
printf("%f", area);

Se o objetivo da questão for calcular a área do quadrado,
o tópico é "Lógica de programação".


3. ESTRUTURAS CONDICIONAIS

Se o conceito principal ensinado for a tomada de decisão utilizando:
- if;
- else;
- else if;
- condições;
- operadores relacionais ou lógicos utilizados para decidir
  entre caminhos diferentes;

classifique como "Estruturas condicionais".

Um erro dentro de um if não muda o tópico para sintaxe quando
a questão não está pedindo identificação de erro de sintaxe.


4. ESTRUTURAS DE REPETIÇÃO

Se o conceito principal ensinado for repetição utilizando:
- for;
- while;
- do while;
- contadores;
- condições de repetição;

classifique como "Estruturas de repetição".

Porém, se a questão estiver explicitamente pedindo para encontrar
um erro de sintaxe em um for, while ou do while, siga a regra 1
e classifique como "Sintaxe da linguagem C".


5. ENTRADA E SAÍDA DE DADOS

Classifique como "Entrada e saída de dados" quando o principal
objetivo da questão for:
- ler dados do usuário;
- utilizar scanf;
- exibir dados;
- utilizar printf;
- entender entrada ou saída de informações.

Não escolha este tópico apenas porque scanf ou printf aparecem
como parte de uma questão maior.

Exemplo:
Leia um número inteiro e calcule seu quadrado.

Se o objetivo principal for realizar o cálculo do quadrado,
o tópico é "Lógica de programação", mesmo que scanf apareça
na solução.


6. DECLARAÇÃO DE VARIÁVEIS

Classifique como "Declaração de variáveis" quando o principal
objetivo da questão for:
- declarar uma variável;
- escolher o tipo de uma variável;
- diferenciar int, float, char etc.;
- definir corretamente uma variável e seu tipo.

Não escolha este tópico apenas porque uma variável aparece
dentro de uma questão sobre cálculo, condição ou repetição.


REGRA FINAL:

Pergunte mentalmente:

"Qual é a principal habilidade que esta questão está tentando
avaliar?"

Escolha o tópico com base nessa habilidade.

Não classifique pelo elemento de código mais visível.

Priorize o objetivo da questão sobre os elementos secundários
presentes na solução.

Apenas escolha "Sintaxe da linguagem C" quando o foco da questão
for realmente sintaxe ou quando a questão pedir explicitamente
para identificar/corrigir um erro de sintaxe.


CLASSIFICAÇÃO:

O campo "classificacao" deve ser exatamente:

"CORRETA"

ou

"INCORRETA"

Se a resposta do aluno estiver errada, use "INCORRETA".

Se a resposta do aluno estiver correta, use "CORRETA".

A explicação e a classificação devem obrigatoriamente concordar.

Se for CORRETA:
- erro_principal = ""
- recomendacoes = []

Se for INCORRETA:
- erro_principal deve explicar o erro
- recomendacoes deve indicar o que estudar
"""

    response_schema = {
        "type": "object",
        "properties": {
            "classificacao": {
                "type": "string",
                "enum": ["CORRETA", "INCORRETA"]
            },
            "topico": {
                "type": "string",
                "enum": ALGORITHM_TOPICS
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
            "classificacao",
            "topico",
            "erro_principal",
            "explicacao",
            "recomendacoes"
        ]
    }

    def run_chat(max_tokens):
        return chat(
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
                "num_predict": max_tokens
            }
        )

    start = time.time()

    response = run_chat(400)

    try:
        result = json.loads(response.message.content)

    except json.JSONDecodeError:
        print("JSON incompleto. Tentando novamente com mais tokens...")

        response = run_chat(700)

        try:
            result = json.loads(response.message.content)

        except json.JSONDecodeError:
            print("Resposta recebida:")
            print(response.message.content)

            raise RuntimeError(
                "A LLM não retornou um JSON válido."
            )

    total_time = time.time() - start

    print(f"Tempo total do chat: {total_time:.2f}s")
    print(f"Tokens gerados: {response.eval_count}")
    print(f"Tempo de geração: {response.eval_duration / 1e9:.2f}s")
    print(f"Tempo de prompt: {response.prompt_eval_duration / 1e9:.2f}s")
    print(f"Tokens do prompt: {response.prompt_eval_count}")

    result["correta"] = result["classificacao"] == "CORRETA"

    del result["classificacao"]

    return result