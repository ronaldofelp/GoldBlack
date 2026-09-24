"""add índices nas FKs dos caminhos quentes (motor de custo, timeline, dashboard)

Revision ID: a1b2c3d4e5f6
Revises: 60d426c744b0
Create Date: 2026-09-24 10:00:00.000000

Índices adicionados após a revisão do código (finding de performance #8):
- agricultural_activities (plot_id, season_id): filtro central do motor de custo
- labor_entries.activity_id / machine_usages.activity_id: agregação de custo por atividade
- financial_transactions.farm_id: dashboard financeiro
- tracking_events.tracking_id: timeline de rastreabilidade

No Oracle, FK sem índice também causa full scans e locks da tabela-mãe em
delete/update — então indexar aqui é ganho de leitura E de escrita.
"""
from typing import Sequence, Union

from alembic import op


# Identificadores de revisão, usados pelo Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "60d426c744b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_activities_plot_season",
        "agricultural_activities",
        ["plot_id", "season_id"],
    )
    op.create_index(
        op.f("ix_labor_entries_activity_id"),
        "labor_entries",
        ["activity_id"],
    )
    op.create_index(
        op.f("ix_machine_usages_activity_id"),
        "machine_usages",
        ["activity_id"],
    )
    op.create_index(
        op.f("ix_financial_transactions_farm_id"),
        "financial_transactions",
        ["farm_id"],
    )
    op.create_index(
        op.f("ix_tracking_events_tracking_id"),
        "tracking_events",
        ["tracking_id"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_tracking_events_tracking_id"), table_name="tracking_events")
    op.drop_index(op.f("ix_financial_transactions_farm_id"), table_name="financial_transactions")
    op.drop_index(op.f("ix_machine_usages_activity_id"), table_name="machine_usages")
    op.drop_index(op.f("ix_labor_entries_activity_id"), table_name="labor_entries")
    op.drop_index("ix_activities_plot_season", table_name="agricultural_activities")
