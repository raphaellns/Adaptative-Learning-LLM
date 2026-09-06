from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.controllers.exam_controller import analyze_and_save_exam
from app.database import get_db
from app.models.user import User
from app.schemas.exam import ExamRequest


router = APIRouter(
    prefix="/exam",
    tags=["Provas"]
)


@router.post("/analyze")
def analyze_exam(
    request: ExamRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    user_id = get_user_id_from_token(token)

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado."
        )

    return analyze_and_save_exam(
        request,
        user_id,
        db
    )