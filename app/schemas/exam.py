from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=12000)
    answer_key: str = Field(min_length=1, max_length=20000)
    student_answer: str = Field(min_length=1, max_length=30000)


class ExamRequest(BaseModel):
    questions: list[QuestionRequest] = Field(min_length=1, max_length=30)
