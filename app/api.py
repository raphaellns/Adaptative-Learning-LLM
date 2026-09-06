from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.llm_analyzer import analyze_answer
from app.exam_analyzer import analyze_exam
from app.routes.auth import router as auth_router


app = FastAPI(
    title="Adaptive Learning API",
    description="Backend do sistema de aprendizagem adaptativa",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

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


@app.post("/exam/analyze")
def analyze_exam_endpoint(request: ExamRequest):

    questions = [
        {
            "question": question.question,
            "answer_key": question.answer_key,
            "student_answer": question.student_answer
        }
        for question in request.questions
    ]

    return analyze_exam(questions)