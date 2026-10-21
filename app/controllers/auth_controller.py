from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


def register_user(request: RegisterRequest, db: Session):

    user = User(
        name=request.name.strip(),
        email=str(request.email).strip().lower(),
        password_hash=hash_password(request.password)
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.") from error
    db.refresh(user)

    return {
        "message": "Usuário criado com sucesso!",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }

def login_user(request: LoginRequest, db: Session):
    email = str(request.email).strip().lower()

    user = (
        db.query(User)
        .filter(func.lower(User.email) == email)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos."
        )

    if not verify_password(
        request.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos."
        )

    access_token = create_access_token(
        user.id,
        user.role
    )

    return {
    "message": "Login realizado com sucesso!",
    "access_token": access_token,
    "user": {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }
}
