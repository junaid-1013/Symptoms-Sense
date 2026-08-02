"""Store structured UI cards on saved chat messages.

Revision ID: b7d3f1e04a91
Revises: 8e9b4c1a72d3
"""
from alembic import op
import sqlalchemy as sa

revision = "b7d3f1e04a91"
down_revision = "8e9b4c1a72d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chat_message", sa.Column("cards", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("chat_message", "cards")
