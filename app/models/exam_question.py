from sqlalchemy import BigInteger, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    exam_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("exams.id", ondelete="CASCADE"),
        nullable=False
    )

    question: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    answer_key: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    student_answer: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    exam: Mapped["Exam"] = relationship(
        back_populates="questions"
    )

    analysis: Mapped["Analysis"] = relationship(
        back_populates="question",
        uselist=False,
        cascade="all, delete-orphan"
    )