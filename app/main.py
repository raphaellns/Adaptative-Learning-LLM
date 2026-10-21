"""Executa a avaliação reproduzível dos casos anotados em data/questions.py."""

import argparse
import json
import math
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path

from app.llm_analyzer import ANALYSIS_MODEL, analyze_answer
from data.questions import questions


def _percent(numerator: int, denominator: int) -> float | None:
    if denominator == 0:
        return None
    return round(numerator / denominator * 100, 2)


def _percentile(values: list[float], percentile: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = max(0, math.ceil(percentile * len(ordered)) - 1)
    return round(ordered[index], 3)


def evaluate(samples: list[dict]) -> dict:
    results = []
    latencies = []

    for position, sample in enumerate(samples, start=1):
        sample_id = sample["id"]
        print(f"[{position}/{len(samples)}] Avaliando caso {sample_id}...", flush=True)
        started = time.perf_counter()
        try:
            prediction = analyze_answer(
                sample["question"],
                sample["answer_key"],
                sample["student_answer"],
            )
            elapsed = time.perf_counter() - started
            latencies.append(elapsed)
            results.append({
                "id": sample_id,
                "status": "ok",
                "expected_correct": bool(sample["expected_correct"]),
                "predicted_correct": bool(prediction["correta"]),
                "expected_topic": sample["topic"],
                "predicted_topic": prediction["topico"],
                "latency_seconds": round(elapsed, 3),
            })
        except Exception as error:
            results.append({
                "id": sample_id,
                "status": "error",
                "error_type": type(error).__name__,
                "latency_seconds": round(time.perf_counter() - started, 3),
            })
            print(f"  Falha: {type(error).__name__}", flush=True)

    completed = [item for item in results if item["status"] == "ok"]
    classification_hits = sum(
        item["expected_correct"] == item["predicted_correct"]
        for item in completed
    )
    topic_hits = sum(
        item["expected_topic"] == item["predicted_topic"]
        for item in completed
    )
    true_positive = sum(
        item["expected_correct"] and item["predicted_correct"]
        for item in completed
    )
    true_negative = sum(
        not item["expected_correct"] and not item["predicted_correct"]
        for item in completed
    )
    false_positive = sum(
        not item["expected_correct"] and item["predicted_correct"]
        for item in completed
    )
    false_negative = sum(
        item["expected_correct"] and not item["predicted_correct"]
        for item in completed
    )
    topic_counts = {}
    for item in completed:
        topic = item["expected_topic"]
        metrics = topic_counts.setdefault(topic, {"samples": 0, "correct": 0})
        metrics["samples"] += 1
        metrics["correct"] += item["expected_topic"] == item["predicted_topic"]
    topic_accuracy_by_topic = {
        topic: {
            **metrics,
            "accuracy_percent": _percent(metrics["correct"], metrics["samples"]),
        }
        for topic, metrics in topic_counts.items()
    }

    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": ANALYSIS_MODEL,
        "dataset": "data/questions.py",
        "samples_requested": len(samples),
        "samples_completed": len(completed),
        "samples_failed": len(results) - len(completed),
        "classification_accuracy_percent": _percent(
            classification_hits, len(completed)
        ),
        "topic_accuracy_percent": _percent(topic_hits, len(completed)),
        "topic_accuracy_by_topic": topic_accuracy_by_topic,
        "confusion_matrix": {
            "true_positive": true_positive,
            "true_negative": true_negative,
            "false_positive": false_positive,
            "false_negative": false_negative,
        },
        "latency_seconds": {
            "mean": round(statistics.mean(latencies), 3) if latencies else None,
            "median": round(statistics.median(latencies), 3) if latencies else None,
            "p95": _percentile(latencies, 0.95),
        },
        "results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Mede classificação, tópico e latência do modelo nos casos anotados."
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Avalia somente os primeiros N casos (útil para verificar a configuração).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Salva o resultado detalhado em JSON no caminho informado.",
    )
    args = parser.parse_args()

    if args.limit is not None and args.limit < 1:
        parser.error("--limit precisa ser maior que zero.")

    samples = questions[:args.limit] if args.limit else questions
    report = evaluate(samples)
    print("\n===== AVALIAÇÃO DO MODELO =====")
    print(f"Modelo: {report['model']}")
    print(
        "Casos concluídos: "
        f"{report['samples_completed']}/{report['samples_requested']} "
        f"(falhas: {report['samples_failed']})"
    )
    print(
        "Acurácia de classificação: "
        f"{report['classification_accuracy_percent']}%"
    )
    print(f"Acurácia de tópico: {report['topic_accuracy_percent']}%")
    for topic, metrics in report["topic_accuracy_by_topic"].items():
        print(
            f"  {topic}: {metrics['accuracy_percent']}% "
            f"({metrics['correct']}/{metrics['samples']})"
        )
    print(f"Latência média: {report['latency_seconds']['mean']} s")
    print(f"Latência mediana: {report['latency_seconds']['median']} s")
    print(f"Latência p95: {report['latency_seconds']['p95']} s")
    print(f"Matriz de confusão: {report['confusion_matrix']}")
    for item in report["results"]:
        if item["status"] == "ok" and (
            item["expected_correct"] != item["predicted_correct"]
            or item["expected_topic"] != item["predicted_topic"]
        ):
            print(
                f"  Divergência no caso {item['id']}: "
                f"classificação {item['expected_correct']} → {item['predicted_correct']}; "
                f"tópico {item['expected_topic']} → {item['predicted_topic']}"
            )

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Relatório salvo em: {args.output}")

    return 1 if report["samples_failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
