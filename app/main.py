from llm_analyzer import analyze_answer


question = """
Implemente uma função que retorne a soma de todos os elementos
de um vetor de inteiros.
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


result = analyze_answer(
    question,
    student_answer
)


print("\n===== ANÁLISE DA RESPOSTA =====\n")

if result["correta"]:
    print("Resultado: CORRETA")
else:
    print("Resultado: INCORRETA")

print(f"Tópico: {result['topico']}")

print("\nErro identificado:")
print(result["erro_principal"])

print("\nExplicação:")
print(result["explicacao"])

print("\nO que estudar:")

for recommendation in result["recomendacoes"]:
    print(f"- {recommendation}")