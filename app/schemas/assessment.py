from pydantic import BaseModel, Field


class AssessmentQuestionInput(BaseModel):
    question: str = Field(min_length=1, max_length=12000)
    answer_key: str = Field(min_length=1, max_length=20000)


class AssessmentCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    questions: list[AssessmentQuestionInput] = Field(min_length=1, max_length=30)


class AssessmentSubmissionRequest(BaseModel):
    student_answer: str = Field(min_length=1, max_length=30000)


class AssessmentBulkSubmissionItem(BaseModel):
    question_id: int = Field(gt=0)
    student_answer: str = Field(min_length=1, max_length=30000)


class AssessmentBulkSubmissionRequest(BaseModel):
    answers: list[AssessmentBulkSubmissionItem] = Field(min_length=1, max_length=30)
