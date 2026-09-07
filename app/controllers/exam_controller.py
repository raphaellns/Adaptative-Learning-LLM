import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.exam_analyzer import analyze_exam
from app.models.analysis import Analysis
from app.models.exam import Exam
from app.models.exam_question import ExamQuestion
from app.schemas.exam import ExamRequest
from app.student_profile import build_student_profile
from app.study_priority import calculate_study_priorities
from app.study_plan import generate_study_plan


def analyze_and_save_exam(
    request: ExamRequest,
    user_id: int,
    db: Session
):

    if not request.questions:

        raise HTTPException(
            status_code=400,
            detail="A prova precisa ter pelo menos uma questão."
        )


    exam = Exam(
        user_id=user_id
    )

    db.add(exam)

    db.flush()


    current_results = []


    for question_data in request.questions:

        result = analyze_exam_question(
            question_data.question,
            question_data.answer_key,
            question_data.student_answer
        )


        question = ExamQuestion(
            exam_id=exam.id,
            question=question_data.question,
            answer_key=question_data.answer_key,
            student_answer=question_data.student_answer
        )

        db.add(question)

        db.flush()


        analysis = Analysis(
            question_id=question.id,
            correta=result["correta"],
            topico=result["topico"],
            erro_principal=result["erro_principal"],
            explicacao=result["explicacao"],
            recomendacoes=json.dumps(
                result["recomendacoes"],
                ensure_ascii=False
            )
        )

        db.add(analysis)


        current_results.append(result)


    db.commit()


    historical_analyses = (
        db.query(Analysis)
        .join(
            ExamQuestion,
            Analysis.question_id == ExamQuestion.id
        )
        .join(
            Exam,
            ExamQuestion.exam_id == Exam.id
        )
        .filter(
            Exam.user_id == user_id
        )
        .all()
    )


    historical_results = []


    for analysis in historical_analyses:

        recommendations = []

        if analysis.recomendacoes:

            recommendations = json.loads(
                analysis.recomendacoes
            )


        historical_results.append({
            "correta": analysis.correta,
            "topico": analysis.topico,
            "erro_principal": analysis.erro_principal,
            "explicacao": analysis.explicacao,
            "recomendacoes": recommendations
        })


    profile = build_student_profile(
        historical_results
    )


    priorities = calculate_study_priorities(
        profile
    )


    study_plan = generate_study_plan(
        profile,
        priorities,
        historical_results
    )


    return {
        "exam_id": exam.id,
        "questions": current_results,
        "profile": profile,
        "priorities": priorities,
        "study_plan": study_plan
    }


def analyze_exam_question(
    question: str,
    answer_key: str,
    student_answer: str
):

    from app.llm_analyzer import analyze_answer

    return analyze_answer(
        question,
        answer_key,
        student_answer
    )