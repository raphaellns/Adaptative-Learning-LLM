from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token, hash_password, verify_password
from app.controllers.auth_controller import login_user, register_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


class ProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O nome não pode ficar em branco.")
        return value


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


def _get_current_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
) -> User:
    user_id = get_user_id_from_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


def _public_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


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

    return _public_user(_get_current_user(credentials, db))


@router.patch("/me/profile")
def update_profile(
    request: ProfileUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user = _get_current_user(credentials, db)
    user.name = request.name
    db.commit()
    db.refresh(user)
    return _public_user(user)


@router.put("/me/password")
def change_password(
    request: PasswordChangeRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user = _get_current_user(credentials, db)
    if not verify_password(request.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="A senha atual não confere.")
    if verify_password(request.new_password, user.password_hash):
        raise HTTPException(
            status_code=422,
            detail="A nova senha precisa ser diferente da senha atual.",
        )
    user.password_hash = hash_password(request.new_password)
    db.commit()
    return {"message": "Senha atualizada com sucesso."}
