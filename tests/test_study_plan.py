import unittest

from app.study_plan import _build_plan_evidence, _normalize_plan_items


class StudyPlanTests(unittest.TestCase):
    def test_plan_evidence_contains_prioritized_topics_with_observed_errors(self):
        profile = {
            "total_questions": 4,
            "correct": 2,
            "incorrect": 2,
            "accuracy": 50,
            "topics": {
                "Estruturas condicionais": {"incorrect": 2},
                "Lógica de programação": {"incorrect": 0},
            },
        }
        priorities = [
            {"topic": "Estruturas condicionais", "accuracy": 0, "priority": 100},
            {"topic": "Lógica de programação", "accuracy": 100, "priority": 0},
        ]
        results = [
            {"correta": False, "topico": "Estruturas condicionais", "erro_principal": "Condição invertida"},
            {"correta": False, "topico": "Estruturas condicionais", "erro_principal": "Condição invertida"},
            {"correta": True, "topico": "Lógica de programação", "erro_principal": ""},
        ]

        evidence, topics = _build_plan_evidence(profile, priorities, results)

        self.assertEqual(topics, ["Estruturas condicionais"])
        self.assertEqual(evidence["topicos_prioritarios_com_evidencia"][0]["respostas_incorretas_no_historico"], 2)
        self.assertEqual(evidence["topicos_prioritarios_com_evidencia"][0]["erros_observados_recentemente"], [
            "Condição invertida"
        ])

    def test_plan_output_uses_computed_priority_and_bounds_time_and_lists(self):
        raw_items = [{
            "topico": "Estruturas condicionais",
            "prioridade": 999,
            "motivo": "  Dois erros observados  ",
            "objetivo": "Revisar decisões condicionais",
            "conteudos": ["if e else", "operadores", "caso extra", "item extra"],
            "atividades": ["Resolver exercícios", "Explicar os testes", "atividade extra"],
            "tempo_estimado_minutos": 1000,
        }]

        result = _normalize_plan_items(
            raw_items,
            ["Estruturas condicionais"],
            [{"topic": "Estruturas condicionais", "priority": 75.5}],
        )

        self.assertEqual(result, [{
            "topico": "Estruturas condicionais",
            "prioridade": 75.5,
            "motivo": "Dois erros observados",
            "objetivo": "Revisar decisões condicionais",
            "conteudos": ["if e else", "operadores", "caso extra"],
            "atividades": ["Resolver exercícios", "Explicar os testes"],
            "tempo_estimado_minutos": 90,
        }])

    def test_plan_output_discards_unknown_non_actionable_and_duplicate_topics(self):
        actionable = {
            "topico": "Estruturas condicionais",
            "motivo": "Dois erros recorrentes",
            "objetivo": "Praticar condições",
            "conteudos": ["if e else"],
            "atividades": [],
            "tempo_estimado_minutos": 30,
        }
        raw_items = [
            {"topico": "tópico inventado", "motivo": "x", "objetivo": "y"},
            {"topico": "Lógica de programação", "motivo": "x", "objetivo": "y"},
            actionable,
            actionable,
            {
                "topico": "Estruturas condicionais",
                "motivo": "Dois erros recorrentes",
                "objetivo": "Praticar condições",
                "conteudos": [],
                "atividades": [],
                "tempo_estimado_minutos": 30,
            },
        ]

        result = _normalize_plan_items(
            raw_items,
            ["Estruturas condicionais"],
            [{"topic": "Estruturas condicionais", "priority": 80}],
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["topico"], "Estruturas condicionais")


if __name__ == "__main__":
    unittest.main()
import unittest
