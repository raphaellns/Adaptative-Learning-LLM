from pydantic import BaseModel


class QuestionRequest(BaseModel):
    question: str
    answer_key: str
    student_answer: str


class ExamRequest(BaseModel):
    questions: list[QuestionRequest]