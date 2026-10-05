# @module: Recurring Payments Module.schemas
# @spec_section_id: Section 3
# @req_ids: REC-01, REC-02, REC-03, REC-04, REC-201
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""
Recurring Payments Module Schemas.
Pydantic data transfer objects (DTOs) for creating, reading, updating,
and managing recurring payment schedules, automated pattern detections,
and reminder notifications.
"""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, condecimal, constr


class FrequencyType(str, Enum):
    """Enumeration of allowed recurring payment frequencies."""
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"
    QUARTERLY = "QUARTERLY"


class RecurringPaymentStatus(str, Enum):
    """Enumeration of recurring payment schedule states."""
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class DetectionSource(str, Enum):
    """Source of the recurring payment identification."""
    MANUAL = "MANUAL"
    DETECTED = "DETECTED"


class RecurringPaymentBase(BaseModel):
    """Base schema containing shared attributes for recurring payments."""
    title: constr(min_length=1, max_length=255) = Field(
        ...,
        description="Name or description of the recurring payment vendor or bill."
    )
    amount: condecimal(max_digits=12, decimal_places=2, gt=Decimal("0.00")) = Field(
        ...,
        description="Monetary amount of the recurring payment."
    )
    frequency: FrequencyType = Field(
        ...,
        description="Recurrence frequency (WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY)."
    )
    category_id: int = Field(
        ...,
        description="Unique identifier of the financial category associated with this payment."
    )
    account_id: int = Field(
        ...,
        description="Unique identifier of the funding financial account."
    )
    next_due_date: date = Field(
        ...,
        description="The calendar date when the next payment is due."
    )
    reminder_days_before: int = Field(
        default=3,
        ge=0,
        le=30,
        description="Number of days prior to the due date to dispatch a reminder notification."
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Optional user notes regarding the recurring obligation."
    )


class RecurringPaymentCreate(RecurringPaymentBase):
    """Schema for creating a new recurring payment schedule (REC-01)."""
    status: Optional[RecurringPaymentStatus] = Field(
        default=RecurringPaymentStatus.ACTIVE,
        description="Initial status of the recurring schedule."
    )
    detection_source: Optional[DetectionSource] = Field(
        default=DetectionSource.MANUAL,
        description="Origin of the schedule (MANUAL or DETECTED from transaction feed)."
    )


class RecurringPaymentUpdate(BaseModel):
    """Schema for updating an existing recurring payment schedule (REC-02)."""
    title: Optional[constr(min_length=1, max_length=255)] = Field(
        default=None,
        description="Updated name or description."
    )
    amount: Optional[condecimal(max_digits=12, decimal_places=2, gt=Decimal("0.00"))] = Field(
        default=None,
        description="Updated monetary amount."
    )
    frequency: Optional[FrequencyType] = Field(
        default=None,
        description="Updated recurrence frequency."
    )
    category_id: Optional[int] = Field(
        default=None,
        description="Updated category identifier."
    )
    account_id: Optional[int] = Field(
        default=None,
        description="Updated account identifier."
    )
    next_due_date: Optional[date] = Field(
        default=None,
        description="Updated next due date."
    )
    status: Optional[RecurringPaymentStatus] = Field(
        default=None,
        description="Updated lifecycle status."
    )
    reminder_days_before: Optional[int] = Field(
        default=None,
        ge=0,
        le=30,
        description="Updated reminder lead time in days."
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Updated notes."
    )


class RecurringPaymentResponse(RecurringPaymentBase):
    """Schema representing a recurring payment record returned by the API."""
    id: int = Field(
        ...,
        description="Unique primary key identifier for the recurring payment schedule."
    )
    user_id: int = Field(
        ...,
        description="Unique identifier of the user who owns the recurring schedule."
    )
    status: RecurringPaymentStatus = Field(
        ...,
        description="Current lifecycle status of the schedule."
    )
    detection_source: DetectionSource = Field(
        ...,
        description="Indicates whether the schedule was created manually or detected by transaction pattern analysis."
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when the recurring payment record was created."
    )
    updated_at: datetime = Field(
        ...,
        description="Timestamp when the recurring payment record was last modified."
    )

    class Config:
        from_attributes = True


class RecurringPaymentFilterParams(BaseModel):
    """Schema for filtering and sorting recurring payment queries (REC-03)."""
    status: Optional[RecurringPaymentStatus] = Field(
        default=None,
        description="Filter by lifecycle status."
    )
    frequency: Optional[FrequencyType] = Field(
        default=None,
        description="Filter by frequency type."
    )
    category_id: Optional[int] = Field(
        default=None,
        description="Filter by category identifier."
    )
    detection_source: Optional[DetectionSource] = Field(
        default=DetectionSource.DETECTED,
        description="Filter by creation origin (e.g., automated pattern detection)."
    )
    start_date: Optional[date] = Field(
        default=None,
        description="Filter schedules with due date on or after this date."
    )
    end_date: Optional[date] = Field(
        default=None,
        description="Filter schedules with due date on or before this date."
    )
    page: int = Field(
        default=1,
        ge=1,
        description="Pagination page number."
    )
    page_size: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Number of items per pagination page."
    )


class RecurringPaymentListResponse(BaseModel):
    """Paginated list response container for recurring payments."""
    items: List[RecurringPaymentResponse] = Field(
        ...,
        description="List of recurring payment schedule records matching query criteria."
    )
    total: int = Field(
        ...,
        description="Total count of matching records."
    )
    page: int = Field(
        ...,
        description="Current page number."
    )
    page_size: int = Field(
        ...,
        description="Number of records per page."
    )


class RecurringPaymentReminderNotification(BaseModel):
    """Schema representing an outbound or scheduled due-date reminder notification (REC-201)."""
    recurring_payment_id: int = Field(
        ...,
        description="Identifier of the recurring payment associated with the reminder."
    )
    user_id: int = Field(
        ...,
        description="Identifier of the recipient user."
    )
    title: str = Field(
        ...,
        description="Title or vendor name of the upcoming bill."
    )
    amount: Decimal = Field(
        ...,
        description="Payment amount due."
    )
    due_date: date = Field(
        ...,
        description="Due date of the payment."
    )
    days_until_due: int = Field(
        ...,
        description="Calculated countdown of days remaining until the due date."
    )
    notification_sent_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when the notification was successfully dispatched, if sent."
    )

    class Config:
        from_attributes = True