# @module: Transaction Module.service
# @spec_section_id: Section 3
# @req_ids: TXN-01, TXN-02, TXN-03, TXN-04, AC-02, TXN-201, TXN-400, TXN-404
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""
Transaction Module Service Implementation for FinPulse Engine.
Handles business logic for manual and synced income/expense transactions,
filtering, sorting, categorization, editing, and deletion.
"""

from decimal import Decimal
from typing import List, Optional, Tuple
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

# Sibling model and schema references as specified in service contract
from services.transaction_module.models import TransactionModel
from services.transaction_module.schemas import (
    TransactionCreateSchema,
    TransactionUpdateSchema,
    TransactionFilterSchema
)


class TransactionService:
    """
    Service layer for managing transaction records, implementing core requirements
    TXN-01, TXN-02, TXN-03, TXN-04, AC-02, TXN-201, TXN-400, and TXN-404.
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create_transaction(self, user_id: str, payload: TransactionCreateSchema) -> TransactionModel:
        """
        Implements TXN-01 & TXN-04: Allow users to record income/expense transactions
        with amount, date, category, account, optional notes, and proper categorization.
        Returns TXN-201 on success.
        """
        try:
            # Validate positive amount
            if payload.amount <= Decimal("0.00"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Transaction amount must be greater than zero."
                )

            new_transaction = TransactionModel(
                user_id=user_id,
                amount=payload.amount,
                date=payload.date,
                category=payload.category,
                account=payload.account,
                transaction_type=payload.transaction_type,
                notes=payload.notes
            )

            self.db.add(new_transaction)
            self.db.commit()
            self.db.refresh(new_transaction)
            return new_transaction

        except HTTPException as he:
            self.db.rollback()
            raise he
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create transaction: {str(e)}"
            )

    def get_transaction_by_id(self, user_id: str, transaction_id: str) -> TransactionModel:
        """
        Retrieves a single transaction by ID ensuring user ownership,
        raising TXN-404 if not found.
        """
        transaction = self.db.query(TransactionModel).filter(
            TransactionModel.id == transaction_id,
            TransactionModel.user_id == user_id
        ).first()

        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found."
            )
        return transaction

    def list_transactions(
        self,
        user_id: str,
        filters: TransactionFilterSchema,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[TransactionModel], int]:
        """
        Implements TXN-03: Filtering and sorting capabilities for transactions
        by date range, category, amount, and transaction type.
        """
        query = self.db.query(TransactionModel).filter(TransactionModel.user_id == user_id)

        # Apply filtering criteria
        if filters.start_date:
            query = query.filter(TransactionModel.date >= filters.start_date)
        if filters.end_date:
            query = query.filter(TransactionModel.date <= filters.end_date)
        if filters.category:
            query = query.filter(TransactionModel.category == filters.category)
        if filters.transaction_type:
            query = query.filter(TransactionModel.transaction_type == filters.transaction_type)
        if filters.min_amount is not None:
            query = query.filter(TransactionModel.amount >= filters.min_amount)
        if filters.max_amount is not None:
            query = query.filter(TransactionModel.amount <= filters.max_amount)

        # Total count before pagination
        total_count = query.count()

        # Apply sorting
        sort_field = getattr(TransactionModel, filters.sort_by, TransactionModel.date)
        if filters.sort_order.lower() == "asc":
            query = query.order_by(sort_field.asc())
        else:
            query = query.order_by(sort_field.desc())

        # Apply pagination
        transactions = query.offset(skip).limit(limit).all()
        return transactions, total_count

    def update_transaction(
        self,
        user_id: str,
        transaction_id: str,
        payload: TransactionUpdateSchema
    ) -> TransactionModel:
        """
        Implements TXN-02: Allow users to edit existing manual transactions.
        Raises TXN-404 if the transaction does not exist or belong to the user,
        and TXN-400 for validation errors.
        """
        transaction = self.get_transaction_by_id(user_id, transaction_id)

        update_data = payload.dict(exclude_unset=True)

        if "amount" in update_data and update_data["amount"] <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction amount must be greater than zero."
            )

        try:
            for field, value in update_data.items():
                setattr(transaction, field, value)

            self.db.commit()
            self.db.refresh(transaction)
            return transaction

        except HTTPException as he:
            self.db.rollback()
            raise he
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update transaction: {str(e)}"
            )

    def delete_transaction(self, user_id: str, transaction_id: str) -> bool:
        """
        Implements TXN-02: Allow users to delete existing manual transactions.
        Raises TXN-404 if not found.
        """
        transaction = self.get_transaction_by_id(user_id, transaction_id)

        try:
            self.db.delete(transaction)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to delete transaction: {str(e)}"
            )