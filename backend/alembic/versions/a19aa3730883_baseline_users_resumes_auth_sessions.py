"""baseline: users, resumes, auth_sessions

The schema was created by db/01_schema.sql. This revision is an intentional
no-op that marks that state as the starting point, so Alembic has a baseline
to build on without trying to recreate (or drop) anything.

DO NOT let autogenerate rewrite this file. Autogenerate compares the database
against app/models, and the models deliberately do not declare the CHECK
constraints, partial indexes, or triggers that live in the SQL file — so
autogenerate reads them as "removed" and emits DROP statements. Those
constraints are the safety net; keep them.

For every change from here on:
    alembic revision -m "add whatever"     # write the upgrade/downgrade by hand
    alembic upgrade head

Revision ID: a19aa3730883
"""

from collections.abc import Sequence

revision: str = "a19aa3730883"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """No-op. The tables already exist; see db/01_schema.sql."""
    pass


def downgrade() -> None:
    """No-op. Dropping the baseline would destroy every table."""
    pass
