# @module: Recurring Payments Module.routes
# @spec_section_id: Section 3
# @req_ids: REC-01, REC-02, REC-03, REC-04, REC-201
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from services.recurring_payments_module.schemas import (
    RecurringPaymentCreateRequest,
    RecurringPaymentResponse,
    RecurringPaymentUpdateRequest,
    PatternDetectionResponse,
    ReminderNotificationResponse,
)
from services.recurring_payments_module.service import RecurringPaymentService

router = APIRouter(prefix="/recurring-payments", tags=["Recurring Payments"])


def get_recurring_payment_service() -> RecurringPaymentService:
    """Dependency provider for RecurringPaymentService."""
    return RecurringPaymentService()


@router.post(
    "",
    response_model=RecurringPaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Recurring Payment Schedule",
    description="Allows users to manually create a recurring payment schedule (REC-01).",
)
async def create_recurring_payment(
    payload: RecurringPaymentCreateRequest,
    current_user_id: str = Query(..., description="Authenticated user ID"),
    service: RecurringPaymentService = Depends(get_recurring_payment_service),
) -> RecurringPaymentResponse:
    """
    Implements REC-01: Manual recurring schedules creation.
    """
    try:
        payment = await service.create_recurring_payment(user_id=current_user_id, payload=payload)
        return payment
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the recurring payment: {str(exc)}",
        )


@router.get(
    "",
    response_model=List[RecurringPaymentResponse],
    status_code=status.HTTP_200_OK,
    summary="List Recurring Payments",
    description="Retrieve all recurring payment schedules for the authenticated user (REC-01, REC-02).",
)
async def list_recurring_payments(
    current_user_id: str = Query(..., description="Authenticated user ID"),
    service: RecurringPaymentService = Depends(get_recurring_payment_service),
) -> List[RecurringPaymentResponse]:
    """
    Retrieves the list of active/inactive recurring payment schedules.
    """
    try:
        payments = await service.list_recurring_payments(user_id=current_user_id)
        return payments
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while retrieving recurring payments: {str(exc)}",
        )


@router.put(
    "/{payment_id}",
    response_model=RecurringPaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Recurring Payment Schedule",
    description="Allows users to update an existing recurring payment schedule (REC-02).",
)
async def update_recurring_payment(
    payment_id: str,
    payload: RecurringPaymentUpdateRequest,
    current_user_id: str = Query(..., description="Authenticated user ID"),
    service: RecurringPaymentService = Depends(get_recurring_payment_service),
) -> RecurringPaymentResponse:
    """
    Implements REC-02: Editing recurring schedules.
    """
    try:
        updated_payment = await service.update_recurring_payment(
            user_id=current_user_id, payment_id=payment_id, payload=payload
        )
        if not updated_payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurring payment with ID '{payment_id}' not found.",
            )
        return updated_payment
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating the recurring payment: {str(exc)}",
        )


@router.delete(
    "/{payment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Recurring Payment Schedule",
    description="Allows users to delete or cancel a recurring payment schedule (REC-02).",
)
async def delete_recurring_payment(
    payment_id: str,
    current_user_id: str = Query(..., description="Authenticated user ID"),
    service: RecurringPaymentService = Depends(get_recurring_payment_service),
) -> None:
    """
    Implements REC-02: Deleting recurring schedules.
    """
    try:
        deleted = await service.delete_recurring_payment(user_id=current_user_id, payment_id=payment_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurring payment with ID '{payment_id}' not found.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting the recurring payment: {str(exc)}",
        )


@router.post(
    "/detect-patterns",
    response_model=List[PatternDetectionResponse],
    status_code=status.HTTP_200_OK,
    summary="Detect Recurring Patterns from Bank Feeds",
    description="Automated pattern detection from bank transaction feeds to identify subscriptions and recurring bills (REC-03).",
)
async def detect_recurring_patterns(
    current_user_id: str = Query(..., description="Authenticated user ID"),
    service: RecurringPaymentService = Depends(get_recurring_payment_service),
) -> List[PatternDetectionResponse]:
    """
    Implements REC-03: Automated pattern detection from bank transaction feeds.
    """
    try:
        detected_patterns = await service.detect_patterns_from_transactions(user_id=current_user_id)
        return detected_patterns
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during pattern detection: {str(exc)}",
        )


@router.post(
    "/{payment_id}/reminders",
    response_model=ReminderNotificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Due-Date Reminder Notification",
    description="Sends or triggers due-date reminder notifications for upcoming recurring payments (REC-04, REC-201).",
)
async def trigger_payment_reminder(
    payment_id: str,
    current_user_id: str = Query(..., description="Authenticated user ID"),
    service: RecurringPaymentService = Depends(get_recurring_payment_service),
) -> ReminderNotificationResponse:
    """
    Implements REC-04 and REC-201: Due-date reminder notifications and notification dispatch.
    """
    try:
        reminder_status = await service.trigger_due_date_reminder(
            user_id=current_user_id, payment_id=payment_id
        )
        if not reminder_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurring payment with ID '{payment_id}' not found or reminder could not be sent.",
            )
        return reminder_status
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while triggering the payment reminder: {str(exc)}",
        )