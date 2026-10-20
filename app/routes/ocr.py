import io
import tempfile
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.auth import bearer_scheme, get_user_id_from_token
from app.database import get_db
from app.models.user import User
from app.ocr.ocr_service import transcribe_image


router = APIRouter(prefix="/ocr", tags=["OCR"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
CONTENT_TYPE_SUFFIXES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


@router.post("/transcribe")
def transcribe_answer_image(
    file: UploadFile = File(...),
    engine: Literal["vision", "tesseract"] = Form("vision"),
    purpose: Literal["assessment_question", "student_answer"] = Form("student_answer"),
    question_context: str = Form(""),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    _validate_user(credentials, db)

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

        try:
            with Image.open(io.BytesIO(image_bytes)) as image:
                image.verify()
        except (UnidentifiedImageError, OSError) as error:
            raise HTTPException(
                status_code=400,
                detail="O arquivo enviado não contém uma imagem válida.",
            ) from error

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


def _validate_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
) -> None:
    user_id = get_user_id_from_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")