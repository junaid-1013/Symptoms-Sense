"""Add account-scoped saved medical chat conversations.

Revision ID: 8e9b4c1a72d3
Revises: a4bad889586c
"""
from alembic import op
import sqlalchemy as sa

revision = "8e9b4c1a72d3"
down_revision = "a4bad889586c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_conversation",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("conversation_state", sa.JSON(), nullable=True),
        sa.Column("insights", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_chat_conversation_user_id", "chat_conversation", ["user_id"])
    op.create_table(
        "chat_message",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("conversation_id", sa.String(), sa.ForeignKey("chat_conversation.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_chat_message_conversation_id", "chat_message", ["conversation_id"])


def downgrade() -> None:
    op.drop_index("ix_chat_message_conversation_id", table_name="chat_message")
    op.drop_table("chat_message")
    op.drop_index("ix_chat_conversation_user_id", table_name="chat_conversation")
    op.drop_table("chat_conversation")
