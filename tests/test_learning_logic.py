import unittest

from app.student_profile import build_student_profile
from app.study_priority import calculate_study_priorities


class LearningLogicTests(unittest.TestCase):
    def test_profile_counts_correctness_and_topic_totals(self):
        profile = build_student_profile([
            {"correta": True, "topico": "Lógica de programação"},
            {"correta": False, "topico": "Lógica de programação"},
            {"correta": False, "topico": "Estruturas condicionais"},
        ])

        self.assertEqual(profile["total_questions"], 3)
        self.assertEqual(profile["correct"], 1)
        self.assertEqual(profile["incorrect"], 2)
        self.assertAlmostEqual(profile["accuracy"], 33.33, places=2)
        self.assertEqual(profile["topics"]["Lógica de programação"], {
            "correct": 1,
            "incorrect": 1,
            "accuracy": 50.0,
        })

    def test_empty_history_has_zero_accuracy_and_no_priorities(self):
        profile = build_student_profile([])

        self.assertEqual(profile["total_questions"], 0)
        self.assertEqual(profile["accuracy"], 0)
        self.assertEqual(profile["topics"], {})
        self.assertEqual(calculate_study_priorities(profile), [])

    def test_priorities_put_lowest_accuracy_first(self):
        profile = build_student_profile([
            {"correta": True, "topico": "Lógica de programação"},
            {"correta": False, "topico": "Estruturas condicionais"},
        ])

        priorities = calculate_study_priorities(profile)

        self.assertEqual([item["topic"] for item in priorities], [
            "Estruturas condicionais",
            "Lógica de programação",
        ])
        self.assertEqual(priorities[0]["priority"], 100)
        self.assertEqual(priorities[1]["priority"], 0)


if __name__ == "__main__":
    unittest.main()
