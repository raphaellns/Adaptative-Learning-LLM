from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth import bearer_scheme, get_user_id_from_token
from app.database import get_db
from app.models.user import User
from app.models.assessment import Assessment, AssessmentSubmission


router = APIRouter(
    prefix="/admin",
    tags=["Administração"]
)


class RoleUpdateRequest(BaseModel):
    role: str = Field(pattern="^(STUDENT|TEACHER)$")


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


@router.get("/overview")
def get_admin_overview(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    get_admin_user(credentials, db)
    role_counts = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )
    return {
        "users": sum(role_counts.values()),
        "students": role_counts.get("STUDENT", 0),
        "teachers": role_counts.get("TEACHER", 0),
        "administrators": role_counts.get("ADMIN", 0),
        "published_assessments": db.query(Assessment)
            .filter(Assessment.is_published.is_(True)).count(),
        "submissions": db.query(AssessmentSubmission).count(),
    }


@router.get("/users")
def list_users(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    get_admin_user(credentials, db)

    users = db.query(User.id, User.name, User.email, User.role).all()

    return [
        {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role
        }
        for user_id, name, email, role in users
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


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    request: RoleUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    get_admin_user(credentials, db)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if user.role == "ADMIN":
        raise HTTPException(
            status_code=400,
            detail="A função de administrador não pode ser alterada por esta tela.",
        )

    user.role = request.role
    db.commit()
    return {"id": user.id, "name": user.name, "role": user.role}
