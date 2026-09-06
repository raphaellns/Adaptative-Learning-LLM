from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.auth_controller import register_user
from app.database import get_db
from app.schemas.auth import RegisterRequest


router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"]
)


@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    return register_user(
        request,
        db
    )