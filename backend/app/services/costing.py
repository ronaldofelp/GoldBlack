"""
costing.py — Motor de custo do GoldBlack (calculado ON-THE-FLY).

Nada de total agregado gravado no banco: o custo é sempre recomputado a partir
dos lançamentos (insumos, mão de obra, hora-máquina). Assim, se o preço de um
insumo ou o valor de uma diária mudar, o custo reflete na hora — sem dado velho.

Fórmulas (ver memória cost-domain-rules):
  custo_atividade   = Σ insumos + Σ mão de obra + Σ hora-máquina
  custo_talhão_safra = Σ custo_atividade (mesmo talhão + safra)
  custo/ha          = custo_talhão_safra ÷ área do talhão
  custo/saca        = custo_talhão_safra ÷ sacas produzidas na safra
  lucro_bruto       = receita − custo_talhão_safra
"""
from decimal import Decimal
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models

ZERO = Decimal("0")


def _d(value) -> Decimal:
    """Converte para Decimal com segurança (None → 0)."""
    if value is None:
        return ZERO
    return value if isinstance(value, Decimal) else Decimal(str(value))


def labor_entry_cost(entry: models.LaborEntry) -> Decimal:
    """Custo de um apontamento de mão de obra.
    unit_value tem prioridade (snapshot histórico); senão usa a taxa da referência:
    DIARIA → diária do trabalhador; SERVICO → valor do serviço (empreita)."""
    rate = entry.unit_value
    if rate is None:
        if entry.labor_type == models.LaborType.DIARIA and entry.worker is not None:
            rate = entry.worker.daily_rate
        elif entry.labor_type == models.LaborType.SERVICO and entry.service_definition is not None:
            rate = entry.service_definition.unit_value
    return _d(entry.quantity) * _d(rate)


def machine_usage_cost(usage: models.MachineUsage) -> Decimal:
    """Custo de hora-máquina = horas × custo/hora da máquina."""
    hourly = usage.machine.hourly_cost if usage.machine is not None else None
    return _d(usage.hours) * _d(hourly)


def activity_cost(activity: models.AgriculturalActivity) -> dict:
    """Decompõe o custo de uma atividade em insumos / mão de obra / máquina."""
    supplies_cost = sum((_d(s.total_cost) for s in activity.activity_supplies), ZERO)
    labor_cost = sum((labor_entry_cost(e) for e in activity.labor_entries), ZERO)
    machine_cost = sum((machine_usage_cost(u) for u in activity.machine_usages), ZERO)
    return {
        "activity_id": activity.id,
        "supplies_cost": supplies_cost,
        "labor_cost": labor_cost,
        "machine_cost": machine_cost,
        "total_cost": supplies_cost + labor_cost + machine_cost,
    }


def _revenue_for_plot_season(db: Session, plot_id: str, season_name: Optional[str]) -> Decimal:
    """Receita = Σ vendas dos lotes daquele talhão na safra (casada pelo nome da safra
    em TraceabilityBatch.harvest_season)."""
    if not season_name:
        return ZERO
    total = (
        db.query(func.coalesce(func.sum(models.Sale.total_value), 0))
        .join(models.TraceabilityBatch, models.Sale.batch_id == models.TraceabilityBatch.id)
        .filter(
            models.TraceabilityBatch.plot_id == plot_id,
            models.TraceabilityBatch.harvest_season == season_name,
        )
        .scalar()
    )
    return _d(total)


def plot_season_cost(db: Session, plot: models.Plot, season: models.Season) -> dict:
    """Apura o custo completo de um talhão numa safra e as métricas derivadas."""
    activities = (
        db.query(models.AgriculturalActivity)
        .filter(
            models.AgriculturalActivity.plot_id == plot.id,
            models.AgriculturalActivity.season_id == season.id,
        )
        .all()
    )

    breakdowns = [activity_cost(a) for a in activities]
    supplies_cost = sum((b["supplies_cost"] for b in breakdowns), ZERO)
    labor_cost = sum((b["labor_cost"] for b in breakdowns), ZERO)
    machine_cost = sum((b["machine_cost"] for b in breakdowns), ZERO)
    total_cost = supplies_cost + labor_cost + machine_cost

    area = _d(plot.area_ha)
    cost_per_hectare = (total_cost / area) if area > 0 else None

    production = (
        db.query(models.Production)
        .filter(models.Production.plot_id == plot.id, models.Production.season_id == season.id)
        .first()
    )
    sacks = _d(production.sacks_produced) if production else None
    cost_per_sack = (total_cost / sacks) if sacks and sacks > 0 else None

    revenue = _revenue_for_plot_season(db, plot.id, season.name)

    return {
        "plot_id": plot.id,
        "season_id": season.id,
        "area_ha": area,
        "supplies_cost": supplies_cost,
        "labor_cost": labor_cost,
        "machine_cost": machine_cost,
        "total_cost": total_cost,
        "cost_per_hectare": cost_per_hectare,
        "sacks_produced": sacks,
        "cost_per_sack": cost_per_sack,
        "revenue": revenue,
        "gross_profit": revenue - total_cost,
        "activities": breakdowns,
    }
