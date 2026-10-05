# @module: Migration.backend/alembic/versions/0001_initial_schema.py
# @spec_section_id: implementation_blueprint
# @req_ids: N/A
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""Initial database migration for FinPulse Engine.

Creates all canonical tables: users, accounts, categories, transactions,
budgets, households, household_members, savings_goals, recurring_payments,
and audit_logs with proper foreign keys, UUID primary keys, and indices.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable UUID extension if not already present
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # 1. users table
    op.create_table(
        'users',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('base_currency', sa.String(length=3), nullable=False, server_default='USD'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # 2. accounts table
    op.create_table(
        'accounts',
        sa.Column('account_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('institution_id', sa.String(length=50), nullable=True),
        sa.Column('institution_name', sa.String(length=150), nullable=True),
        sa.Column('account_name', sa.String(length=100), nullable=False),
        sa.Column('account_type', sa.String(length=30), nullable=False),
        sa.Column('access_token', sa.Text(), nullable=True),
        sa.Column('current_balance', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_accounts_user_id', 'accounts', ['user_id'])

    # 3. categories table
    op.create_table(
        'categories',
        sa.Column('category_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=True),
        sa.Column('category_name', sa.String(length=100), nullable=False),
        sa.Column('category_type', sa.String(length=30), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_categories_user_id', 'categories', ['user_id'])

    # 4. transactions table
    op.create_table(
        'transactions',
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.account_id', ondelete='CASCADE'), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.category_id', ondelete='RESTRICT'), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('transaction_type', sa.String(length=20), nullable=False),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('merchant_name', sa.String(length=150), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('is_synced', sa.Boolean(), nullable=False, server_default='FALSE'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_transactions_account_id', 'transactions', ['account_id'])
    op.create_index('ix_transactions_category_id', 'transactions', ['category_id'])
    op.create_index('ix_transactions_transaction_date', 'transactions', ['transaction_date'])

    # 5. budgets table
    op.create_table(
        'budgets',
        sa.Column('budget_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.category_id', ondelete='CASCADE'), nullable=False),
        sa.Column('budget_name', sa.String(length=100), nullable=False),
        sa.Column('limit_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('time_period', sa.String(length=20), nullable=False),
        sa.Column('alert_threshold_pct', sa.Integer(), nullable=False, server_default='80'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_budgets_user_id', 'budgets', ['user_id'])
    op.create_index('ix_budgets_category_id', 'budgets', ['category_id'])

    # 6. households table
    op.create_table(
        'households',
        sa.Column('household_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('household_name', sa.String(length=100), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_households_owner_id', 'households', ['owner_id'])

    # 7. household_members table
    op.create_table(
        'household_members',
        sa.Column('membership_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('households.household_id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('member_role', sa.String(length=20), nullable=False, server_default='MEMBER'),
        sa.Column('joined_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_household_members_household_id', 'household_members', ['household_id'])
    op.create_index('ix_household_members_user_id', 'household_members', ['user_id'])

    # 8. savings_goals table
    op.create_table(
        'savings_goals',
        sa.Column('goal_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('goal_name', sa.String(length=100), nullable=False),
        sa.Column('target_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('current_amount', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_savings_goals_user_id', 'savings_goals', ['user_id'])

    # 9. recurring_payments table
    op.create_table(
        'recurring_payments',
        sa.Column('recurring_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('payment_name', sa.String(length=100), nullable=False),
        sa.Column('expected_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('frequency', sa.String(length=20), nullable=False),
        sa.Column('next_due_date', sa.Date(), nullable=False),
        sa.Column('reminder_days_prior', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_recurring_payments_user_id', 'recurring_payments', ['user_id'])
    op.create_index('ix_recurring_payments_next_due_date', 'recurring_payments', ['next_due_date'])

    # 10. audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('log_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='SET NULL'), nullable=True),
        sa.Column('action_type', sa.String(length=100), nullable=False),
        sa.Column('source_ip', sa.String(length=45), nullable=False),
        sa.Column('outcome_status', sa.String(length=20), nullable=False),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_action_type', 'audit_logs', ['action_type'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order of dependency
    op.drop_table('audit_logs')
    op.drop_table('recurring_payments')
    op.drop_table('savings_goals')
    op.drop_table('household_members')
    op.drop_table('households')
    op.drop_table('budgets')
    op.drop_table('transactions')
    op.drop_table('categories')
    op.drop_table('accounts')
    op.drop_table('users')