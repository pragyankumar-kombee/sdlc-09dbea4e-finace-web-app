# @module: Transaction Module.routes
# @spec_section_id: Section 3
# @req_ids: TXN-01, TXN-02, TXN-03, TXN-04, AC-02, TXN-201, TXN-400, TXN-404
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status

from services.transaction_module.schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
)
from services.transaction_module.service import TransactionService

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])


def get_transaction_service() -> TransactionService:
    """Dependency provider for TransactionService."""
    return TransactionService()


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new transaction",
    description="Allows users to manually record income and expense transactions fulfilling TXN-01 and TXN-04.",
)
async def create_transaction(
    payload: TransactionCreate,
    current_user_id: str = Depends(lambda: "mock-user-id"),
    service: TransactionService = Depends(get_transaction_service),
) -> TransactionResponse:
    try:
        transaction = await service.create_transaction(
            user_id=current_user_id, payload=payload
        )
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=TransactionListResponse,
    status_code=status.HTTP_200_OK,
    summary="List, filter, and sort transactions",
    description="Provides filtering and sorting capabilities for transactions by date range, category, amount, and transaction type fulfilling TXN-03.",
)
async def list_transactions(
    start_date: Optional[date] = Query(None, description="Filter start date"),
    end_date: Optional[date] = Query(None, description="Filter end date"),
    category: Optional[str] = Query(None, description="Filter by category"),
    transaction_type: Optional[str] = Query(None, description="Filter by type (income/expense)"),
    min_amount: Optional[float] = Query(None, description="Minimum amount filter"),
    max_amount: Optional[float] = Query(None, description="Maximum amount filter"),
    sort_by: Optional[str] = Query("date", description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(50, ge=1, le=250, description="Pagination limit"),
    current_user_id: str = Depends(lambda: "mock-user-id"),
    service: TransactionService = Depends(get_transaction_service),
) -> TransactionListResponse:
    try:
        transactions, total = await service.get_transactions(
            user_id=current_user_id,
            start_date=start_date,
            end_date=end_date,
            category=category,
            transaction_type=transaction_type,
            min_amount=min_amount,
            max_amount=max_amount,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit,
        )
        return TransactionListResponse(
            items=transactions, total=total, skip=skip, limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a single transaction by ID",
    description="Retrieves a specific transaction record for the authenticated user.",
)
async def get_transaction(
    transaction_id: str,
    current_user_id: str = Depends(lambda: "mock-user-id"),
    service: TransactionService = Depends(get_transaction_service),
) -> TransactionResponse:
    transaction = await service.get_transaction_by_id(
        user_id=current_user_id, transaction_id=transaction_id
    )
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id '{transaction_id}' not found.",
        )
    return transaction


@router.put(
    "/{transaction_id}",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Edit an existing manual transaction",
    description="Allows users to update existing manual transactions fulfilling TXN-02.",
)
async def update_transaction(
    transaction_id: str,
    payload: TransactionUpdate,
    current_user_id: str = Depends(lambda: "mock-user-id"),
    service: TransactionService = Depends(get_transaction_service),
) -> TransactionResponse:
    try:
        updated_transaction = await service.update_transaction(
            user_id=current_user_id, transaction_id=transaction_id, payload=payload
        )
        if not updated_transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with id '{transaction_id}' not found.",
            )
        return updated_transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an existing manual transaction",
    description="Allows users to delete existing manual transactions fulfilling TXN-02.",
)
async def delete_transaction(
    transaction_id: str,
    current_user_id: str = Depends(lambda: "mock-user-id"),
    service: TransactionService = Depends(get_transaction_service),
) -> None:
    deleted = await service.delete_transaction(
        user_id=current_user_id, transaction_id=transaction_id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id '{transaction_id}' not found.",
        )
    return None