# @module: Recurring Payments Module.model
# @spec_section_id: Section 3
# @req_ids: REC-01, REC-02, REC-03, REC-04, REC-201
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""
SQLAlchemy ORM Data Models for the Recurring Payments Module.
Implements the canonical database schema for recurring_payments and related entities
in accordance with FinPulse Engine specifications.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


class User(Base):
    """ORM model for the users table."""
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    base_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    recurring_payments: Mapped[list["RecurringPayment"]] = relationship(
        "RecurringPayment", back_populates="user", cascade="all, delete-orphan"
    )


class RecurringPayment(Base):
    """
    ORM model for the recurring_payments table.
    Satisfies requirements REC-01, REC-02, REC-03, REC-04, and REC-201.
    """
    __tablename__ = "recurring_payments"

    recurring_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    payment_name: Mapped[str] = mapped_column(String(100), nullable=False)
    expected_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    frequency: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g., WEEKLY, MONTHLY, YEARLY
    next_due_date: Mapped[date] = mapped_column(Date, nullable=False)
    reminder_days_prior: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ACTIVE")  # e.g., ACTIVE, PAUSED, CANCELLED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="recurring_payments")

    def __repr__(self) -> str:
        return (
            f"<RecurringPayment(recurring_id={self.recurring_id}, "
            f"user_id={self.user_id}, payment_name='{self.payment_name}', "
            f"expected_amount={self.expected_amount}, frequency='{self.frequency}', "
            f"next_due_date={self.next_due_date}, status='{self.status}')>"
        )