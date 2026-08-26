# -*- coding: utf-8 -*-
"""
mock_data.py — Script de seed para popular o banco GoldBlack Coffee.

Execucao:
    python mock_data.py

O script utiliza os repositórios concretos (SQLAlchemy) via injeção manual,
respeitando a mesma arquitetura de camadas da API.
Cada execução limpa e recria os dados de exemplo.
"""

import sys
import uuid
from datetime import date, datetime

from passlib.context import CryptContext
from sqlalchemy.orm import Session

# Adiciona o diretório raiz ao path para imports relativos funcionarem
sys.path.insert(0, ".")

from app.database import SessionLocal, engine, Base
from app import models
from app.repositories import (
    SQLAlchemyUserRepository,
    SQLAlchemyFarmRepository,
    SQLAlchemyPlotRepository,
    SQLAlchemySoilAnalysisRepository,
    SQLAlchemyRecommendationRepository,
    SQLAlchemyHarvestEstimateRepository,
    SQLAlchemyWeatherLogRepository,
    SQLAlchemyAlertRepository,
    SQLAlchemySupplyRepository,
    SQLAlchemyActivityRepository,
    SQLAlchemyBatchRepository,
    SQLAlchemyWasherPhaseRepository,
    SQLAlchemyPatioPhaseRepository,
    SQLAlchemyDryerPhaseRepository,
    SQLAlchemySiloPhaseRepository,
    SQLAlchemyProcessingPhaseRepository,
    SQLAlchemySaleRepository,
    SQLAlchemyFinancialTransactionRepository,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed(db: Session):
    print("[*] Recriando tabelas...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # ── Repositórios ──────────────────────────────────────────────────────────
    user_repo     = SQLAlchemyUserRepository(db)
    farm_repo     = SQLAlchemyFarmRepository(db)
    plot_repo     = SQLAlchemyPlotRepository(db)
    soil_repo     = SQLAlchemySoilAnalysisRepository(db)
    rec_repo      = SQLAlchemyRecommendationRepository(db)
    est_repo      = SQLAlchemyHarvestEstimateRepository(db)
    weather_repo  = SQLAlchemyWeatherLogRepository(db)
    alert_repo    = SQLAlchemyAlertRepository(db)
    supply_repo   = SQLAlchemySupplyRepository(db)
    activity_repo = SQLAlchemyActivityRepository(db)
    batch_repo    = SQLAlchemyBatchRepository(db)
    washer_repo   = SQLAlchemyWasherPhaseRepository(db)
    patio_repo    = SQLAlchemyPatioPhaseRepository(db)
    dryer_repo    = SQLAlchemyDryerPhaseRepository(db)
    silo_repo     = SQLAlchemySiloPhaseRepository(db)
    proc_repo     = SQLAlchemyProcessingPhaseRepository(db)
    sale_repo     = SQLAlchemySaleRepository(db)
    fin_repo      = SQLAlchemyFinancialTransactionRepository(db)

    # ── Usuários ──────────────────────────────────────────────────────────────
    print("[*] Criando usuarios...")
    producer = user_repo.create(models.User(
        id=str(uuid.uuid4()),
        name="João da Silva Café",
        email="joao@goldblack.com.br",
        password_hash=pwd_context.hash("senha123"),
        role=models.UserRole.PRODUCER,
    ))

    agronomist = user_repo.create(models.User(
        id=str(uuid.uuid4()),
        name="Dra. Ana Agrônoma",
        email="ana@goldblack.com.br",
        password_hash=pwd_context.hash("senha456"),
        role=models.UserRole.AGRONOMIST,
    ))

    operator = user_repo.create(models.User(
        id=str(uuid.uuid4()),
        name="Carlos Operador",
        email="carlos@goldblack.com.br",
        password_hash=pwd_context.hash("senha789"),
        role=models.UserRole.OPERATOR,
    ))
    print(f"   + {producer.name} (PRODUTOR)")
    print(f"   + {agronomist.name} (AGRONOMO)")
    print(f"   + {operator.name} (OPERADOR)")

    # ── Propriedade ───────────────────────────────────────────────────────────
    print("[*] Criando propriedade...")
    farm = farm_repo.create(models.Farm(
        id=str(uuid.uuid4()),
        producer_id=producer.id,
        name="Fazenda Ouro Preto",
        total_area_ha=120.5,
    ))
    print(f"   + {farm.name} ({farm.total_area_ha} ha)")

    # ── Talhões ───────────────────────────────────────────────────────────────
    print("[*] Criando talhoes...")
    plot_a = plot_repo.create(models.Plot(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        code="T-01",
        area_ha=45.0,
        variety="Catuaí Vermelho",
        planting_year=2015,
        status=models.PlotStatus.IN_PRODUCTION,
    ))
    plot_b = plot_repo.create(models.Plot(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        code="T-02",
        area_ha=30.0,
        variety="Bourbon Amarelo",
        planting_year=2019,
        status=models.PlotStatus.IN_PRODUCTION,
    ))
    plot_c = plot_repo.create(models.Plot(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        code="T-03",
        area_ha=25.5,
        variety="Mundo Novo",
        planting_year=2022,
        status=models.PlotStatus.DEVELOPMENT,
    ))
    print(f"   + {plot_a.code} - {plot_a.variety}")
    print(f"   + {plot_b.code} - {plot_b.variety}")
    print(f"   + {plot_c.code} - {plot_c.variety}")

    # ── Análise de solo ───────────────────────────────────────────────────────
    print("[*] Criando analise de solo...")
    soil = soil_repo.create(models.SoilAnalysis(
        id=str(uuid.uuid4()),
        plot_id=plot_a.id,
        collection_date=date(2025, 3, 15),
        ph=6.2,
        organic_matter=3.8,
        report_url="https://goldblack.com/laudos/solo-t01-2025.pdf",
    ))
    print(f"   + pH={soil.ph}, MO={soil.organic_matter}%")

    # ── Recomendação técnica ──────────────────────────────────────────────────
    print("[*] Criando recomendacao tecnica...")
    rec = rec_repo.create(models.TechnicalRecommendation(
        id=str(uuid.uuid4()),
        agronomist_id=agronomist.id,
        plot_id=plot_a.id,
        description="Aplicar calcário dolomítico 2 t/ha para correção de pH. Reavaliar após 90 dias.",
        issue_date=date(2025, 3, 20),
        deadline=date(2025, 5, 20),
        status=models.RecommendationStatus.PENDING,
    ))
    print(f"   + Recomendacao de calagem - Prazo: {rec.deadline}")

    # ── Estimativa de safra ───────────────────────────────────────────────────
    print("[*] Criando estimativa de safra...")
    estimate = est_repo.create(models.HarvestEstimate(
        id=str(uuid.uuid4()),
        plot_id=plot_a.id,
        season="2025/2026",
        estimated_sacks=1350.0,
        estimated_yield_per_ha=30.0,
    ))
    print(f"   + Safra {estimate.season}: {estimate.estimated_sacks} sacas estimadas")

    # ── Registros climáticos ──────────────────────────────────────────────────
    print("[*] Criando registros climaticos...")
    for i, (temp, prec, hum) in enumerate([
        (22.5, 12.3, 75.0),
        (24.1, 0.0, 68.0),
        (19.8, 35.7, 88.0),
    ]):
        weather_repo.create(models.WeatherLog(
            id=str(uuid.uuid4()),
            farm_id=farm.id,
            log_date=date(2025, 7, 10 + i),
            temperature_celsius=temp,
            precipitation_mm=prec,
            relative_humidity=hum,
        ))
    print("   + 3 registros climaticos criados")

    # ── Alertas do sistema ────────────────────────────────────────────────────
    print("[*] Criando alertas do sistema...")
    alert_repo.create(models.SystemAlert(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        plot_id=plot_a.id,
        alert_type=models.AlertType.WEATHER,
        message="Previsão de geada para os próximos 3 dias. Recomenda-se irrigação preventiva.",
        is_read=False,
    ))
    alert_repo.create(models.SystemAlert(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        plot_id=None,
        alert_type=models.AlertType.AGRONOMIC,
        message="Período crítico de floração. Evitar aplicação de defensivos nas próximas 48h.",
        is_read=False,
    ))
    print("   + 2 alertas criados")

    # ── Insumos agrícolas ─────────────────────────────────────────────────────
    print("[*] Criando insumos agricolas...")
    fertilizer = supply_repo.create(models.AgriculturalSupply(
        id=str(uuid.uuid4()),
        name="Ureia 46% N",
        category=models.SupplyCategory.FERTILIZER,
        unit_of_measure="kg",
        unit_cost=3.85,
        stock_quantity=5000.0,
    ))
    pesticide = supply_repo.create(models.AgriculturalSupply(
        id=str(uuid.uuid4()),
        name="Azoxistrobina 500g/L",
        category=models.SupplyCategory.PESTICIDE,
        unit_of_measure="L",
        unit_cost=68.50,
        stock_quantity=200.0,
    ))
    print(f"   + {fertilizer.name}")
    print(f"   + {pesticide.name}")

    # ── Atividade agrícola ────────────────────────────────────────────────────
    print("[*] Criando atividade agricola...")
    activity = activity_repo.create(models.AgriculturalActivity(
        id=str(uuid.uuid4()),
        plot_id=plot_a.id,
        recommendation_id=rec.id,
        type=models.ActivityType.FERTILIZATION,
        start_date=date(2025, 4, 5),
        end_date=date(2025, 4, 7),
        status=models.ActivityStatus.COMPLETED,
        worked_hours=16.0,
        labor_cost=480.0,
    ))
    print(f"   + Adubacao - Status: {activity.status}")

    # ── Lote de rastreabilidade ───────────────────────────────────────────────
    print("[*] Criando lote de rastreabilidade...")
    batch = batch_repo.create(models.TraceabilityBatch(
        id=str(uuid.uuid4()),
        plot_id=plot_a.id,
        harvest_season="2025/2026",
        batch_code="GB-T01-2025-001",
        coffee_type=models.CoffeeType.NATURAL,
        harvest_date=date(2025, 6, 20),
        total_volume_measures=250.0,
    ))
    print(f"   + Lote {batch.batch_code} - {batch.total_volume_measures} medidas")

    # ── Fases pós-colheita ────────────────────────────────────────────────────
    print("[*] Criando fases pos-colheita...")

    washer_repo.create(models.WasherPhase(
        batch_id=batch.id,
        processing_date=date(2025, 6, 21),
        separated_measures=12.5,
    ))
    print("   + Fase Lavador")

    patio_repo.create(models.PatioPhase(
        batch_id=batch.id,
        entry_date=date(2025, 6, 22),
        exit_date=date(2025, 7, 12),
        exposure_days=20,
        exit_humidity=11.5,
    ))
    print("   + Fase Terreiro")

    dryer_repo.create(models.DryerPhase(
        batch_id=batch.id,
        equipment_identification="SECADOR-01",
        drying_date=date(2025, 7, 13),
        usage_hours=72.0,
        final_humidity=11.0,
    ))
    print("   + Fase Secador")

    silo_repo.create(models.SiloPhase(
        batch_id=batch.id,
        silo_identification="TULHA-A",
        entry_date=date(2025, 7, 15),
        storage_days=30,
    ))
    print("   + Fase Tulha/Silo")

    proc_repo.create(models.ProcessingPhase(
        batch_id=batch.id,
        processing_hours=8.5,
        beverage_classification="Bebida Fina",
        bc_weight_kg=14500.0,
        escolha_weight_kg=1200.0,
        fundo_weight_kg=300.0,
    ))
    print("   + Fase Beneficiamento")

    # ── Comercialização ───────────────────────────────────────────────────────
    print("[*] Criando venda...")
    sale = sale_repo.create(models.Sale(
        id=str(uuid.uuid4()),
        batch_id=batch.id,
        shipment_invoice="REM-2025-4521",
        destination_warehouse="Armazém Santos Export",
        sale_invoice="NF-2025-8801",
        sale_date=date(2025, 8, 20),
        customer="Torrefação Premium Ltda.",
        total_value=87000.00,
    ))
    print(f"   + Venda para {sale.customer} - R$ {sale.total_value:,.2f}")

    # ── Transações financeiras ────────────────────────────────────────────────
    print("[*] Criando transacoes financeiras...")
    fin_repo.create(models.FinancialTransaction(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        type=models.TransactionType.INCOME,
        category=models.TransactionCategory.COFFEE_SALE,
        amount=87000.00,
        due_date=date(2025, 8, 20),
        payment_date=date(2025, 8, 22),
        status=models.TransactionStatus.PAID,
    ))
    fin_repo.create(models.FinancialTransaction(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        type=models.TransactionType.EXPENSE,
        category=models.TransactionCategory.SUPPLY,
        amount=4800.00,
        due_date=date(2025, 4, 10),
        payment_date=date(2025, 4, 10),
        status=models.TransactionStatus.PAID,
    ))
    fin_repo.create(models.FinancialTransaction(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        type=models.TransactionType.EXPENSE,
        category=models.TransactionCategory.LABOR,
        amount=12500.00,
        due_date=date(2025, 9, 5),
        payment_date=None,
        status=models.TransactionStatus.PENDING,
    ))
    print("   + 3 transacoes financeiras criadas")

    print("\nSeed concluido com sucesso!")
    print("-" * 50)
    print("Inicie a API com: uvicorn app.main:app --reload")
    print("Documentacao:     http://127.0.0.1:8000/docs")
    print("-" * 50)


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
