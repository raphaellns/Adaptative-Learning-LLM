import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.database import get_db
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentSubmission
from app.models.exam import Exam


router = APIRouter(
    prefix="/history",
    tags=["Histórico"]
)


def get_assessment_titles(db: Session, exams: list[Exam]) -> dict[int, str | None]:
    """Return assessment titles for saved questions without exposing answer keys."""
    question_ids = [question.id for exam in exams for question in exam.questions]
    if not question_ids:
        return {}

    rows = (
        db.query(AssessmentSubmission.exam_question_id, Assessment.title)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.id == AssessmentSubmission.assessment_question_id,
        )
        .join(Assessment, Assessment.id == AssessmentQuestion.assessment_id)
        .filter(AssessmentSubmission.exam_question_id.in_(question_ids))
        .all()
    )
    title_by_question = {
        exam_question_id: title
        for exam_question_id, title in rows
    }

    return {
        exam.id: next(
            (title_by_question[question.id] for question in exam.questions if question.id in title_by_question),
            None,
        )
        for exam in exams
    }


def parse_recommendations(value: str | None) -> list:
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        return [value]
    if parsed is None:
        return []
    return parsed if isinstance(parsed, list) else [parsed]


@router.get("/")
def get_history(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    user_id = get_user_id_from_token(credentials.credentials)
    exams = (
        db.query(Exam)
        .filter(Exam.user_id == user_id)
        .order_by(Exam.created_at.desc())
        .all()
    )
    assessment_titles = get_assessment_titles(db, exams)

    history = []
    for exam in exams:
        total_questions = len(exam.questions)
        correct_answers = sum(
            1
            for question in exam.questions
            if question.analysis and question.analysis.correta
        )
        accuracy = (
            (correct_answers / total_questions) * 100
            if total_questions > 0
            else 0
        )

        history.append({
            "exam_id": exam.id,
            "assessment_title": assessment_titles.get(exam.id),
            "created_at": exam.created_at.isoformat(),
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "incorrect_answers": total_questions - correct_answers,
            "accuracy": round(accuracy, 1)
        })

    return history


@router.get("/{exam_id}")
def get_history_details(
    exam_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user_id = get_user_id_from_token(credentials.credentials)
    exam = (
        db.query(Exam)
        .filter(Exam.id == exam_id, Exam.user_id == user_id)
        .first()
    )
    if exam is None:
        # Do not reveal whether an exam exists under another student's account.
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")

    assessment_title = get_assessment_titles(db, [exam]).get(exam.id)
    question_results = []
    for question in exam.questions:
        analysis = question.analysis
        question_results.append({
            "question_id": question.id,
            "question": question.question,
            "student_answer": question.student_answer,
            "correct": analysis.correta if analysis else None,
            "topic": analysis.topico if analysis else None,
            "main_error": analysis.erro_principal if analysis else None,
            "explanation": analysis.explicacao if analysis else None,
            "recommendations": parse_recommendations(analysis.recomendacoes if analysis else None),
        })

    total_questions = len(question_results)
    correct_answers = sum(item["correct"] is True for item in question_results)
    return {
        "exam_id": exam.id,
        "assessment_title": assessment_title,
        "created_at": exam.created_at.isoformat(),
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "incorrect_answers": sum(item["correct"] is False for item in question_results),
        "accuracy": round((correct_answers / total_questions) * 100, 1) if total_questions else 0,
        "questions": question_results,
    }
