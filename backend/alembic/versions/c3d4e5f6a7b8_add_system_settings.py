"""add tabela system_settings (configuracoes por fazenda)

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-10-23 00:00:00.000000

Uma linha por fazenda (UNIQUE em farm_id). Armazena a safra ativa usada
pelo painel de custo e pela tela de Configurações do frontend.
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'system_settings',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('farm_id', sa.String(36), nullable=False),
        sa.Column('active_season_id', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], name='fk_sysset_farm'),
        sa.ForeignKeyConstraint(['active_season_id'], ['seasons.id'], name='fk_sysset_season'),
        sa.PrimaryKeyConstraint('id', name='pk_system_settings'),
        sa.UniqueConstraint('farm_id', name='uq_sysset_farm'),
    )


def downgrade() -> None:
    op.drop_table('system_settings')
