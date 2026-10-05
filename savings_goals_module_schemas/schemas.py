# @module: Savings Goals Module.schemas
# @spec_section_id: Section 3
# @req_ids: GOAL-01, GOAL-02, GOAL-03, GOAL-04, AC-06, GOAL-201, GOAL-200
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, condecimal, validator


class SavingsGoalBase(BaseModel):
    """Base schema representing shared attributes for savings goals."""
    name: str = Field(..., min_length=1, max_length=100, description="Name of the savings goal.")
    target_amount: condecimal(gt=Decimal("0.00"), max_digits=12, decimal_places=2) = Field(
        ..., description="Target financial amount to reach for the goal."
    )
    current_amount: condecimal(ge=Decimal("0.00"), max_digits=12, decimal_places=2) = Field(
        default=Decimal("0.00"), description="Current amount saved towards the goal."
    )
    target_date: date = Field(..., description="Target completion date for the savings goal.")
    auto_allocate: bool = Field(
        default=False, description="Whether to automatically allocate surplus funds towards this goal."
    )
    category_id: Optional[str] = Field(
        default=None, description="Optional associated category identifier."
    )

    @validator("target_date")
    def validate_target_date(cls, v: date) -> date:
        """Ensure the target date is not set in the past for new or updated active goals."""
        if v < date.today():
            raise ValueError("Target date cannot be in the past.")
        return v


class SavingsGoalCreate(SavingsGoalBase):
    """Schema for creating a new savings goal satisfying GOAL-01 and GOAL-02."""
    pass


class SavingsGoalUpdate(BaseModel):
    """Schema for updating an existing savings goal satisfying GOAL-02."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_amount: Optional[condecimal(gt=Decimal("0.00"), max_digits=12, decimal_places=2)] = None
    current_amount: Optional[condecimal(ge=Decimal("0.00"), max_digits=12, decimal_places=2)] = None
    target_date: Optional[date] = None
    auto_allocate: Optional[bool] = None
    category_id: Optional[str] = None

    @validator("target_date")
    def validate_target_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v < date.today():
            raise ValueError("Target date cannot be in the past.")
        return v


class FundAllocationRequest(BaseModel):
    """Schema for manual or automated fund allocation requests satisfying GOAL-03."""
    amount: condecimal(gt=Decimal("0.00"), max_digits=12, decimal_places=2) = Field(
        ..., description="Amount of funds to deposit or allocate towards the savings goal."
    )


class ProgressVelocityIndicator(BaseModel):
    """Schema representing progress metrics and velocity indicators satisfying GOAL-04 and GOAL-200."""
    percentage_complete: float = Field(..., description="Percentage of target amount achieved (0.0 to 100.0+).")
    remaining_amount: Decimal = Field(..., description="Monetary amount remaining to reach target.")
    days_remaining: int = Field(..., description="Number of days remaining until target date.")
    required_daily_savings: Decimal = Field(
        ..., description="Required average daily savings to meet the target on time."
    )
    velocity_status: str = Field(
        ..., description="Indicator status (e.g., ON_TRACK, BEHIND, AHEAD, COMPLETED)."
    )


class SavingsGoalResponse(SavingsGoalBase):
    """Schema representing the complete savings goal response payload satisfying AC-06 and GOAL-201."""
    id: str = Field(..., description="Unique unique identifier for the savings goal.")
    user_id: str = Field(..., description="Identifier of the user who owns the savings goal.")
    is_completed: bool = Field(..., description="Flag indicating if the goal target has been fully reached.")
    completion_date: Optional[datetime] = Field(
        default=None, description="Timestamp when the goal was marked completed."
    )
    progress_metrics: ProgressVelocityIndicator = Field(
        ..., description="Calculated velocity and progress metrics for the goal."
    )
    created_at: datetime = Field(..., description="Timestamp when the goal was created.")
    updated_at: datetime = Field(..., description="Timestamp when the goal was last updated.")

    class Config:
        orm_mode = True
        json_encoders = {
            Decimal: lambda v: str(v)
        }


class SavingsGoalListResponse(BaseModel):
    """Schema for paginated or listed savings goals response."""
    items: List[SavingsGoalResponse] = Field(..., description="List of savings goals.")
    total_count: int = Field(..., description="Total number of savings goals matching query.")
    total_target_amount: Decimal = Field(..., description="Sum of target amounts across listed goals.")
    total_current_amount: Decimal = Field(..., description="Sum of current saved amounts across listed goals.")

    class Config:
        orm_mode = True
        json_encoders = {
            Decimal: lambda v: str(v)
        }