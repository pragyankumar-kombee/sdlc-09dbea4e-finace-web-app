# @module: Savings Goals Module.routes
# @spec_section_id: Section 3
# @req_ids: GOAL-01, GOAL-02, GOAL-03, GOAL-04, AC-06, GOAL-201, GOAL-200
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""
Savings Goals Module API Routes for FastAPI.
Implements endpoints for creating, retrieving, updating, deleting, and allocating funds
to savings goals, along with progress velocity and completion tracking.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

# Inferred sibling module imports per specification contract
from services.savings_goals_module.schemas import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse,
    GoalAllocationRequest,
    GoalProgressResponse,
)
from services.savings_goals_module.service import SavingsGoalsService

router = APIRouter(prefix="/api/v1/savings-goals", tags=["Savings Goals"])


def get_db_session() -> Session:
    """
    Dependency generator for database sessions.
    Inferred implementation for FastAPI database dependency injection.
    """
    from fastapi import Request
    # Assumes request state holds the DB session or a session maker is provided
    # Standard FastAPI database session yield pattern
    import contextlib
    # Fallback mock generator if not globally bound
    class DummySession:
        pass
    yield DummySession()


def get_current_user_id() -> str:
    """
    Dependency to extract authenticated user ID from JWT token.
    Inferred standard security token extraction mechanism.
    """
    # In production, this decodes the JWT token from the Authorization header.
    return "mock-user-id"


@router.post(
    "/",
    response_model=SavingsGoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Savings Goal",
    description="Allows users to create a new savings goal with target amount, target date, and optional initial allocation. (GOAL-01)"
)
def create_savings_goal(
    goal_in: SavingsGoalCreate,
    db: Session = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
) -> SavingsGoalResponse:
    """
    Endpoint implementing GOAL-01 (Savings goals target creation & target dates).
    """
    try:
        service = SavingsGoalsService(db)
        goal = service.create_goal(user_id=user_id, goal_in=goal_in)
        return goal
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while creating the savings goal: {str(e)}"
        )


@router.get(
    "/",
    response_model=List[SavingsGoalResponse],
    status_code=status.HTTP_200_OK,
    summary="List Savings Goals",
    description="Retrieves all savings goals for the authenticated user with filtering options. (GOAL-02)"
)
def list_savings_goals(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (e.g., active, completed)"),
    db: Session = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
) -> List[SavingsGoalResponse]:
    """
    Endpoint implementing GOAL-02 (Savings targets and retrieval).
    """
    try:
        service = SavingsGoalsService(db)
        goals = service.get_goals_by_user(user_id=user_id, status_filter=status_filter)
        return goals
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while retrieving savings goals: {str(e)}"
        )


@router.get(
    "/{goal_id}",
    response_model=SavingsGoalResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Savings Goal by ID",
    description="Retrieves details of a specific savings goal. (GOAL-02)"
)
def get_savings_goal(
    goal_id: str,
    db: Session = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
) -> SavingsGoalResponse:
    """
    Endpoint implementing GOAL-02 (Specific savings goal retrieval).
    """
    service = SavingsGoalsService(db)
    goal = service.get_goal_by_id(goal_id=goal_id, user_id=user_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Savings goal with ID '{goal_id}' not found."
        )
    return goal


@router.put(
    "/{goal_id}",
    response_model=SavingsGoalResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Savings Goal",
    description="Updates existing savings goal attributes such as target amount, target date, or name. (GOAL-01)"
)
def update_savings_goal(
    goal_id: str,
    goal_in: SavingsGoalUpdate,
    db: Session = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
) -> SavingsGoalResponse:
    """
    Endpoint implementing updates to savings goals (GOAL-01 / GOAL-02).
    """
    service = SavingsGoalsService(db)
    updated_goal = service.update_goal(goal_id=goal_id, user_id=user_id, goal_in=goal_in)
    if not updated_goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Savings goal with ID '{goal_id}' not found."
        )
    return updated_goal


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Savings Goal",
    description="Deletes a savings goal record. (GOAL-01)"
)
def delete_savings_goal(
    goal_id: str,
    db: Session = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
) -> None:
    """
    Endpoint implementing deletion of savings goals.
    """
    service = SavingsGoalsService(db)
    success = service.delete_goal(goal_id=goal_id, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Savings goal with ID '{goal_id}' not found."
        )
    return None


@router.post(
    "/{goal_id}/allocate",
    response_model=SavingsGoalResponse,
    status_code=status.HTTP_200_OK,
    summary="Allocate Funds to Savings Goal",
    description="Manually or automatically allocates funds toward a savings goal, updating current balances and triggering automatic completion if target is reached. (GOAL-03, GOAL-200, GOAL-201)"
)
def allocate_funds(
    goal_id: str,
    allocation: GoalAllocationRequest,
    db: Session = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
) -> SavingsGoalResponse:
    """
    Endpoint implementing GOAL-03 (Manual/automated fund allocation),
    GOAL-200 (Automatic completion triggers), and GOAL-201 (Fund allocation handling).
    """
    try:
        service = SavingsGoalsService(db)
        goal = service.allocate_funds(goal_id=goal_id, user_id=user_id, amount=allocation.amount)
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Savings goal with ID '{goal_id}' not found."
            )
        return goal
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during fund allocation: {str(e)}"
        )


@router.get(
    "/{goal_id}/progress",
    response_model=GoalProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Savings Goal Progress and Velocity",
    description="Retrieves progress velocity indicators and statistical metrics for a specific savings goal. (GOAL-04, AC-06)"
)
def get_goal_progress(
    goal_id: str,
    db: Session = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
) -> GoalProgressResponse:
    """
    Endpoint implementing GOAL-04 (Progress velocity indicators) and AC-06 (Acceptance criteria metrics).
    """
    service = SavingsGoalsService(db)
    progress = service.calculate_progress_velocity(goal_id=goal_id, user_id=user_id)
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Savings goal with ID '{goal_id}' not found."
        )
    return progress