import unittest

from app.security_middleware import ApiProtectionMiddleware


class ApiProtectionTests(unittest.TestCase):
    def test_study_plan_generation_is_limited_for_current_and_legacy_methods(self):
        self.assertEqual(
            ApiProtectionMiddleware._rate_policy("POST", "/profile/study-plan"),
            ("study-plan", 3, 600),
        )
        self.assertEqual(
            ApiProtectionMiddleware._rate_policy("GET", "/profile/study-plan"),
            ("study-plan", 3, 600),
        )

    def test_study_plan_limit_blocks_the_fourth_request_in_the_window(self):
        middleware = ApiProtectionMiddleware(lambda scope, receive, send: None)
        key = ("student-token", "study-plan")
        for _ in range(3):
            self.assertIsNone(middleware._consume_rate_limit(key, 3, 600))
        self.assertGreater(middleware._consume_rate_limit(key, 3, 600), 0)


if __name__ == "__main__":
    unittest.main()
