"""add site_feedback doctor_review medicine_reminder

Revision ID: a4bad889586c
Revises: 0ca00fac7845
Create Date: 2026-05-02 10:42:16.688773

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a4bad889586c'
down_revision: Union[str, None] = '0ca00fac7845'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'site_feedback',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='Timestamp when record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when record was last updated'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when record was soft-deleted. NULL means active.'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_site_feedback_deleted_at'), 'site_feedback', ['deleted_at'], unique=False)

    op.create_table(
        'medicine_reminder',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('medicine_name', sa.String(), nullable=False),
        sa.Column('dosage', sa.Integer(), nullable=False),
        sa.Column('medicine_type', sa.String(), nullable=False),
        sa.Column('days_of_week', sa.JSON(), nullable=False),
        sa.Column('reminder_time', sa.Time(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='Timestamp when record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when record was last updated'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when record was soft-deleted. NULL means active.'),
        sa.ForeignKeyConstraint(['patient_id'], ['patient.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_medicine_reminder_deleted_at'), 'medicine_reminder', ['deleted_at'], unique=False)

    op.create_table(
        'doctor_review',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('doctor_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('review', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='Timestamp when record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when record was last updated'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when record was soft-deleted. NULL means active.'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctor.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_doctor_review_deleted_at'), 'doctor_review', ['deleted_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_doctor_review_deleted_at'), table_name='doctor_review')
    op.drop_table('doctor_review')
    op.drop_index(op.f('ix_medicine_reminder_deleted_at'), table_name='medicine_reminder')
    op.drop_table('medicine_reminder')
    op.drop_index(op.f('ix_site_feedback_deleted_at'), table_name='site_feedback')
    op.drop_table('site_feedback')

