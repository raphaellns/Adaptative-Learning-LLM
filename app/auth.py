import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import HTTPException
from fastapi.security import HTTPBearer
from pwdlib import PasswordHash


load_dotenv()


password_hash = PasswordHash.recommended()

JWT_SECRET_KEY = (os.getenv("JWT_SECRET_KEY") or "").strip()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_SECONDS = 60 * 60

if len(JWT_SECRET_KEY.encode("utf-8")) < 32:
    raise RuntimeError(
        "JWT_SECRET_KEY precisa ter pelo menos 32 bytes. Gere uma chave aleatória "
        "com: python -c 'import secrets; print(secrets.token_hex(32))'"
    )


bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(user_id: int, role: str) -> str:
    issued_at = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": issued_at,
        "exp": issued_at + timedelta(seconds=ACCESS_TOKEN_TTL_SECONDS),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

def get_user_id_from_token(token: str) -> int:

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["exp", "iat", "sub"]},
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Token inválido."
            )

        parsed_user_id = int(user_id)
        if parsed_user_id <= 0:
            raise ValueError("Invalid user id")
        return parsed_user_id

    except (jwt.InvalidTokenError, ValueError):

        raise HTTPException(
            status_code=401,
            detail="Token inválido."
        )
