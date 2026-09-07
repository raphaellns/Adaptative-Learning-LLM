from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.database import get_db
from app.models.exam import Exam


router = APIRouter(
    prefix="/history",
    tags=["Histórico"]
)


@router.get("/")
def get_history(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    user_id = get_user_id_from_token(token)

    exams = (
        db.query(Exam)
        .filter(Exam.user_id == user_id)
        .order_by(Exam.created_at.desc())
        .all()
    )


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
            "created_at": exam.created_at.isoformat(),
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "incorrect_answers": total_questions - correct_answers,
            "accuracy": round(accuracy, 1)
        })


    return history