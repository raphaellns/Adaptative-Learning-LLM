import io
import tempfile
from pathlib import Path
from typing import Literal

import pymupdf
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.database import get_db
from app.models.assessment import Assessment, AssessmentQuestion
from app.models.user import User
from app.ocr.ocr_service import (
    transcribe_assessment_document,
    transcribe_image,
    transcribe_student_assessment_document,
)


router = APIRouter(prefix="/ocr", tags=["OCR"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
CONTENT_TYPE_SUFFIXES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
MAX_DOCUMENT_FILE_SIZE_BYTES = 25 * 1024 * 1024
MAX_DOCUMENT_PAGES = 8
MAX_IMAGE_PIXELS = 20_000_000
MAX_IMAGE_SIDE = 10_000


@router.post("/transcribe")
def transcribe_answer_image(
    file: UploadFile = File(...),
    engine: Literal["vision", "tesseract"] = Form("vision"),
    purpose: Literal["assessment_question", "student_answer"] = Form("student_answer"),
    question_context: str = Form("", max_length=12000),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    user = _validate_user(credentials, db)
    if purpose == "assessment_question":
        _require_teacher(user)

    temporary_path: Path | None = None
    try:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=415,
                detail="Envie uma imagem PNG, JPEG ou WebP.",
            )

        image_bytes = file.file.read(MAX_FILE_SIZE_BYTES + 1)
        if len(image_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="A imagem deve ter no máximo 10 MB.",
            )

        _validate_image_bytes(image_bytes)

        with tempfile.NamedTemporaryFile(
            suffix=CONTENT_TYPE_SUFFIXES[file.content_type],
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            temporary_file.write(image_bytes)

        return transcribe_image(
            str(temporary_path),
            engine=engine,
            purpose=purpose,
            question_context=question_context,
        )
    except HTTPException:
        raise
    except TimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail=(
                "O modelo demorou demais para ler a imagem. "
                "Tente recortar só a sua resposta ou envie uma foto mais próxima."
            ),
        ) from error
    except Exception as error:
        print(f"Erro na transcrição OCR: {error}")
        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível transcrever a imagem. "
                "Verifique se o Ollama está em execução e tente novamente."
            ),
        ) from error
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
        file.file.close()


@router.post("/transcribe-assessment")
def transcribe_assessment_file(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Lê uma prova completa e devolve cartões de questão para revisão do professor."""
    _require_teacher(_validate_user(credentials, db))

    temporary_paths: list[Path] = []
    try:
        temporary_paths = _uploaded_document_to_images(file)
        return transcribe_assessment_document([str(path) for path in temporary_paths])
    except HTTPException:
        raise
    except TimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail=(
                "O modelo demorou demais para ler esta prova. "
                "Tente enviar menos páginas ou uma imagem mais próxima."
            ),
        ) from error
    except Exception as error:
        print(f"Erro na importação OCR da prova: {error}")
        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível ler a prova. Verifique se o PDF abre normalmente "
                "e se o Ollama está em execução."
            ),
        ) from error
    finally:
        for path in temporary_paths:
            path.unlink(missing_ok=True)
        file.file.close()


@router.post("/transcribe-student-assessment")
def transcribe_student_assessment_file(
    assessment_id: int = Form(...),
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Preenche as respostas de uma avaliação a partir de uma prova inteira do estudante."""
    user = _validate_user(credentials, db)
    if user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Somente estudantes podem enviar respostas.")

    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if assessment is None or not assessment.is_published:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")
    questions = (
        db.query(AssessmentQuestion)
        .filter(AssessmentQuestion.assessment_id == assessment.id)
        .order_by(AssessmentQuestion.order_index)
        .all()
    )
    if not questions:
        raise HTTPException(status_code=422, detail="Esta avaliação ainda não possui questões.")

    temporary_paths: list[Path] = []
    try:
        temporary_paths = _uploaded_document_to_images(file)
        question_context = [
            {"id": item.id, "order": item.order_index, "question": item.question}
            for item in questions
        ]
        return transcribe_student_assessment_document(
            [str(path) for path in temporary_paths],
            question_context,
        )
    except HTTPException:
        raise
    except TimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail=(
                "O modelo demorou demais para ler sua prova. "
                "Tente enviar menos páginas ou uma imagem mais próxima."
            ),
        ) from error
    except Exception as error:
        print(f"Erro na importação OCR da resposta do estudante: {error}")
        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível ler sua prova. Verifique se o PDF abre normalmente "
                "e se o Ollama está em execução."
            ),
        ) from error
    finally:
        for path in temporary_paths:
            path.unlink(missing_ok=True)
        file.file.close()


def _uploaded_document_to_images(file: UploadFile) -> list[Path]:
    is_pdf = (
        file.content_type == "application/pdf"
        or (file.filename or "").lower().endswith(".pdf")
    )
    if not is_pdf and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Envie um PDF, PNG, JPEG ou WebP.",
        )

    content = file.file.read(MAX_DOCUMENT_FILE_SIZE_BYTES + 1)
    if len(content) > MAX_DOCUMENT_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="A prova deve ter no máximo 25 MB.",
        )
    if not content:
        raise HTTPException(status_code=400, detail="O arquivo enviado está vazio.")

    if is_pdf:
        return _render_pdf_pages(content)

    _validate_image_bytes(content)
    return [_save_temporary_file(content, CONTENT_TYPE_SUFFIXES[file.content_type])]


def _validate_image_bytes(content: bytes) -> None:
    try:
        with Image.open(io.BytesIO(content)) as image:
            width, height = image.size
            if (
                width > MAX_IMAGE_SIDE
                or height > MAX_IMAGE_SIDE
                or width * height > MAX_IMAGE_PIXELS
            ):
                raise HTTPException(
                    status_code=413,
                    detail="A imagem tem resolução acima do limite de processamento.",
                )
            image.verify()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise HTTPException(
            status_code=400,
            detail="O arquivo enviado não contém uma imagem válida.",
        ) from error


def _save_temporary_file(content: bytes, suffix: str) -> Path:
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temporary_file:
        temporary_file.write(content)
        return Path(temporary_file.name)


def _render_pdf_pages(content: bytes) -> list[Path]:
    try:
        document = pymupdf.open(stream=content, filetype="pdf")
    except Exception as error:
        raise HTTPException(status_code=400, detail="O arquivo não é um PDF válido.") from error

    pages: list[Path] = []
    try:
        if document.page_count == 0:
            raise HTTPException(status_code=400, detail="O PDF não possui páginas.")
        if document.page_count > MAX_DOCUMENT_PAGES:
            raise HTTPException(
                status_code=422,
                detail=f"Envie uma prova de até {MAX_DOCUMENT_PAGES} páginas por vez.",
            )

        for page_number in range(document.page_count):
            page = document.load_page(page_number)
            width = round(page.rect.width * 2)
            height = round(page.rect.height * 2)
            if (
                width <= 0
                or height <= 0
                or width > MAX_IMAGE_SIDE
                or height > MAX_IMAGE_SIDE
                or width * height > MAX_IMAGE_PIXELS
            ):
                raise HTTPException(
                    status_code=413,
                    detail=(
                        "Uma página do PDF tem dimensões acima do limite de "
                        "processamento. Reduza a resolução ou divida o arquivo."
                    ),
                )
            pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
            pages.append(_save_temporary_file(pixmap.tobytes("png"), ".png"))
        return pages
    except Exception:
        for path in pages:
            path.unlink(missing_ok=True)
        raise
    finally:
        document.close()


def _validate_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
) -> User:
    user_id = get_user_id_from_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


def _require_teacher(user: User) -> None:
    if user.role not in {"ADMIN", "TEACHER"}:
        raise HTTPException(status_code=403, detail="Acesso de professor necessário.")
