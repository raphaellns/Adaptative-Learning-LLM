import difflib
import json
import os
import re
import tempfile
import time
from pathlib import Path

import pytesseract
from ollama import Client
from PIL import Image, ImageOps


VISION_MODEL = os.getenv("OCR_VISION_MODEL", "qwen3-vl:4b-instruct")
# Foto de celular (4000x3000) vira milhares de tokens visuais e estoura o contexto
# do Ollama; reduzir o lado maior mantém a letra legível e deixa o modelo rápido.
MAX_IMAGE_SIDE = int(os.getenv("OCR_MAX_IMAGE_SIDE", "1600"))
VISION_TIMEOUT_SECONDS = float(os.getenv("OCR_VISION_TIMEOUT", "120"))
VISION_NUM_CTX = int(os.getenv("OCR_NUM_CTX", "8192"))
TESSERACT_TIMEOUT_SECONDS = int(os.getenv("OCR_TESSERACT_TIMEOUT", "25"))


def _log(message: str) -> None:
    print(f"[OCR] {message}", flush=True)


def transcribe_image(
    image_path: str,
    engine: str,
    page_segmentation_mode: int = 6,
    purpose: str = "student_answer",
    question_context: str = "",
) -> dict:
    """Transcribe or separate exam image content without evaluating it."""
    started_at = time.perf_counter()
    if purpose not in {"assessment_question", "student_answer"}:
        raise ValueError("Finalidade de transcrição inválida.")

    if engine == "tesseract":
        text = _transcribe_with_tesseract(image_path, page_segmentation_mode)
        fields = _fields_from_plain_text(text, purpose)
        return {
            "text": text,
            **fields,
            "engine": "tesseract",
            "model": None,
            "processing_time_seconds": round(time.perf_counter() - started_at, 2),
        }

    if engine == "vision":
        fields, metrics = _transcribe_with_vision(
            image_path,
            purpose=purpose,
            question_context=question_context,
        )
        text = _join_transcribed_fields(fields, purpose)
        return {
            "text": text,
            **fields,
            "engine": "vision",
            "model": VISION_MODEL,
            "processing_time_seconds": round(time.perf_counter() - started_at, 2),
            **metrics,
        }

    raise ValueError("Motor de OCR inválido.")


def _fields_from_plain_text(text: str, purpose: str) -> dict[str, str]:
    if purpose == "assessment_question":
        question, answer_key = _fallback_split_teacher_text(text)
        return {"question": question, "answer_key": answer_key}
    return {"student_answer": text}


def _join_transcribed_fields(fields: dict[str, str], purpose: str) -> str:
    if purpose == "assessment_question":
        return "\n\n".join(
            value for value in (fields.get("question", ""), fields.get("answer_key", ""))
            if value
        )
    return fields.get("student_answer", "")


def _transcribe_with_tesseract(image_path: str, page_segmentation_mode: int) -> str:
    with Image.open(image_path) as image:
        return pytesseract.image_to_string(
            image,
            lang="por",
            config=f"--psm {page_segmentation_mode}",
        ).strip()


def _transcribe_with_vision(
    image_path: str,
    *,
    purpose: str,
    question_context: str = "",
) -> tuple[dict[str, str], dict]:
    prep_started = time.perf_counter()
    _log(f"preparando imagem (purpose={purpose})")
    prepared_path, prepared_info = _prepare_image_for_vision(
        image_path,
        question_context=question_context if purpose == "student_answer" else "",
    )
    _log(
        f"imagem pronta em {time.perf_counter() - prep_started:.1f}s: "
        f"{prepared_info['size']}, recortou_enunciado={prepared_info['cropped_below_question']}"
    )
    try:
        if purpose == "assessment_question":
            prompt = (
                "Extraia dois campos desta imagem de prova em JSON. Use a posição e o estilo visual. "
                "Todo texto impresso na parte superior, incluindo o enunciado e itens, pertence exclusivamente "
                "a question. Todo conteúdo manuscrito, especialmente a resolução em código que começa abaixo "
                "do espaço em branco, pertence exclusivamente a answer_key.\n"
                "A resolução manuscrita é uma resposta de referência para correção mesmo sem o título Gabarito "
                "e mesmo se tiver erros. Não repita em question nenhum texto manuscrito ou que esteja em "
                "answer_key. Não invente, corrija ou complete. Se existir escrita manuscrita, answer_key nunca "
                "pode ficar vazio.\n"
                "Preserve quebras de linha, símbolos, acentuação e erros. "
                'Responda somente com JSON válido neste formato: '
                '{"question":"...","answer_key":"..."}.'
            )
            expect_json = True
        elif prepared_info["cropped_below_question"]:
            # A imagem enviada já contém só a área abaixo do enunciado impresso:
            # o modelo não precisa separar nada, apenas transcrever.
            prompt = (
                "Esta imagem contém a resposta escrita à mão por um estudante, possivelmente código. "
                "Transcreva exatamente o que está escrito, linha por linha, preservando indentação, "
                "símbolos, acentuação e erros. Não corrija, não complete, não explique e não avalie. "
                "Se não houver escrita legível, responda apenas: VAZIO.\n"
                "Responda somente com a transcrição, sem JSON e sem blocos de código."
            )
            expect_json = False
        else:
            prompt = (
                "Esta é a foto de uma folha de avaliação. A parte impressa (enunciado, instruções, "
                "alternativas) NÃO faz parte da resposta. A resposta do estudante é somente o que foi "
                "escrito à mão ou marcado pelo estudante, normalmente abaixo do enunciado.\n"
                "Transcreva apenas a escrita à mão, linha por linha, preservando indentação, símbolos, "
                "acentuação e erros. Não copie nenhum texto impresso. Não corrija, não explique e não avalie. "
                "Se não houver escrita à mão, responda apenas: VAZIO.\n"
                "Responda somente com a transcrição, sem JSON e sem blocos de código."
            )
            expect_json = False

        raw_text, metrics = _run_vision_chat(
            prompt,
            prepared_path,
            expect_json=expect_json,
        )
    finally:
        if prepared_path != image_path:
            Path(prepared_path).unlink(missing_ok=True)

    raw_text = _remove_code_fence(raw_text)
    if purpose == "student_answer":
        fields = {"student_answer": _clean_student_answer(
            raw_text,
            question_context=question_context,
            already_cropped=prepared_info["cropped_below_question"],
        )}
    else:
        fields = _parse_vision_fields(raw_text, purpose)

    metrics.update(
        {
            "image_sent_size": prepared_info["size"],
            "cropped_below_question": prepared_info["cropped_below_question"],
        }
    )
    return fields, metrics


def _run_vision_chat(prompt: str, image_path: str, *, expect_json: bool) -> tuple[str, dict]:
    """Chama o Ollama em streaming, com prazo máximo e detecção de repetição infinita."""
    client = Client(timeout=VISION_TIMEOUT_SECONDS)
    started = time.monotonic()
    deadline = started + VISION_TIMEOUT_SECONDS
    chat_kwargs = {"format": "json"} if expect_json else {}

    parts: list[str] = []
    last_chunk = None
    stopped_early = False
    first_token_logged = False
    _log(f"enviando para o Ollama ({VISION_MODEL}); aguardando primeiro token...")
    stream = None
    try:
        stream = client.chat(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                    "images": [str(Path(image_path).resolve())],
                }
            ],
            stream=True,
            think=False,
            keep_alive="15m",
            options={
                "temperature": 0,
                "num_ctx": VISION_NUM_CTX,
                "num_predict": 800,
                "repeat_penalty": 1.05,
            },
            **chat_kwargs,
        )
        for chunk in stream:
            last_chunk = chunk
            piece = chunk.message.content or ""
            if piece and not first_token_logged:
                _log(f"primeiro token após {time.monotonic() - started:.1f}s")
                first_token_logged = True
            parts.append(piece)
            if _is_looping("".join(parts)):
                stopped_early = True
                break
            if time.monotonic() > deadline:
                stopped_early = True
                break
    except Exception as error:
        if type(error).__name__ in {"ReadTimeout", "ConnectTimeout", "PoolTimeout", "TimeoutException"}:
            raise TimeoutError("O Ollama não respondeu a tempo.") from error
        raise
    finally:
        close = getattr(stream, "close", None)
        if close:
            close()

    text = "".join(parts)
    if not text.strip() and stopped_early:
        raise TimeoutError("O modelo de visão demorou demais para responder.")
    if stopped_early:
        text = _trim_repetition(text)
    _log(
        f"Ollama terminou em {time.monotonic() - started:.1f}s, "
        f"{len(text)} caracteres, parou_cedo={stopped_early}"
    )

    def seconds(attribute: str) -> float:
        return round((getattr(last_chunk, attribute, 0) or 0) / 1e9, 2)

    return text, {
        "generated_tokens": getattr(last_chunk, "eval_count", None),
        "generation_time_seconds": seconds("eval_duration"),
        "model_load_time_seconds": seconds("load_duration"),
        "prompt_processing_time_seconds": seconds("prompt_eval_duration"),
        "stopped_early": stopped_early,
    }


def _prepare_image_for_vision(
    image_path: str,
    *,
    question_context: str = "",
) -> tuple[str, dict]:
    """Corrige rotação EXIF, reduz a foto e, se possível, tira o enunciado impresso."""
    with Image.open(image_path) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")

    cropped = False
    if question_context.strip():
        below_question = _crop_below_printed_question(image, question_context)
        if below_question is not None:
            image = below_question
            cropped = True

    longest_side = max(image.size)
    if longest_side > MAX_IMAGE_SIDE:
        scale = MAX_IMAGE_SIDE / longest_side
        image = image.resize(
            (round(image.width * scale), round(image.height * scale)),
            Image.LANCZOS,
        )

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temporary_file:
        image.save(temporary_file, format="PNG")
        prepared_path = temporary_file.name
    return prepared_path, {"size": f"{image.width}x{image.height}", "cropped_below_question": cropped}


def _normalize_for_match(text: str) -> str:
    return re.sub(r"[^0-9a-zà-ÿ]+", " ", text.lower()).strip()


def _crop_below_printed_question(image: Image.Image, question_context: str) -> Image.Image | None:
    """Acha onde o enunciado impresso termina e devolve só a área abaixo dele.

    Usa o Tesseract (bom em texto impresso, ruim em manuscrito) para localizar as linhas
    que coincidem com o enunciado que o sistema já conhece. Se nada coincidir, devolve
    None e a imagem inteira segue para o modelo.
    """
    question_norm = _normalize_for_match(question_context)
    if len(question_norm) < 20:
        return None

    # O Tesseract não precisa da foto em resolução máxima para achar texto impresso.
    detect_scale = min(1.0, 2000 / max(image.size))
    detect_image = (
        image.resize((round(image.width * detect_scale), round(image.height * detect_scale)), Image.LANCZOS)
        if detect_scale < 1.0
        else image
    )
    try:
        languages = pytesseract.get_languages(config="")
        language = "por" if "por" in languages else "eng"
        started = time.perf_counter()
        data = pytesseract.image_to_data(
            detect_image,
            lang=language,
            config="--psm 3",
            output_type=pytesseract.Output.DICT,
            timeout=TESSERACT_TIMEOUT_SECONDS,
        )
        _log(f"tesseract ({language}) detectou o enunciado em {time.perf_counter() - started:.1f}s")
    except Exception as error:
        _log(f"tesseract falhou/estourou o tempo, enviando imagem inteira: {error}")
        return None

    lines: dict[tuple, dict] = {}
    for index, word in enumerate(data["text"]):
        word = word.strip()
        try:
            confidence = float(data["conf"][index])
        except (TypeError, ValueError):
            continue
        if not word or confidence < 50:
            continue
        key = (data["block_num"][index], data["par_num"][index], data["line_num"][index])
        line = lines.setdefault(key, {"words": [], "bottom": 0})
        line["words"].append(word)
        line["bottom"] = max(
            line["bottom"],
            (data["top"][index] + data["height"][index]) / detect_scale,
        )

    matched_bottoms = []
    for line in lines.values():
        line_norm = _normalize_for_match(" ".join(line["words"]))
        if len(line_norm) < 12:
            continue
        match = difflib.SequenceMatcher(None, line_norm, question_norm).find_longest_match(
            0, len(line_norm), 0, len(question_norm)
        )
        if match.size / len(line_norm) >= 0.6:
            matched_bottoms.append(line["bottom"])

    if not matched_bottoms:
        return None

    crop_top = round(max(matched_bottoms)) + round(image.height * 0.01)
    # Só vale recortar se sobrar uma área razoável para a resposta.
    if crop_top < image.height * 0.05 or crop_top > image.height * 0.85:
        return None
    return image.crop((0, crop_top, image.width, image.height))


def _is_looping(text: str) -> bool:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) >= 6 and len(set(lines[-6:])) == 1:
        return True
    return re.search(r"(.{2,40}?)\1{9,}\s*$", text[-600:], re.DOTALL) is not None


def _trim_repetition(text: str) -> str:
    text = re.sub(r"(.{2,40}?)\1{9,}\s*$", r"\1", text, flags=re.DOTALL)
    kept: list[str] = []
    repeats = 0
    for line in text.splitlines():
        if kept and line.strip() and line.strip() == kept[-1].strip():
            repeats += 1
            if repeats >= 2:
                continue
        else:
            repeats = 0
        kept.append(line)
    return "\n".join(kept).strip()


def _clean_student_answer(raw_text: str, *, question_context: str, already_cropped: bool) -> str:
    text = raw_text.strip()
    # Compatibilidade: se o modelo ainda responder em JSON, extrai o campo.
    if text.startswith("{"):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                text = _field_text(parsed.get("student_answer")).strip()
        except json.JSONDecodeError:
            pass
    if re.fullmatch(r"(?i)\W*vazio\W*", text):
        return ""
    if already_cropped or not question_context.strip():
        return text

    # Sem recorte, remove linhas longas que sejam cópia do enunciado impresso.
    question_norm = _normalize_for_match(question_context)
    kept = []
    for line in text.splitlines():
        line_norm = _normalize_for_match(line)
        if len(line_norm) >= 25 and line_norm in question_norm:
            continue
        kept.append(line)
    return "\n".join(kept).strip()


def _parse_vision_fields(raw_text: str, purpose: str) -> dict[str, str]:
    candidate = raw_text.strip()
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", candidate, re.DOTALL)
        try:
            parsed = json.loads(match.group(0)) if match else None
        except json.JSONDecodeError:
            parsed = None

    if purpose == "assessment_question":
        if isinstance(parsed, dict):
            return _remove_repeated_answer_from_question(
                _field_text(parsed.get("question")),
                _field_text(parsed.get("answer_key")),
            )
        question, answer_key = _fallback_split_teacher_text(candidate)
        return {"question": question, "answer_key": answer_key}

    if isinstance(parsed, dict):
        return {"student_answer": _field_text(parsed.get("student_answer"))}
    return {"student_answer": candidate}


def _field_text(value: object) -> str:
    return value if isinstance(value, str) else ""


def _remove_repeated_answer_from_question(question: str, answer_key: str) -> dict[str, str]:
    """Remove only an answer block that the vision model repeated in the question."""
    question = question.strip()
    answer_key = answer_key.strip()
    if not question or not answer_key:
        return {"question": question, "answer_key": answer_key}

    repeated_at = question.rfind(answer_key)
    if repeated_at < 0 or not question[repeated_at:].strip() == answer_key:
        return {"question": question, "answer_key": answer_key}

    before_repetition = question[:repeated_at].rstrip()
    code_preamble = re.search(r"(?m)^\s*(?:#include|using\s+namespace)\b", before_repetition)
    if code_preamble:
        before_repetition = before_repetition[:code_preamble.start()].rstrip()

    return {"question": before_repetition, "answer_key": answer_key}


def _fallback_split_teacher_text(text: str) -> tuple[str, str]:
    match = re.search(
        r"(?im)^\s*(?:gabarito(?:\s+oficial)?|resposta\s+(?:correta|esperada)|solu[cç][aã]o|crit[eé]rios?\s+de\s+corre[cç][aã]o)\s*[:：-]\s*",
        text,
    )
    if not match:
        return text.strip(), ""
    return text[:match.start()].strip(), text[match.end():].strip()


def _remove_code_fence(text: str) -> str:
    """Remove only an outer Markdown fence occasionally added by vision models."""
    fenced = re.fullmatch(r"\s*```(?:[A-Za-z0-9_+-]+)?\s*\n?(.*?)\n?```\s*", text, re.DOTALL)
    return fenced.group(1) if fenced else text.strip()