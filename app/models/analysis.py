from sqlalchemy import BigInteger, Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    question_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("exam_questions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    correta: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False
    )

    topico: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    erro_principal: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    explicacao: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    recomendacoes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    question: Mapped["ExamQuestion"] = relationship(
        back_populates="analysis"
    )