from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.controllers.auth_controller import login_user, register_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


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


@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    return login_user(
        request,
        db
    )

@router.get("/me")
def get_current_user(
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

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }