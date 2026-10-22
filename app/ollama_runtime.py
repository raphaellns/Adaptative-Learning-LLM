"""Shared limits for Ollama calls made by the API process."""

import os
from contextlib import contextmanager
from threading import BoundedSemaphore

from dotenv import load_dotenv


load_dotenv()

LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT", "180"))
OLLAMA_MAX_CONCURRENT = int(os.getenv("OLLAMA_MAX_CONCURRENT", "1"))

if LLM_TIMEOUT_SECONDS <= 0:
    raise RuntimeError("LLM_TIMEOUT deve ser maior que zero.")
if OLLAMA_MAX_CONCURRENT < 1:
    raise RuntimeError("OLLAMA_MAX_CONCURRENT deve ser pelo menos 1.")

_OLLAMA_SLOTS = BoundedSemaphore(OLLAMA_MAX_CONCURRENT)


@contextmanager
def ollama_slot(timeout_seconds: float):
    """Limit simultaneous work and bound time spent waiting for a slot."""
    if not _OLLAMA_SLOTS.acquire(timeout=timeout_seconds):
        raise TimeoutError("O Ollama está ocupado e não liberou uma vaga a tempo.")
    try:
        yield
    finally:
        _OLLAMA_SLOTS.release()
