import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.exam_analyzer import analyze_exam
from app.models.exam import Exam
from app.models.exam_question import ExamQuestion
from app.models.analysis import Analysis
from app.schemas.exam import ExamRequest


def analyze_and_save_exam(
    request: ExamRequest,
    user_id: int,
    db: Session
):

    if not request.questions:
        raise HTTPException(
            status_code=400,
            detail="A prova precisa ter pelo menos uma questão."
        )


    exam = Exam(
        user_id=user_id
    )

    db.add(exam)
    db.flush()


    results = []


    for question_data in request.questions:

        result = analyze_exam_question(
            question_data.question,
            question_data.answer_key,
            question_data.student_answer
        )


        question = ExamQuestion(
            exam_id=exam.id,
            question=question_data.question,
            answer_key=question_data.answer_key,
            student_answer=question_data.student_answer
        )

        db.add(question)
        db.flush()


        analysis = Analysis(
            question_id=question.id,
            correta=result["correta"],
            topico=result["topico"],
            erro_principal=result["erro_principal"],
            explicacao=result["explicacao"],
            recomendacoes=json.dumps(
                result["recomendacoes"],
                ensure_ascii=False
            )
        )

        db.add(analysis)

        results.append(result)


    db.commit()


    return {
        "exam_id": exam.id,
        "questions": results
    }


def analyze_exam_question(
    question: str,
    answer_key: str,
    student_answer: str
):

    from app.llm_analyzer import analyze_answer

    return analyze_answer(
        question,
        answer_key,
        student_answer
    )