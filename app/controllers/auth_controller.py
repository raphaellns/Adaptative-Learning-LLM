from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.auth import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


def register_user(request: RegisterRequest, db: Session):

    user = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password)
    )

    db.add(user)
    db.commit()
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

    user = (
        db.query(User)
        .filter(User.email == request.email)
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


