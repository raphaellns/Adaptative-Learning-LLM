from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import RegisterRequest


def register_user(request: RegisterRequest, db: Session):

    user = User(
        name=request.name,
        email=request.email,
        password_hash=request.password
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


