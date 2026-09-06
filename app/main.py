from app.llm_analyzer import analyze_answer

from data.questions import questions

import time


results = []

correct_classifications = 0
correct_topics = 0


for question_data in questions:

    question_id = question_data["id"]

    question = question_data["question"]
    answer_key = question_data["answer_key"]
    student_answer = question_data["student_answer"]

    expected_correct = question_data["expected_correct"]
    expected_topic = question_data["topic"]

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
    result["expected_correct"] = expected_correct
    result["expected_topic"] = expected_topic

    results.append(result)

    if result["correta"] == expected_correct:
        correct_classifications += 1

    if result["topico"] == expected_topic:
        correct_topics += 1


total_questions = len(results)


classification_accuracy = (
    correct_classifications / total_questions * 100
)

topic_accuracy = (
    correct_topics / total_questions * 100
)


print("\n===== VALIDAÇÃO DA LLM =====")

print(
    f"Classificação correta/incorreta: "
    f"{correct_classifications}/{total_questions} "
    f"({classification_accuracy:.1f}%)"
)

print(
    f"Tópico identificado corretamente: "
    f"{correct_topics}/{total_questions} "
    f"({topic_accuracy:.1f}%)"
)


print("\n===== ERROS DE CLASSIFICAÇÃO =====")

classification_errors = 0

for result in results:

    if result["correta"] != result["expected_correct"]:

        classification_errors += 1

        print(f"\n❌ Questão {result['question_id']}")

        print(
            f"   Esperado: "
            f"{result['expected_correct']}"
        )

        print(
            f"   LLM: "
            f"{result['correta']}"
        )

        print(
            f"   Explicação da LLM: "
            f"{result['explicacao']}"
        )

        print(
            f"   Erro identificado: "
            f"{result['erro_principal']}"
        )


if classification_errors == 0:
    print("Nenhum erro de classificação encontrado.")


print("\n===== ERROS DE TÓPICO =====")

topic_errors = 0

for result in results:

    if result["topico"] != result["expected_topic"]:

        topic_errors += 1

        print(f"\n❌ Questão {result['question_id']}")

        print(
            f"   Esperado: "
            f"{result['expected_topic']}"
        )

        print(
            f"   LLM: "
            f"{result['topico']}"
        )

        print(
            f"   Explicação da LLM: "
            f"{result['explicacao']}"
        )


if topic_errors == 0:
    print("Nenhum erro de tópico encontrado.")