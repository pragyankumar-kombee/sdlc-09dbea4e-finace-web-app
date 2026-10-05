# @module: Savings Goals Module.service
# @spec_section_id: Section 3
# @req_ids: GOAL-01, GOAL-02, GOAL-03, GOAL-04, AC-06, GOAL-201, GOAL-200
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""
Savings Goals Module Service Layer
Implements business logic for managing savings targets, fund allocations,
velocity indicators, and automatic completion triggers.
"""

from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Dict, Any
import logging

from fastapi import HTTPException, status

# In accordance with the prompt instructions, sibling modules are referenced directly
# by their exact names as defined in the service contract.
from services.savings_goals_module.models import SavingsGoalModel, GoalContributionModel
from services.savings_goals_module.schemas import (
    SavingsGoalCreateRequest,
    SavingsGoalUpdateRequest,
    GoalContributionRequest,
    SavingsGoalResponse,
    GoalProgressSummaryResponse,
)

logger = logging.getLogger(__name__)


class SavingsGoalsService:
    """
    Service layer for Savings Goals Module handling business rules, progress velocity,
    automatic completion triggers, and fund allocation tracking.
    """

    def __init__(self) -> None:
        pass

    async def create_goal(self, user_id: str, payload: SavingsGoalCreateRequest) -> SavingsGoalResponse:
        """
        Implements GOAL-01: Create a savings target with name, target amount,
        current saved amount, target completion date, and optional category/notes.
        """
        logger.info(f"Creating savings goal for user_id={user_id} with name={payload.name}")
        
        # Validation constraint: Target amount must be positive
        if payload.target_amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target amount must be greater than zero."
            )

        # Validation constraint: Target completion date cannot be in the past
        if payload.target_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target completion date cannot be in the past."
            )

        current_amount = payload.current_amount if payload.current_amount is not None else Decimal("0.00")
        is_completed = current_amount >= payload.target_amount

        goal_data = {
            "user_id": user_id,
            "name": payload.name,
            "target_amount": payload.target_amount,
            "current_amount": current_amount,
            "target_date": payload.target_date,
            "category": payload.category,
            "notes": payload.notes,
            "is_completed": is_completed,
            "completed_at": datetime.now(timezone.utc) if is_completed else None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        goal = await SavingsGoalModel.create(**goal_data)
        return self._to_response_schema(goal)

    async def get_goal(self, user_id: str, goal_id: str) -> SavingsGoalResponse:
        """
        Retrieves a specific savings goal by ID for an authorized user.
        """
        goal = await SavingsGoalModel.get_by_id(goal_id)
        if not goal or goal.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings goal not found."
            )
        return self._to_response_schema(goal)

    async def list_user_goals(self, user_id: str) -> List[SavingsGoalResponse]:
        """
        Lists all savings goals associated with the user.
        """
        goals = await SavingsGoalModel.filter_by_user(user_id)
        return [self._to_response_schema(g) for g in goals]

    async def update_goal(
        self, user_id: str, goal_id: str, payload: SavingsGoalUpdateRequest
    ) -> SavingsGoalResponse:
        """
        Implements GOAL-02: Edit existing savings goals, updating target amounts,
        names, or target dates.
        """
        goal = await SavingsGoalModel.get_by_id(goal_id)
        if not goal or goal.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings goal not found."
            )

        update_data = payload.dict(exclude_unset=True)
        
        if "target_amount" in update_data and update_data["target_amount"] <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target amount must be greater than zero."
            )

        if "target_date" in update_data and update_data["target_date"] < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target completion date cannot be in the past."
            )

        # Apply updates
        for key, value in update_data.items():
            setattr(goal, key, value)

        # Re-evaluate automatic completion trigger (GOAL-04)
        if goal.current_amount >= goal.target_amount:
            if not goal.is_completed:
                goal.is_completed = True
                goal.completed_at = datetime.now(timezone.utc)
        else:
            goal.is_completed = False
            goal.completed_at = None

        goal.updated_at = datetime.now(timezone.utc)
        await goal.save()

        return self._to_response_schema(goal)

    async def delete_goal(self, user_id: str, goal_id: str) -> bool:
        """
        Deletes an existing savings goal.
        """
        goal = await SavingsGoalModel.get_by_id(goal_id)
        if not goal or goal.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings goal not found."
            )
        await goal.delete()
        return True

    async def add_contribution(
        self, user_id: str, goal_id: str, payload: GoalContributionRequest
    ) -> SavingsGoalResponse:
        """
        Implements GOAL-03 & GOAL-200: Manual or automated fund allocation towards a savings goal,
        updating the current saved amount and verifying completion triggers.
        """
        goal = await SavingsGoalModel.get_by_id(goal_id)
        if not goal or goal.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings goal not found."
            )

        if payload.amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contribution amount must be greater than zero."
            )

        # Record contribution ledger entry
        await GoalContributionModel.create(
            goal_id=goal_id,
            amount=payload.amount,
            note=payload.note,
            contributed_at=datetime.now(timezone.utc)
        )

        # Update current amount
        goal.current_amount += payload.amount
        goal.updated_at = datetime.now(timezone.utc)

        # Implements GOAL-04: Automatic completion triggers when current amount meets/exceeds target
        if goal.current_amount >= goal.target_amount and not goal.is_completed:
            goal.is_completed = True
            goal.completed_at = datetime.now(timezone.utc)
            logger.info(f"Savings goal {goal_id} automatically marked as completed.")

        await goal.save()
        return self._to_response_schema(goal)

    async def get_goal_progress_summary(self, user_id: str, goal_id: str) -> GoalProgressSummaryResponse:
        """
        Implements GOAL-201 & AC-06: Calculate progress velocity indicators,
        percentage achieved, estimated completion timeframe, and remaining gap.
        """
        goal = await SavingsGoalModel.get_by_id(goal_id)
        if not goal or goal.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings goal not found."
            )

        # Calculate percentage achieved (AC-06 / GOAL-201)
        if goal.target_amount > 0:
            percentage = (goal.current_amount / goal.target_amount) * Decimal("100.0")
            percentage = percentage.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            percentage = Decimal("100.00")

        remaining_amount = max(Decimal("0.00"), goal.target_amount - goal.current_amount)

        # Calculate progress velocity based on history
        contributions = await GoalContributionModel.filter_by_goal(goal_id)
        
        velocity_per_day = Decimal("0.00")
        estimated_completion_date = None

        if contributions:
            # Calculate total contributed over elapsed active days or average rate
            total_days_active = max(1, (datetime.now(timezone.utc) - goal.created_at).days)
            total_allocated = sum(c.amount for c in contributions)
            velocity_per_day = (total_allocated / Decimal(total_days_active)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            if velocity_per_day > 0 and remaining_amount > 0:
                days_to_completion = int((remaining_amount / velocity_per_day).to_integral_value(rounding=ROUND_HALF_UP))
                from datetime import timedelta
                estimated_completion_date = date.today() + timedelta(days=days_to_completion)
            elif remaining_amount == Decimal("0.00"):
                estimated_completion_date = date.today()

        return GoalProgressSummaryResponse(
            goal_id=goal.id,
            name=goal.name,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            remaining_amount=remaining_amount,
            percentage_achieved=percentage,
            is_completed=goal.is_completed,
            velocity_per_day=velocity_per_day,
            estimated_completion_date=estimated_completion_date,
            target_date=goal.target_date,
        )

    def _to_response_schema(self, goal: Any) -> SavingsGoalResponse:
        """
        Helper method to map internal model instance to Pydantic response DTO.
        """
        percentage = Decimal("0.00")
        if goal.target_amount > 0:
            percentage = ((goal.current_amount / goal.target_amount) * Decimal("100.0")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        return SavingsGoalResponse(
            id=goal.id,
            user_id=goal.user_id,
            name=goal.name,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            percentage_achieved=percentage,
            target_date=goal.target_date,
            category=goal.category,
            notes=goal.notes,
            is_completed=goal.is_completed,
            completed_at=goal.completed_at,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
        )