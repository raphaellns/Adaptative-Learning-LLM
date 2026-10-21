import json
import hashlib
import time

from app.study_plan import generate_study_plan
from app.student_profile import build_student_profile
from app.study_priority import calculate_study_priorities

from collections import OrderedDict, defaultdict

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.database import get_db
from app.models.analysis import Analysis
from app.models.exam_question import ExamQuestion
from app.models.exam import Exam


router = APIRouter(
    prefix="/profile",
    tags=["Perfil"]
)

_STUDY_PLAN_CACHE: OrderedDict[tuple[int, str], dict] = OrderedDict()
_STUDY_PLAN_CACHE_LIMIT = 64


@router.get("/performance")
def get_performance(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    user_id = get_user_id_from_token(token)


    analyses = (
        db.query(Analysis)
        .join(
            ExamQuestion,
            Analysis.question_id == ExamQuestion.id
        )
        .join(
            Exam,
            ExamQuestion.exam_id == Exam.id
        )
        .filter(Exam.user_id == user_id)
        .all()
    )


    total_questions = len(analyses)

    correct_answers = sum(
        1
        for analysis in analyses
        if analysis.correta
    )


    incorrect_answers = (
        total_questions - correct_answers
    )


    overall_accuracy = (
        correct_answers / total_questions * 100
        if total_questions > 0
        else 0
    )


    topics = defaultdict(
        lambda: {
            "total": 0,
            "correct": 0
        }
    )


    for analysis in analyses:

        topic = analysis.topico

        topics[topic]["total"] += 1

        if analysis.correta:
            topics[topic]["correct"] += 1


    topic_performance = []


    for topic, values in topics.items():

        accuracy = (
            values["correct"]
            / values["total"]
            * 100
        )


        topic_performance.append({
            "topic": topic,
            "total": values["total"],
            "correct": values["correct"],
            "incorrect": (
                values["total"]
                - values["correct"]
            ),
            "accuracy": round(accuracy, 1)
        })


    topic_performance.sort(
        key=lambda topic: topic["accuracy"]
    )


    return {
        "total_questions": total_questions,
        "correct": correct_answers,
        "incorrect": incorrect_answers,
        "accuracy": round(overall_accuracy, 1),
        "topics": topic_performance
    }

@router.get("/study-plan")
def get_study_plan(
    credentials=Depends(bearer_scheme),
    db=Depends(get_db)
):
    token = credentials.credentials
    user_id = get_user_id_from_token(token)

    analyses = (
        db.query(Analysis)
        .join(
            ExamQuestion,
            Analysis.question_id == ExamQuestion.id
        )
        .join(
            Exam,
            ExamQuestion.exam_id == Exam.id
        )
        .filter(
            Exam.user_id == user_id
        )
        .order_by(Exam.created_at.asc(), Analysis.id.asc())
        .all()
    )

    historical_results = []

    for analysis in analyses:
        recommendations = []

        if analysis.recomendacoes:
            recommendations = json.loads(
                analysis.recomendacoes
            )

        historical_results.append({
            "correta": analysis.correta,
            "topico": analysis.topico,
            "erro_principal": analysis.erro_principal,
            "explicacao": analysis.explicacao,
            "recomendacoes": recommendations
        })

    if not historical_results:
        return {
            "message": "Ainda não existem avaliações suficientes para gerar um plano.",
            "study_plan": None
        }

    profile = build_student_profile(
        historical_results
    )

    priorities = calculate_study_priorities(
        profile
    )

    if not any(not result["correta"] for result in historical_results):
        # A correct-only history has no evidenced learning gaps to plan for.
        study_plan = {"plano": []}
    else:
        plan_started = time.perf_counter()
        history_digest = hashlib.sha256(
            json.dumps(
                historical_results,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
        ).hexdigest()
        cache_key = (user_id, history_digest)
        study_plan = _STUDY_PLAN_CACHE.get(cache_key)
        cache_hit = study_plan is not None
        if study_plan is None:
            study_plan = generate_study_plan(
                profile,
                priorities,
                historical_results,
            )
            _STUDY_PLAN_CACHE[cache_key] = study_plan
            _STUDY_PLAN_CACHE.move_to_end(cache_key)
            while len(_STUDY_PLAN_CACHE) > _STUDY_PLAN_CACHE_LIMIT:
                _STUDY_PLAN_CACHE.popitem(last=False)
        else:
            _STUDY_PLAN_CACHE.move_to_end(cache_key)
        print(
            f"[LLM] plano user={user_id} cache_hit={cache_hit} "
            f"total={time.perf_counter() - plan_started:.2f}s",
            flush=True,
        )

    return {
        "profile": profile,
        "priorities": priorities,
        "study_plan": study_plan
    }
