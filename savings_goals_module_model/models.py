# @module: Savings Goals Module.model
# @spec_section_id: Section 3
# @req_ids: GOAL-01, GOAL-02, GOAL-03, GOAL-04, AC-06, GOAL-201, GOAL-200
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""
SQLAlchemy ORM models for the Savings Goals Module.
Implements the canonical database schema for savings_goals and associated relationships.
"""

import uuid
from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

# Inferred assumption: Base is imported from a shared database session module within the platform monorepo.
try:
    from database import Base
except ImportError:
    from sqlalchemy.orm import declarative_base
    Base = declarative_base()


class SavingsGoalModel(Base):
    """
    ORM Model representing the savings_goals table.
    Tracks user-defined savings targets, current fund allocations, target completion dates,
    velocity indicators, and automatic completion triggers (GOAL-01, GOAL-02, GOAL-03, GOAL-04, GOAL-200, GOAL-201, AC-06).
    """
    __tablename__ = "savings_goals"

    goal_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="Unique identifier for the savings goal"
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        comment="Owner user ID referencing the users table"
    )
    goal_name = Column(
        String(100),
        nullable=False,
        comment="User-defined title or name for the savings goal"
    )
    target_amount = Column(
        Numeric(12, 2),
        nullable=False,
        comment="Target monetary amount required to achieve the goal"
    )
    current_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0.00,
        comment="Current accumulated amount allocated toward the goal"
    )
    target_date = Column(
        Date,
        nullable=False,
        comment="Target deadline date for achieving the savings goal"
    )
    status = Column(
        String(30),
        nullable=False,
        default="ACTIVE",
        comment="Current status of the goal (e.g., ACTIVE, COMPLETED, CANCELLED, PAUSED)"
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Timestamp when the goal was created"
    )

    # Relationships
    user = relationship("UserModel", back_populates="savings_goals")

    # Table constraints ensuring data integrity for financial amounts
    __table_args__ = (
        CheckConstraint("target_amount > 0", name="ck_savings_goals_target_amount_positive"),
        CheckConstraint("current_amount >= 0", name="ck_savings_goals_current_amount_non_negative"),
    )

    def __repr__(self) -> str:
        return (
            f"<SavingsGoalModel(goal_id={self.goal_id}, user_id={self.user_id}, "
            f"goal_name='{self.goal_name}', target_amount={self.target_amount}, "
            f"current_amount={self.current_amount}, status='{self.status}')>"
        )