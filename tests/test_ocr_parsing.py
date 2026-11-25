import json
import unittest

from app.ocr.ocr_service import (
    _fallback_split_teacher_text,
    _parse_assessment_document_questions,
    _parse_student_document_answers,
)


class OCRParsingTests(unittest.TestCase):
    def test_teacher_document_parser_keeps_question_and_private_key_separate(self):
        payload = json.dumps({
            "questions": [{
                "number": 3,
                "question": "Leia vinte notas e calcule a média.",
                "answer_key": "Acumular a soma e dividir por vinte.",
            }]
        })

        result = _parse_assessment_document_questions(payload)

        self.assertEqual(result, [{
            "number": "3",
            "question": "Leia vinte notas e calcule a média.",
            "answer_key": "Acumular a soma e dividir por vinte.",
        }])

    def test_student_document_parser_discards_unknown_duplicate_and_empty_answers(self):
        payload = json.dumps({
            "answers": [
                {"question_id": "11", "student_answer": "int main() { return 0; }"},
                {"question_id": "99", "student_answer": "resposta fora da avaliação"},
                {"question_id": "11", "student_answer": "duplicada"},
                {"question_id": "12", "student_answer": "VAZIO"},
            ]
        })

        result = _parse_student_document_answers(payload, {"11", "12"})

        self.assertEqual(result, [{
            "question_id": "11",
            "student_answer": "int main() { return 0; }",
        }])

    def test_teacher_text_fallback_splits_an_explicit_answer_key_label(self):
        question, answer_key = _fallback_split_teacher_text(
            "Questão: calcule a média.\nGabarito oficial: soma / quantidade"
        )

        self.assertEqual(question, "Questão: calcule a média.")
        self.assertEqual(answer_key, "soma / quantidade")


if __name__ == "__main__":
    unittest.main()
