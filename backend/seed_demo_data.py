# @module: SeedData.backend/seed_demo_data.py
# @spec_section_id: implementation_blueprint
# @req_ids: N/A
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""
Demonstration data seeding module for the FinPulse Engine (Personal Finance Management Platform).
Populates the PostgreSQL database with realistic demo accounts, categories, budgets,
transactions, goals, and recurring payments for local development and staging environments.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Import internal application models and hashing utilities
from backend.models import (
    Base,
    User,
    Account,
    Category,
    Transaction,
    Budget,
    SavingsGoal,
    RecurringPayment,
    Household,
    HouseholdMember,
    AccountType,
    TransactionType,
    CategoryType,
    BudgetPeriod,
    GoalStatus,
    Frequency,
    HouseholdRole,
)
from backend.core.security import get_password_hash
from backend.core.config import get_settings

logger = logging.getLogger(__name__)

async def seed_database() -> None:
    """
    Executes the database seeding workflow, creating initial demo users,
    categories, accounts, transactions, budgets, savings goals, and recurring payments.
    """
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)
    async_session_maker = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_maker() as session:
        async with session.begin():
            logger.info("Initializing FinPulse demo dataset seeding...")

            # 1. Create Demo Users
            hashed_password = get_password_hash("DemoSecurePassword123!")
            
            user_alex = User(
                email="alex.demo@finpulse.internal",
                hashed_password=hashed_password,
                display_name="Alex Mercer",
                currency="USD",
                is_active=True,
                is_verified=True,
            )
            user_sarah = User(
                email="sarah.demo@finpulse.internal",
                hashed_password=hashed_password,
                display_name="Sarah Connor",
                currency="USD",
                is_active=True,
                is_verified=True,
            )
            session.add_all([user_alex, user_sarah])
            await session.flush()

            # 2. Create Shared Household
            household = Household(
                name="Mercer-Connor Household",
                owner_id=user_alex.id
            )
            session.add(household)
            await session.flush()

            member_alex = HouseholdMember(
                household_id=household.id,
                user_id=user_alex.id,
                role=HouseholdRole.ADMIN
            )
            member_sarah = HouseholdMember(
                household_id=household.id,
                user_id=user_sarah.id,
                role=HouseholdRole.MEMBER
            )
            session.add_all([member_alex, member_sarah])

            # 3. Create Financial Categories
            categories = [
                Category(name="Salary", type=CategoryType.INCOME, user_id=user_alex.id),
                Category(name="Freelance", type=CategoryType.INCOME, user_id=user_alex.id),
                Category(name="Groceries", type=CategoryType.EXPENSE, user_id=user_alex.id),
                Category(name="Housing", type=CategoryType.EXPENSE, user_id=user_alex.id),
                Category(name="Utilities", type=CategoryType.EXPENSE, user_id=user_alex.id),
                Category(name="Dining Out", type=CategoryType.EXPENSE, user_id=user_alex.id),
                Category(name="Subscriptions", type=CategoryType.EXPENSE, user_id=user_alex.id),
            ]
            session.add_all(categories)
            await session.flush()

            cat_map = {c.name: c.id for c in categories}

            # 4. Create Bank Accounts
            account_checking = Account(
                user_id=user_alex.id,
                name="Primary Checking",
                type=AccountType.CHECKING,
                balance=4250.50,
                institution_name="Chase",
                is_active=True,
            )
            account_savings = Account(
                user_id=user_alex.id,
                name="High-Yield Savings",
                type=AccountType.SAVINGS,
                balance=15400.00,
                institution_name="Marcus",
                is_active=True,
            )
            session.add_all([account_checking, account_savings])
            await session.flush()

            # 5. Create Transactions
            now = datetime.utcnow()
            transactions = [
                Transaction(
                    user_id=user_alex.id,
                    account_id=account_checking.id,
                    category_id=cat_map["Salary"],
                    amount=5000.00,
                    type=TransactionType.INCOME,
                    date=now - timedelta(days=15),
                    notes="Bi-weekly payroll deposit",
                ),
                Transaction(
                    user_id=user_alex.id,
                    account_id=account_checking.id,
                    category_id=cat_map["Housing"],
                    amount=1800.00,
                    type=TransactionType.EXPENSE,
                    date=now - timedelta(days=14),
                    notes="Monthly apartment rent",
                ),
                Transaction(
                    user_id=user_alex.id,
                    account_id=account_checking.id,
                    category_id=cat_map["Groceries"],
                    amount=145.80,
                    type=TransactionType.EXPENSE,
                    date=now - timedelta(days=3),
                    notes="Whole Foods weekly run",
                ),
                Transaction(
                    user_id=user_alex.id,
                    account_id=account_checking.id,
                    category_id=cat_map["Dining Out"],
                    amount=64.25,
                    type=TransactionType.EXPENSE,
                    date=now - timedelta(days=1),
                    notes="Dinner with colleagues",
                ),
                Transaction(
                    user_id=user_alex.id,
                    account_id=account_checking.id,
                    category_id=cat_map["Subscriptions"],
                    amount=15.99,
                    type=TransactionType.EXPENSE,
                    date=now - timedelta(days=5),
                    notes="Streaming service monthly fee",
                ),
            ]
            session.add_all(transactions)

            # 6. Create Monthly Budgets
            budgets = [
                Budget(
                    user_id=user_alex.id,
                    category_id=cat_map["Groceries"],
                    amount=600.00,
                    period=BudgetPeriod.MONTHLY,
                    start_date=now.replace(day=1),
                ),
                Budget(
                    user_id=user_alex.id,
                    category_id=cat_map["Dining Out"],
                    amount=300.00,
                    period=BudgetPeriod.MONTHLY,
                    start_date=now.replace(day=1),
                ),
            ]
            session.add_all(budgets)

            # 7. Create Savings Goals
            goals = [
                SavingsGoal(
                    user_id=user_alex.id,
                    name="Emergency Fund",
                    target_amount=20000.00,
                    current_amount=15400.00,
                    target_date=now + timedelta(days=180),
                    status=GoalStatus.IN_PROGRESS,
                ),
                SavingsGoal(
                    user_id=user_alex.id,
                    name="Vacation Trip to Japan",
                    target_amount=4500.00,
                    current_amount=1200.00,
                    target_date=now + timedelta(days=240),
                    status=GoalStatus.IN_PROGRESS,
                ),
            ]
            session.add_all(goals)

            # 8. Create Recurring Payments
            recurring_payments = [
                RecurringPayment(
                    user_id=user_alex.id,
                    account_id=account_checking.id,
                    category_id=cat_map["Housing"],
                    amount=1800.00,
                    frequency=Frequency.MONTHLY,
                    next_due_date=now + timedelta(days=15),
                    name="Monthly Rent",
                    is_active=True,
                ),
                RecurringPayment(
                    user_id=user_alex.id,
                    account_id=account_checking.id,
                    category_id=cat_map["Subscriptions"],
                    amount=15.99,
                    frequency=Frequency.MONTHLY,
                    next_due_date=now + timedelta(days=25),
                    name="Streaming Service",
                    is_active=True,
                ),
            ]
            session.add_all(recurring_payments)

            await session.commit()
            logger.info("FinPulse demo database seeding completed successfully.")

    await engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_database())