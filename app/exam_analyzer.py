from app.llm_analyzer import analyze_answer
from app.student_profile import build_student_profile
from app.study_priority import calculate_study_priorities
from app.study_plan import generate_study_plan


def analyze_exam(questions):

    results = []

    for question in questions:

        result = analyze_answer(
            question["question"],
            question["answer_key"],
            question["student_answer"]
        )

        results.append(result)

    profile = build_student_profile(results)

    priorities = calculate_study_priorities(profile)

    study_plan = generate_study_plan(
        profile,
        priorities,
        results
    )

    return {
        "questions": results,
        "profile": profile,
        "priorities": priorities,
        "study_plan": study_plan
    }