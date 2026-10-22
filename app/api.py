import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.database import get_db
from app.llm_analyzer import analyze_answer
from app.models.user import User
from app.security_middleware import ApiProtectionMiddleware
from app.routes.auth import router as auth_router
from app.routes.exam import router as exam_router
from app.routes.admin import router as admin_router
from app.routes.history import router as history_router
from app.routes.profile import router as profile_router
from app.routes.ocr import router as ocr_router
from app.routes.assessments import router as assessments_router
from app.schemas.exam import QuestionRequest


ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if origin.strip()
]


app = FastAPI(
    title="Adaptive Learning API",
    description="Backend do sistema de aprendizagem adaptativa",
    version="1.0.0",
)


app.add_middleware(ApiProtectionMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(exam_router)
app.include_router(admin_router)
app.include_router(history_router)
app.include_router(profile_router)
app.include_router(ocr_router)
app.include_router(assessments_router)

@app.get("/")
def root():
    return {
        "message": "Adaptive Learning API is running!"
    }


@app.post("/analyze")
def analyze(
    request: QuestionRequest,
    credentials=Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user_id = get_user_id_from_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Sessão inválida.")
    if user.role != "TEACHER":
        raise HTTPException(status_code=403, detail="Acesso de professor necessário.")

    result = analyze_answer(
        request.question,
        request.answer_key,
        request.student_answer
    )

    return result
