"""Calcula métricas de transcrição a partir de uma planilha CSV revisada."""

import argparse
import csv
import json
import math
import re
import statistics
import unicodedata
from collections import defaultdict
from pathlib import Path


REQUIRED_COLUMNS = {
    "sample_id",
    "engine",
    "kind",
    "reference_text",
    "predicted_text",
    "expected_question_count",
    "detected_question_count",
    "elapsed_seconds",
}


def normalize(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text or "")
    return re.sub(r"\s+", " ", normalized).strip()


def edit_distance(reference: list, prediction: list) -> int:
    """Levenshtein distance with linear memory."""
    if len(reference) < len(prediction):
        reference, prediction = prediction, reference
    previous = list(range(len(prediction) + 1))
    for row_index, reference_item in enumerate(reference, start=1):
        current = [row_index]
        for column_index, prediction_item in enumerate(prediction, start=1):
            current.append(min(
                current[-1] + 1,
                previous[column_index] + 1,
                previous[column_index - 1]
                + (reference_item != prediction_item),
            ))
        previous = current
    return previous[-1]


def _optional_int(value: str | None, row_number: int, column: str) -> int | None:
    value = (value or "").strip()
    if not value:
        return None
    try:
        return int(value)
    except ValueError as error:
        raise ValueError(
            f"Linha {row_number}: {column} precisa ser um número inteiro."
        ) from error


def _optional_float(value: str | None, row_number: int, column: str) -> float | None:
    value = (value or "").strip()
    if not value:
        return None
    try:
        number = float(value)
    except ValueError as error:
        raise ValueError(
            f"Linha {row_number}: {column} precisa ser numérico."
        ) from error
    if not math.isfinite(number) or number < 0:
        raise ValueError(
            f"Linha {row_number}: {column} precisa ser finito e não negativo."
        )
    return number


def read_rows(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError(
                "CSV sem as colunas obrigatórias: " + ", ".join(sorted(missing))
            )

        rows = []
        for row_number, row in enumerate(reader, start=2):
            sample_id = (row.get("sample_id") or "").strip()
            engine = (row.get("engine") or "").strip()
            kind = (row.get("kind") or "").strip()
            if not sample_id or not engine or not kind:
                raise ValueError(
                    f"Linha {row_number}: preencha sample_id, engine e kind."
                )
            rows.append({
                "sample_id": sample_id,
                "engine": engine,
                "kind": kind,
                "reference_text": normalize(row.get("reference_text") or ""),
                "predicted_text": normalize(row.get("predicted_text") or ""),
                "expected_question_count": _optional_int(
                    row.get("expected_question_count"), row_number,
                    "expected_question_count",
                ),
                "detected_question_count": _optional_int(
                    row.get("detected_question_count"), row_number,
                    "detected_question_count",
                ),
                "elapsed_seconds": _optional_float(
                    row.get("elapsed_seconds"), row_number, "elapsed_seconds"
                ),
            })
    if not rows:
        raise ValueError("O CSV não contém linhas de avaliação.")
    return rows


def evaluate(rows: list[dict]) -> dict:
    groups = defaultdict(list)
    for row in rows:
        groups[(row["engine"], row["kind"])].append(row)

    reports = []
    for (engine, kind), samples in sorted(groups.items()):
        character_errors = 0
        reference_characters = 0
        word_errors = 0
        reference_words = 0
        count_matches = 0
        count_samples = 0
        latencies = []

        for sample in samples:
            reference = sample["reference_text"]
            prediction = sample["predicted_text"]
            character_errors += edit_distance(list(reference), list(prediction))
            reference_characters += max(1, len(reference))
            reference_tokens = reference.split()
            prediction_tokens = prediction.split()
            word_errors += edit_distance(reference_tokens, prediction_tokens)
            reference_words += max(1, len(reference_tokens))

            expected_count = sample["expected_question_count"]
            detected_count = sample["detected_question_count"]
            if expected_count is not None and detected_count is not None:
                count_samples += 1
                count_matches += expected_count == detected_count
            if sample["elapsed_seconds"] is not None:
                latencies.append(sample["elapsed_seconds"])

        reports.append({
            "engine": engine,
            "kind": kind,
            "samples": len(samples),
            "character_error_rate_percent": round(
                character_errors / reference_characters * 100, 2
            ),
            "word_error_rate_percent": round(
                word_errors / reference_words * 100, 2
            ),
            "question_count_accuracy_percent": (
                round(count_matches / count_samples * 100, 2)
                if count_samples else None
            ),
            "question_count_samples": count_samples,
            "latency_seconds": {
                "mean": round(statistics.mean(latencies), 3) if latencies else None,
                "median": round(statistics.median(latencies), 3) if latencies else None,
                "p95": (
                    round(sorted(latencies)[max(0, math.ceil(0.95 * len(latencies)) - 1)], 3)
                    if latencies else None
                ),
            },
        })

    return {
        "normalization": "NFKC; espaços e quebras de linha consecutivos viram um espaço; caixa e sinais são preservados.",
        "groups": reports,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Calcula CER, WER, separação de questões e latência de OCR."
    )
    parser.add_argument("csv_path", type=Path, help="CSV preenchido com transcrições revisadas.")
    parser.add_argument("--output", type=Path, help="Salva o relatório detalhado em JSON.")
    args = parser.parse_args()

    report = evaluate(read_rows(args.csv_path))
    print("===== AVALIAÇÃO DE OCR =====")
    print(report["normalization"])
    for group in report["groups"]:
        print(
            f"{group['engine']} / {group['kind']} · n={group['samples']} · "
            f"CER={group['character_error_rate_percent']}% · "
            f"WER={group['word_error_rate_percent']}% · "
            f"questões={group['question_count_accuracy_percent']}% "
            f"(n={group['question_count_samples']}) · "
            f"mediana={group['latency_seconds']['median']} s · "
            f"p95={group['latency_seconds']['p95']} s"
        )
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Relatório salvo em: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
