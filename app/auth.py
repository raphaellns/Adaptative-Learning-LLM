import os

import jwt
from dotenv import load_dotenv
from fastapi import HTTPException
from fastapi.security import HTTPBearer
from pwdlib import PasswordHash


load_dotenv()


password_hash = PasswordHash.recommended()

bearer_scheme = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(user_id: int) -> str:

    payload = {
        "sub": str(user_id)
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
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Token inválido."
            )

        return int(user_id)

    except (jwt.InvalidTokenError, ValueError):

        raise HTTPException(
            status_code=401,
            detail="Token inválido."
        )