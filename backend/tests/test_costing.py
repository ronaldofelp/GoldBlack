"""
Testes do motor de custo (app/services/costing.py).

Monta um cenário completo num SQLite em memória e valida cada parcela da
fórmula: insumos + mão de obra (diária e serviço/empreita) + hora-máquina,
e as métricas derivadas (custo/ha, custo/saca, receita, lucro bruto).
"""
from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app import models
from app.services import costing


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    s = Session()
    yield s
    s.close()


def _scenario(db):
    """Talhão de 10 ha, safra 2025/2026, uma atividade com:
    - insumo: 100 kg × R$5 = R$500
    - diária: 3 diárias × R$120 (do trabalhador) = R$360
    - serviço: 2 serviços × R$200 (da definição) = R$400
    - hora-máquina: 4 h × R$150 = R$600
    total atividade = 1860. Produção = 30 sacas. Venda = R$4000.
    """
    farm = models.Farm(id="f1", producer_id="u1", name="Faz", total_area_ha=Decimal("100"))
    user = models.User(id="u1", name="P", email="p@x.com", password_hash="x", role=models.UserRole.PRODUCER)
    plot = models.Plot(id="p1", farm_id="f1", code="T-01", area_ha=Decimal("10"), status=models.PlotStatus.IN_PRODUCTION)
    season = models.Season(id="s1", name="2025/2026")
    supply = models.AgriculturalSupply(id="sup1", name="Ureia", category=models.SupplyCategory.FERTILIZER,
                                       unit_of_measure="kg", unit_cost=Decimal("5"), stock_quantity=Decimal("1000"))
    worker = models.Worker(id="w1", farm_id="f1", name="José", type=models.WorkerType.REGISTERED, daily_rate=Decimal("120"))
    svcdef = models.ServiceDefinition(id="sd1", farm_id="f1", name="Desbrota", unit_value=Decimal("200"))
    machine = models.Machine(id="m1", farm_id="f1", name="Trator", hourly_cost=Decimal("150"))
    activity = models.AgriculturalActivity(id="a1", plot_id="p1", season_id="s1",
                                           type=models.ActivityType.FERTILIZATION, start_date=date(2025, 5, 1),
                                           status=models.ActivityStatus.COMPLETED)
    db.add_all([user, farm, plot, season, supply, worker, svcdef, machine, activity])
    db.commit()

    db.add(models.ActivitySupply(activity_id="a1", supply_id="sup1", applied_quantity=Decimal("100"), total_cost=Decimal("500")))
    db.add(models.LaborEntry(id="le1", activity_id="a1", labor_type=models.LaborType.DIARIA, worker_id="w1", quantity=Decimal("3")))
    db.add(models.LaborEntry(id="le2", activity_id="a1", labor_type=models.LaborType.SERVICO, service_definition_id="sd1", quantity=Decimal("2")))
    db.add(models.MachineUsage(id="mu1", activity_id="a1", machine_id="m1", hours=Decimal("4")))
    db.add(models.Production(id="prod1", plot_id="p1", season_id="s1", sacks_produced=Decimal("30")))
    # Venda casada pela safra (harvest_season == season.name)
    batch = models.TraceabilityBatch(id="b1", plot_id="p1", harvest_season="2025/2026", batch_code="B1",
                                     coffee_type=models.CoffeeType.NATURAL, harvest_date=date(2025, 6, 1),
                                     total_volume_measures=Decimal("100"))
    db.add(batch)
    db.commit()
    db.add(models.Sale(id="sale1", batch_id="b1", sale_date=date(2025, 7, 1), customer="Torref", total_value=Decimal("4000")))
    db.commit()
    return plot, season


def test_activity_cost_breakdown(db):
    plot, season = _scenario(db)
    activity = db.get(models.AgriculturalActivity, "a1")
    c = costing.activity_cost(activity)
    assert c["supplies_cost"] == Decimal("500")
    assert c["labor_cost"] == Decimal("760")      # 360 (diária) + 400 (serviço)
    assert c["machine_cost"] == Decimal("600")
    assert c["total_cost"] == Decimal("1860")


def test_labor_unit_value_override(db):
    """unit_value informado tem prioridade sobre a taxa da referência."""
    plot, season = _scenario(db)
    e = models.LaborEntry(id="le3", activity_id="a1", labor_type=models.LaborType.DIARIA,
                          worker_id="w1", quantity=Decimal("1"), unit_value=Decimal("999"))
    assert costing.labor_entry_cost(e) == Decimal("999")


def test_plot_season_cost_metrics(db):
    plot, season = _scenario(db)
    r = costing.plot_season_cost(db, plot, season)
    assert r["total_cost"] == Decimal("1860")
    assert r["cost_per_hectare"] == Decimal("186")     # 1860 / 10 ha
    assert r["sacks_produced"] == Decimal("30")
    assert r["cost_per_sack"] == Decimal("62")         # 1860 / 30 sacas
    assert r["revenue"] == Decimal("4000")
    assert r["gross_profit"] == Decimal("2140")        # 4000 - 1860


def test_no_production_yields_none_cost_per_sack(db):
    """Sem produção lançada, custo/saca é None (não quebra, não divide por zero)."""
    farm = models.Farm(id="f9", producer_id="u9", name="F", total_area_ha=Decimal("5"))
    user = models.User(id="u9", name="P", email="p9@x.com", password_hash="x", role=models.UserRole.PRODUCER)
    plot = models.Plot(id="p9", farm_id="f9", code="T-09", area_ha=Decimal("5"), status=models.PlotStatus.IN_PRODUCTION)
    season = models.Season(id="s9", name="2024/2025")
    db.add_all([user, farm, plot, season])
    db.commit()
    r = costing.plot_season_cost(db, plot, season)
    assert r["total_cost"] == Decimal("0")
    assert r["cost_per_sack"] is None
    assert r["cost_per_hectare"] == Decimal("0")
    assert r["gross_profit"] == Decimal("0")
