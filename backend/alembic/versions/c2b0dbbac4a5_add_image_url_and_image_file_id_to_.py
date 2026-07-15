"""Add image_url and image_file_id to categories

Revision ID: c2b0dbbac4a5
Revises: 7535664f2e3f
Create Date: 2026-07-15 15:27:54.582042

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2b0dbbac4a5'
down_revision: Union[str, Sequence[str], None] = '7535664f2e3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('categories', sa.Column('image_url', sa.String(), nullable=True))
    op.add_column('categories', sa.Column('image_file_id', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('categories', 'image_file_id')
    op.drop_column('categories', 'image_url')
