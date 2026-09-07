from datetime import datetime

from sqlalchemy import BigInteger, String, TIMESTAMP, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    exams: Mapped[list["Exam"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="STUDENT"
    )

from app.models.exam import Exam