"""Roda o OCR direto, sem navegador/API, mostrando o tempo de cada etapa.

Uso:  python debug_ocr.py caminho/da/foto.jpg "texto do enunciado da questão"
"""
import json
import sys

from app.ocr.ocr_service import transcribe_image

image = sys.argv[1]
question = sys.argv[2] if len(sys.argv) > 2 else ""
result = transcribe_image(image, engine="vision", purpose="student_answer", question_context=question)
print(json.dumps(result, ensure_ascii=False, indent=2))
