from app.llm_analyzer import analyze_answer
from data.questions import questions
from data.student_answers import student_answers
import time


results = []


for question_data in questions:

    question_id = question_data["id"]

    question = question_data["question"]
    answer_key = question_data["answer_key"]
    student_answer = student_answers[question_id]

    print(f"Analisando questão {question_id}...")

    start_time = time.time()

    result = analyze_answer(
        question,
        answer_key,
        student_answer
    )

    elapsed_time = time.time() - start_time

    print(
    f"Questão {question_id} analisada "
    f"em {elapsed_time:.2f} segundos"
    )

    result["question_id"] = question_id
    result["expected_topic"] = question_data["topic"]

    results.append(result)


print("\n===== RESULTADO DA PROVA =====\n")


for result in results:

    print(f"Questão {result['question_id']}")

    if result["correta"]:
        print("Resultado: CORRETA")
    else:
        print("Resultado: INCORRETA")

    print(f"Tópico: {result['topico']}")

    if not result["correta"]:
        print(f"Erro: {result['erro_principal']}")
        print(f"Explicação: {result['explicacao']}")

    print()