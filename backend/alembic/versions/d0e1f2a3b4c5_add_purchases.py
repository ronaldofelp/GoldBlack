"""add tabelas purchases e purchase_items (modulo de Compras)

Revision ID: d0e1f2a3b4c5
Revises: c3d4e5f6a7b8
Create Date: 2026-10-26 00:00:00.000000

Ordem de compra de insumos (Purchase) com itens (PurchaseItem).
Ao marcar uma compra como DELIVERED o backend incrementa stock_quantity
dos insumos correspondentes em uma única transação.
"""
from alembic import op
import sqlalchemy as sa

revision = 'd0e1f2a3b4c5'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'purchases',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('farm_id', sa.String(36), nullable=False),
        sa.Column('supplier', sa.String(255), nullable=False),
        sa.Column('invoice_number', sa.String(100), nullable=True),
        sa.Column('purchase_date', sa.Date(), nullable=False),
        sa.Column('total_value', sa.Numeric(15, 2), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], name='fk_purchase_farm'),
        sa.PrimaryKeyConstraint('id', name='pk_purchases'),
    )
    op.create_index('ix_purchases_farm_id', 'purchases', ['farm_id'])

    op.create_table(
        'purchase_items',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('purchase_id', sa.String(36), nullable=False),
        sa.Column('supply_id', sa.String(36), nullable=False),
        sa.Column('quantity', sa.Numeric(10, 2), nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.ForeignKeyConstraint(['purchase_id'], ['purchases.id'], name='fk_pitem_purchase'),
        sa.ForeignKeyConstraint(['supply_id'], ['agricultural_supplies.id'], name='fk_pitem_supply'),
        sa.PrimaryKeyConstraint('id', name='pk_purchase_items'),
    )
    op.create_index('ix_purchase_items_purchase_id', 'purchase_items', ['purchase_id'])


def downgrade() -> None:
    op.drop_index('ix_purchase_items_purchase_id', table_name='purchase_items')
    op.drop_table('purchase_items')
    op.drop_index('ix_purchases_farm_id', table_name='purchases')
    op.drop_table('purchases')
