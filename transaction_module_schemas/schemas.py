# @module: Transaction Module.schemas
# @spec_section_id: Section 3
# @req_ids: TXN-01, TXN-02, TXN-03, TXN-04, AC-02, TXN-201, TXN-400, TXN-404
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, condecimal, field_validator


class TransactionBase(BaseModel):
    """
    Base Pydantic schema for transaction attributes fulfilling TXN-01 and TXN-04.
    """
    amount: condecimal(max_digits=12, decimal_places=2, gt=Decimal("0.00")) = Field(
        ..., description="Monetary amount of the transaction, strictly greater than zero."
    )
    transaction_date: date = Field(
        ..., description="Date on which the transaction occurred."
    )
    category_id: UUID = Field(
        ..., description="UUID of the user-defined or default financial category (TXN-04)."
    )
    account_id: UUID = Field(
        ..., description="UUID of the financial account associated with the transaction."
    )
    transaction_type: str = Field(
        ..., description="Type of transaction: 'income' or 'expense'."
    )
    notes: Optional[str] = Field(
        None, max_length=500, description="Optional notes or memo for the transaction."
    )

    @field_validator("transaction_type")
    @classmethod
    def validate_transaction_type(cls, v: str) -> str:
        """
        Validates that the transaction type is either 'income' or 'expense'.
        """
        normalized = v.strip().lower()
        if normalized not in {"income", "expense"}:
            raise ValueError("Transaction type must be either 'income' or 'expense'.")
        return normalized


class TransactionCreate(TransactionBase):
    """
    Schema for creating a new manual transaction (TXN-01).
    """
    pass


class TransactionUpdate(BaseModel):
    """
    Schema for updating an existing manual transaction fulfilling TXN-02.
    All fields are optional for partial updates (PATCH).
    """
    amount: Optional[condecimal(max_digits=12, decimal_places=2, gt=Decimal("0.00"))] = Field(
        None, description="Updated monetary amount."
    )
    transaction_date: Optional[date] = Field(
        None, description="Updated transaction date."
    )
    category_id: Optional[UUID] = Field(
        None, description="Updated category UUID."
    )
    account_id: Optional[UUID] = Field(
        None, description="Updated account UUID."
    )
    transaction_type: Optional[str] = Field(
        None, description="Updated transaction type ('income' or 'expense')."
    )
    notes: Optional[str] = Field(
        None, max_length=500, description="Updated notes or memo."
    )

    @field_validator("transaction_type")
    @classmethod
    def validate_transaction_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        normalized = v.strip().lower()
        if normalized not in {"income", "expense"}:
            raise ValueError("Transaction type must be either 'income' or 'expense'.")
        return normalized


class TransactionResponse(TransactionBase):
    """
    Schema representing a serialized transaction returned by the API,
    fulfilling AC-02 (standard success responses) and TXN-201.
    """
    id: UUID = Field(..., description="Unique immutable UUID of the transaction record.")
    user_id: UUID = Field(..., description="UUID of the user who owns the transaction.")
    created_at: datetime = Field(..., description="Timestamp when the transaction record was created.")
    updated_at: datetime = Field(..., description="Timestamp when the transaction record was last updated.")

    class Config:
        from_attributes = True


class TransactionFilterParams(BaseModel):
    """
    Schema for filtering and sorting parameters for listing transactions fulfilling TXN-03.
    """
    start_date: Optional[date] = Field(None, description="Filter transactions on or after this date.")
    end_date: Optional[date] = Field(None, description="Filter transactions on or before this date.")
    category_id: Optional[UUID] = Field(None, description="Filter by specific category UUID.")
    account_id: Optional[UUID] = Field(None, description="Filter by specific account UUID.")
    transaction_type: Optional[str] = Field(None, description="Filter by transaction type ('income' or 'expense').")
    min_amount: Optional[condecimal(max_digits=12, decimal_places=2)] = Field(None, description="Minimum amount threshold.")
    max_amount: Optional[condecimal(max_digits=12, decimal_places=2)] = Field(None, description="Maximum amount threshold.")
    sort_by: Optional[str] = Field("transaction_date", description="Field to sort by (e.g., 'transaction_date', 'amount').")
    sort_order: Optional[str] = Field("desc", description="Sort order: 'asc' or 'desc'.")
    limit: int = Field(50, ge=1, le=250, description="Number of items to return per page.")
    offset: int = Field(0, ge=0, description="Number of items to skip for pagination.")

    @field_validator("sort_order")
    @classmethod
    def validate_sort_order(cls, v: str) -> str:
        normalized = v.strip().lower()
        if normalized not in {"asc", "desc"}:
            raise ValueError("Sort order must be either 'asc' or 'desc'.")
        return normalized


class TransactionListResponse(BaseModel):
    """
    Paginated list response schema for transactions fulfilling TXN-03 and AC-02.
    """
    total: int = Field(..., description="Total number of matching transactions.")
    limit: int = Field(..., description="Current page limit.")
    offset: int = Field(..., description="Current pagination offset.")
    items: List[TransactionResponse] = Field(..., description="List of transaction records.")


class ErrorDetail(BaseModel):
    """
    Standardized error detail schema for validation and application errors.
    """
    field: Optional[str] = Field(None, description="Specific field that caused the error, if applicable.")
    message: str = Field(..., description="Human-readable error message explaining the failure.")


class TransactionErrorResponse(BaseModel):
    """
    Standardized error response schema for TXN-400 (Bad Request) and TXN-404 (Not Found)
    fulfilling comprehensive error state requirements.
    """
    error_code: str = Field(..., description="Machine-readable error code (e.g., 'TXN_BAD_REQUEST', 'TXN_NOT_FOUND').")
    message: str = Field(..., description="High-level summary of the error condition.")
    details: List[ErrorDetail] = Field(default_factory=list, description="Detailed breakdown of errors.")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the error occurred.")