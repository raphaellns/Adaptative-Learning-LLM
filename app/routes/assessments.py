from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.controllers.exam_controller import analyze_and_save_exam
from app.database import get_db
from app.models.analysis import Analysis
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentSubmission
from app.models.exam_question import ExamQuestion
from app.models.user import User
from app.schemas.assessment import (
    AssessmentBulkSubmissionRequest,
    AssessmentCreateRequest,
    AssessmentSubmissionRequest,
)
from app.schemas.exam import ExamRequest, QuestionRequest


router = APIRouter(prefix="/assessments", tags=["Avaliações por questão"])


def get_current_user(credentials: HTTPAuthorizationCredentials, db: Session) -> User:
    user_id = get_user_id_from_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


def require_manager(user: User) -> None:
    if user.role != "TEACHER":
        raise HTTPException(status_code=403, detail="Acesso de professor necessário.")


def get_assessment_or_404(assessment_id: int, db: Session) -> Assessment:
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if assessment is None:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")
    return assessment


def can_manage(user: User, assessment: Assessment) -> bool:
    return user.role == "TEACHER" and assessment.teacher_id == user.id


@router.post("")
def create_assessment(
    request: AssessmentCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials, db)
    require_manager(user)

    title = request.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Informe um título para a avaliação.")

    for index, item in enumerate(request.questions):
        if not item.question.strip() or not item.answer_key.strip():
            raise HTTPException(
                status_code=422,
                detail=f"Questão {index + 1}: enunciado e gabarito são obrigatórios.",
            )

    assessment = Assessment(teacher_id=user.id, title=title, is_published=True)
    db.add(assessment)
    try:
        db.flush()
        for index, item in enumerate(request.questions):
            db.add(AssessmentQuestion(
                assessment_id=assessment.id,
                question=item.question.strip(),
                answer_key=item.answer_key.strip(),
                order_index=index + 1,
            ))
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "id": assessment.id,
        "title": assessment.title,
        "question_count": len(request.questions),
        "is_published": assessment.is_published,
    }


@router.get("")
def list_assessments(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials, db)
    query = db.query(Assessment, User.name).join(User, User.id == Assessment.teacher_id)

    if user.role == "STUDENT":
        query = query.filter(Assessment.is_published.is_(True))
    elif user.role == "TEACHER":
        query = query.filter(Assessment.teacher_id == user.id)
    else:
        raise HTTPException(status_code=403, detail="Acesso não autorizado.")

    rows = query.order_by(Assessment.created_at.desc()).all()
    return [
        {
            "id": assessment.id,
            "title": assessment.title,
            "teacher_name": teacher_name,
            "created_at": assessment.created_at.isoformat(),
            "question_count": db.query(AssessmentQuestion)
                .filter(AssessmentQuestion.assessment_id == assessment.id).count(),
        }
        for assessment, teacher_name in rows
    ]


@router.get("/{assessment_id}/questions")
def list_assessment_questions(
    assessment_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials, db)
    assessment = get_assessment_or_404(assessment_id, db)
    manager = can_manage(user, assessment)

    if not manager and (user.role != "STUDENT" or not assessment.is_published):
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")

    questions = (
        db.query(AssessmentQuestion)
        .filter(AssessmentQuestion.assessment_id == assessment.id)
        .order_by(AssessmentQuestion.order_index)
        .all()
    )
    return [
        {
            "id": item.id,
            "order": item.order_index,
            "question": item.question,
            **({"answer_key": item.answer_key} if manager else {}),
        }
        for item in questions
    ]


@router.post("/{assessment_id}/questions/{question_id}/submit")
def submit_question_answer(
    assessment_id: int,
    question_id: int,
    request: AssessmentSubmissionRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials, db)
    if user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Somente estudantes podem enviar respostas.")

    assessment = get_assessment_or_404(assessment_id, db)
    if not assessment.is_published:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")

    question = (
        db.query(AssessmentQuestion)
        .filter(
            AssessmentQuestion.id == question_id,
            AssessmentQuestion.assessment_id == assessment.id,
        )
        .first()
    )
    if question is None:
        raise HTTPException(status_code=404, detail="Questão não encontrada nesta avaliação.")

    student_answer = request.student_answer.strip()
    if not student_answer:
        raise HTTPException(status_code=422, detail="Transcreva ou digite sua resposta.")

    exam_request = ExamRequest(questions=[QuestionRequest(
        question=question.question,
        answer_key=question.answer_key,
        student_answer=student_answer,
    )])
    try:
        result = analyze_and_save_exam(
            exam_request, user.id, db, commit=False, generate_plan=False
        )
        exam_question_id = result["exam_question_ids"][0]
        db.add(AssessmentSubmission(
            assessment_question_id=question.id,
            student_id=user.id,
            exam_question_id=exam_question_id,
        ))
        db.commit()
    except Exception:
        db.rollback()
        raise

    result.pop("exam_question_ids", None)
    result["assessment"] = {"id": assessment.id, "title": assessment.title}
    result["question_order"] = question.order_index
    result["student_answer"] = student_answer
    return result


@router.post("/{assessment_id}/submit-all")
def submit_all_question_answers(
    assessment_id: int,
    request: AssessmentBulkSubmissionRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Corrige e salva todas as respostas preenchidas pelo estudante em uma só ação."""
    user = get_current_user(credentials, db)
    if user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Somente estudantes podem enviar respostas.")

    assessment = get_assessment_or_404(assessment_id, db)
    if not assessment.is_published:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")

    submitted_ids = [item.question_id for item in request.answers]
    if len(set(submitted_ids)) != len(submitted_ids):
        raise HTTPException(status_code=422, detail="Cada questão pode ser enviada somente uma vez por vez.")

    questions = (
        db.query(AssessmentQuestion)
        .filter(
            AssessmentQuestion.assessment_id == assessment.id,
            AssessmentQuestion.id.in_(submitted_ids),
        )
        .all()
    )
    questions_by_id = {item.id: item for item in questions}
    if len(questions_by_id) != len(submitted_ids):
        raise HTTPException(status_code=404, detail="Uma das questões não pertence a esta avaliação.")

    exam_items = []
    ordered_questions = []
    for item in request.answers:
        answer = item.student_answer.strip()
        if not answer:
            raise HTTPException(status_code=422, detail="Revise as respostas antes de enviar.")
        question = questions_by_id[item.question_id]
        ordered_questions.append(question)
        exam_items.append(QuestionRequest(
            question=question.question,
            answer_key=question.answer_key,
            student_answer=answer,
        ))

    try:
        result = analyze_and_save_exam(
            ExamRequest(questions=exam_items),
            user.id,
            db,
            commit=False,
            generate_plan=False,
        )
        for question, exam_question_id in zip(ordered_questions, result["exam_question_ids"]):
            db.add(AssessmentSubmission(
                assessment_question_id=question.id,
                student_id=user.id,
                exam_question_id=exam_question_id,
            ))
        db.commit()
    except Exception:
        db.rollback()
        raise

    results = result["questions"]
    result.pop("exam_question_ids", None)
    result["assessment"] = {"id": assessment.id, "title": assessment.title}
    result["submissions"] = [
        {
            "question_id": question.id,
            "question_order": question.order_index,
            "result": analysis,
        }
        for question, analysis in zip(ordered_questions, results)
    ]
    return result


@router.get("/{assessment_id}/submissions")
def list_assessment_submissions(
    assessment_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials, db)
    assessment = get_assessment_or_404(assessment_id, db)
    if not can_manage(user, assessment):
        raise HTTPException(status_code=403, detail="Apenas o professor responsável pode consultar envios.")

    rows = (
        db.query(AssessmentSubmission, User, AssessmentQuestion, ExamQuestion, Analysis)
        .join(User, User.id == AssessmentSubmission.student_id)
        .join(AssessmentQuestion, AssessmentQuestion.id == AssessmentSubmission.assessment_question_id)
        .join(ExamQuestion, ExamQuestion.id == AssessmentSubmission.exam_question_id)
        .join(Analysis, Analysis.question_id == ExamQuestion.id)
        .filter(AssessmentQuestion.assessment_id == assessment.id)
        .order_by(AssessmentSubmission.submitted_at.desc())
        .all()
    )
    return [
        {
            "student_name": student.name,
            "question_order": assessment_question.order_index,
            "question": assessment_question.question,
            "answer_key": assessment_question.answer_key,
            "student_answer": exam_question.student_answer,
            "result": {
                "correta": analysis.correta,
                "topico": analysis.topico,
                "erro_principal": analysis.erro_principal,
                "explicacao": analysis.explicacao,
            },
            "submitted_at": submission.submitted_at.isoformat(),
        }
        for submission, student, assessment_question, exam_question, analysis in rows
    ]
