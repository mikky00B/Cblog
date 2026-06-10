"""Add editorial post flags.

Revision ID: 20260610_0002
Revises: 20260610_0001
Create Date: 2026-06-10
"""
from alembic import op
import sqlalchemy as sa

revision = "20260610_0002"
down_revision = "20260610_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("posts", sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("posts", sa.Column("is_popular", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("posts", sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"))
    op.create_index("ix_posts_is_featured", "posts", ["is_featured"], unique=False)
    op.create_index("ix_posts_is_popular", "posts", ["is_popular"], unique=False)
    op.create_index("ix_posts_display_order", "posts", ["display_order"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_posts_display_order", table_name="posts")
    op.drop_index("ix_posts_is_popular", table_name="posts")
    op.drop_index("ix_posts_is_featured", table_name="posts")
    op.drop_column("posts", "display_order")
    op.drop_column("posts", "is_popular")
    op.drop_column("posts", "is_featured")
