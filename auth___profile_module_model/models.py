# @module: Auth & Profile Module.model
# @spec_section_id: Section 3
# @req_ids: AUTH-01, AUTH-02, AUTH-03, AUTH-04, NFR-05, AC-01, AUTH-200, AUTH-201, AUTH-401, AUTH-423
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""
SQLAlchemy ORM models for the Auth & Profile Module.
Corresponds to the 'users' and 'audit_logs' canonical database tables
as well as supporting data structures for the FinPulse Engine.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    """
    ORM Model for the 'users' table representing registered platform users.
    Implements requirements AUTH-01, AUTH-02, AUTH-03, AUTH-04, NFR-05, AC-01.
    """
    __tablename__ = "users"

    user_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash = Column(
        String(255),
        nullable=False,
    )
    display_name = Column(
        String(100),
        nullable=False,
    )
    base_currency = Column(
        String(3),
        nullable=False,
        default="USD",
    )
    status = Column(
        String(30),
        nullable=False,
        default="ACTIVE",
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<User(user_id={self.user_id}, email={self.email}, status={self.status})>"


class AuditLog(Base):
    """
    ORM Model for the 'audit_logs' table capturing security events,
    authentication outcomes (AUTH-200, AUTH-201, AUTH-401, AUTH-423),
    and immutable system actions for the FinPulse Engine.
    """
    __tablename__ = "audit_logs"

    log_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    action_type = Column(
        String(100),
        nullable=False,
    )
    source_ip = Column(
        String(45),
        nullable=False,
    )
    outcome_status = Column(
        String(20),
        nullable=False,
    )
    metadata = Column(
        JSONB,
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<AuditLog(log_id={self.log_id}, action_type={self.action_type}, outcome={self.outcome_status})>"