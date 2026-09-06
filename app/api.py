from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.llm_analyzer import analyze_answer
from app.routes.auth import router as auth_router
from app.routes.exam import router as exam_router


app = FastAPI(
    title="Adaptive Learning API",
    description="Backend do sistema de aprendizagem adaptativa",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.0:5500",
        "http://0.0.0.0:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(exam_router)

class QuestionRequest(BaseModel):
    question: str
    answer_key: str
    student_answer: str


class ExamRequest(BaseModel):
    questions: list[QuestionRequest]


@app.get("/")
def root():
    return {
        "message": "Adaptive Learning API is running!"
    }


@app.post("/analyze")
def analyze(request: QuestionRequest):

    result = analyze_answer(
        request.question,
        request.answer_key,
        request.student_answer
    )

    return result
