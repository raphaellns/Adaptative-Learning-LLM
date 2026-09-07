from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.database import get_db
from app.models.user import User


router = APIRouter(
    prefix="/admin",
    tags=["Administração"]
)


def get_admin_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session
):
    token = credentials.credentials

    user_id = get_user_id_from_token(token)

    admin = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if admin is None:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado."
        )

    if admin.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Acesso administrativo necessário."
        )

    return admin


@router.get("/users")
def list_users(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    get_admin_user(credentials, db)

    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
        for user in users
    ]


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    admin = get_admin_user(credentials, db)


    if admin.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="O administrador não pode excluir a própria conta."
        )


    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )


    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado."
        )


    db.delete(user)
    db.commit()


    return {
        "message": "Usuário excluído com sucesso."
    }