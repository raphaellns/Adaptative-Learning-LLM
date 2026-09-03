from app.llm_analyzer import analyze_answer
from app.student_profile import build_student_profile
from app.study_priority import calculate_study_priorities
from app.study_plan import generate_study_plan

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

profile = build_student_profile(results)

priorities = calculate_study_priorities(profile)

study_plan = generate_study_plan(
    profile,
    priorities,
    results
)

print("\n===== PERFIL DO ALUNO =====")

print(f"Questões: {profile['total_questions']}")
print(f"Acertos: {profile['correct']}")
print(f"Erros: {profile['incorrect']}")
print(f"Aproveitamento: {profile['accuracy']:.1f}%")

print("\n===== DESEMPENHO POR TÓPICO =====")

for topic, data in profile["topics"].items():

    print(f"\n{topic}")
    print(f"  Acertos: {data['correct']}")
    print(f"  Erros: {data['incorrect']}")
    print(f"  Aproveitamento: {data['accuracy']:.1f}%")

    print("\n===== PRIORIDADES DE ESTUDO =====")

for index, item in enumerate(priorities, start=1):

    print(
        f"{index}. {item['topic']} "
        f"({item['accuracy']:.1f}% de aproveitamento)"
    )


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

    print("\n===== PLANO DE ESTUDOS =====")

for item in study_plan["plano"]:

    print(f"\n{item['topico']}")
    print(f"Prioridade: {item['prioridade']}")
    print(f"Motivo: {item['motivo']}")
    print(f"Objetivo: {item['objetivo']}")

    print("Conteúdos:")
    for content in item["conteudos"]:
        print(f"  - {content}")

    print("Atividades:")
    for activity in item["atividades"]:
        print(f"  - {activity}")

    print(
        f"Tempo estimado: "
        f"{item['tempo_estimado_minutos']} minutos"
    )