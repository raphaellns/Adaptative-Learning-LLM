"""Small, single-process protections for the local TCC prototype.

Production deployments should also enforce request limits and distributed
rate limits at the reverse proxy or API gateway.
"""

import hashlib
import re
import threading
import time
from collections import OrderedDict, deque

from starlette.responses import JSONResponse


_ASSESSMENT_QUESTION_SUBMISSION = re.compile(
    r"^/assessments/(\d+)/questions/(\d+)/submit$"
)
_ASSESSMENT_BULK_SUBMISSION = re.compile(r"^/assessments/(\d+)/submit-all$")


class _RequestBodyTooLarge(Exception):
    pass


class ApiProtectionMiddleware:
    """Reject oversized request bodies and throttle costly routes by client IP."""

    MAX_JSON_BODY_BYTES = 8 * 1024 * 1024
    MAX_UPLOAD_BODY_BYTES = 27 * 1024 * 1024
    MAX_TRACKED_KEYS = 4096

    def __init__(self, app):
        self.app = app
        self._requests = OrderedDict()
        self._lock = threading.Lock()

    @staticmethod
    def _rate_policy(method: str, path: str):
        if method != "POST":
            return None
        if path == "/auth/login":
            return "login", 10, 15 * 60
        if path == "/auth/register":
            return "register", 10, 60 * 60
        if path.startswith("/ocr/"):
            return "ocr", 8, 10 * 60
        question_match = _ASSESSMENT_QUESTION_SUBMISSION.fullmatch(path)
        if question_match:
            assessment_id, question_id = question_match.groups()
            return f"assessment-question:{assessment_id}:{question_id}", 5, 10 * 60
        bulk_match = _ASSESSMENT_BULK_SUBMISSION.fullmatch(path)
        if bulk_match:
            return f"assessment-bulk:{bulk_match.group(1)}", 3, 10 * 60
        if path in {"/exam/analyze", "/analyze"}:
            return "direct-grading", 10, 10 * 60
        return None

    @staticmethod
    async def _respond(scope, receive, send, status_code: int, detail: str, headers=None):
        response = JSONResponse(
            status_code=status_code,
            content={"detail": detail},
            headers=headers,
        )
        await response(scope, receive, send)

    def _consume_rate_limit(self, key: tuple[str, str], limit: int, window: int):
        now = time.monotonic()
        with self._lock:
            events = self._requests.setdefault(key, deque())
            self._requests.move_to_end(key)
            while events and now - events[0] >= window:
                events.popleft()
            if len(events) >= limit:
                return max(1, int(window - (now - events[0])))

            events.append(now)
            while len(self._requests) > self.MAX_TRACKED_KEYS:
                self._requests.popitem(last=False)
        return None

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "GET").upper()
        path = scope.get("path", "")
        client = scope.get("client")
        client_ip = client[0] if client else "unknown"
        request_headers = {
            key.lower(): value
            for key, value in scope.get("headers", [])
        }

        body_limit = (
            self.MAX_UPLOAD_BODY_BYTES
            if path.startswith("/ocr/")
            else self.MAX_JSON_BODY_BYTES
        )
        if method in {"POST", "PUT", "PATCH", "DELETE"}:
            content_length = request_headers.get(b"content-length")
            if content_length:
                try:
                    declared_length = int(content_length)
                except (TypeError, ValueError):
                    await self._respond(
                        scope, receive, send, 400, "Cabeçalho Content-Length inválido."
                    )
                    return
                if declared_length < 0:
                    await self._respond(
                        scope, receive, send, 400, "Cabeçalho Content-Length inválido."
                    )
                    return
                if declared_length > body_limit:
                    await self._respond(
                        scope, receive, send, 413, "O corpo da solicitação excede o limite."
                    )
                    return

        rate_policy = self._rate_policy(method, path)
        if rate_policy:
            rate_key, request_limit, window_seconds = rate_policy
            identity = client_ip
            authorization = request_headers.get(b"authorization", b"")
            if (
                rate_key not in {"login", "register"}
                and authorization.lower().startswith(b"bearer ")
            ):
                token_fingerprint = hashlib.sha256(
                    authorization[7:]
                ).hexdigest()[:16]
                identity = f"{client_ip}:{token_fingerprint}"
            retry_after = self._consume_rate_limit(
                (identity, rate_key), request_limit, window_seconds
            )
            if retry_after is not None:
                await self._respond(
                    scope,
                    receive,
                    send,
                    429,
                    "Muitas solicitações. Aguarde antes de tentar novamente.",
                    headers={"Retry-After": str(retry_after), "Cache-Control": "no-store"},
                )
                return

        if method not in {"POST", "PUT", "PATCH", "DELETE"}:
            await self.app(scope, receive, send)
            return

        received_bytes = 0
        response_started = False

        async def limited_receive():
            nonlocal received_bytes
            message = await receive()
            if message["type"] == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > body_limit:
                    raise _RequestBodyTooLarge
            return message

        async def tracked_send(message):
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, limited_receive, tracked_send)
        except _RequestBodyTooLarge:
            if not response_started:
                await self._respond(
                    scope, receive, send, 413, "O corpo da solicitação excede o limite."
                )
