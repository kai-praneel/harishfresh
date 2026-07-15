"""Add image_url and image_file_id to categories

Revision ID: c2b0dbbac4a5
Revises: 7535664f2e3f
Create Date: 2026-07-15 15:27:54.582042

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from sqlalchemy.engine.reflection import Inspector

def column_exists(table_name, column_name):
    bind = op.get_context().bind
    insp = Inspector.from_engine(bind)
    has_table = insp.has_table(table_name)
    if not has_table:
        return False
    columns = [c['name'] for c in insp.get_columns(table_name)]
    return column_name in columns


# revision identifiers, used by Alembic.
revision: str = 'c2b0dbbac4a5'
down_revision: Union[str, Sequence[str], None] = '7535664f2e3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    if not column_exists('categories', 'image_url'):
        op.add_column('categories', sa.Column('image_url', sa.String(), nullable=True))
    if not column_exists('categories', 'image_file_id'):
        op.add_column('categories', sa.Column('image_file_id', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('categories', 'image_file_id')
    op.drop_column('categories', 'image_url')
