from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    user: Mapped["User"] = relationship(
        back_populates="exams"
    )

    questions: Mapped[list["ExamQuestion"]] = relationship(
        back_populates="exam",
        cascade="all, delete-orphan"
    )