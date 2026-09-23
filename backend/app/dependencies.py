"""
dependencies.py — Provedores de dependências para injeção via FastAPI Depends.

Para migrar para Oracle:
  1. Importe OracleXRepository (quando criado).
  2. Substitua SQLAlchemyXRepository → OracleXRepository nas funções abaixo.
  3. Nenhum endpoint ou teste precisará ser alterado.
"""

from fastapi import Depends
from sqlalchemy.orm import Session

from .database import get_db
from .repositories import (
    IUserRepository, SQLAlchemyUserRepository,
    IFarmRepository, SQLAlchemyFarmRepository,
    IPlotRepository, SQLAlchemyPlotRepository,
    ISoilAnalysisRepository, SQLAlchemySoilAnalysisRepository,
    IRecommendationRepository, SQLAlchemyRecommendationRepository,
    IHarvestEstimateRepository, SQLAlchemyHarvestEstimateRepository,
    IWeatherLogRepository, SQLAlchemyWeatherLogRepository,
    IAlertRepository, SQLAlchemyAlertRepository,
    ISupplyRepository, SQLAlchemySupplyRepository,
    IActivityRepository, SQLAlchemyActivityRepository,
    IBatchRepository, SQLAlchemyBatchRepository,
    IPhaseRepository,
    SQLAlchemyWasherPhaseRepository,
    SQLAlchemyPatioPhaseRepository,
    SQLAlchemyDryerPhaseRepository,
    SQLAlchemySiloPhaseRepository,
    SQLAlchemyProcessingPhaseRepository,
    ISaleRepository, SQLAlchemySaleRepository,
    IFinancialTransactionRepository, SQLAlchemyFinancialTransactionRepository,
    ICoffeeTrackingRepository, SQLAlchemyCoffeeTrackingRepository,
    ITrackingEventRepository, SQLAlchemyTrackingEventRepository,
    SQLAlchemySeasonRepository, SQLAlchemyPlotVarietyRepository,
    SQLAlchemyProductionRepository, SQLAlchemyMachineRepository,
    SQLAlchemyWorkerRepository, SQLAlchemyServiceDefinitionRepository,
    SQLAlchemyMachineUsageRepository, SQLAlchemyLaborEntryRepository,
    SQLAlchemyActivitySupplyRepository,
)


def get_user_repo(db: Session = Depends(get_db)) -> IUserRepository:
    return SQLAlchemyUserRepository(db)


def get_farm_repo(db: Session = Depends(get_db)) -> IFarmRepository:
    return SQLAlchemyFarmRepository(db)


def get_plot_repo(db: Session = Depends(get_db)) -> IPlotRepository:
    return SQLAlchemyPlotRepository(db)


def get_soil_analysis_repo(db: Session = Depends(get_db)) -> ISoilAnalysisRepository:
    return SQLAlchemySoilAnalysisRepository(db)


def get_recommendation_repo(db: Session = Depends(get_db)) -> IRecommendationRepository:
    return SQLAlchemyRecommendationRepository(db)


def get_harvest_estimate_repo(db: Session = Depends(get_db)) -> IHarvestEstimateRepository:
    return SQLAlchemyHarvestEstimateRepository(db)


def get_weather_log_repo(db: Session = Depends(get_db)) -> IWeatherLogRepository:
    return SQLAlchemyWeatherLogRepository(db)


def get_alert_repo(db: Session = Depends(get_db)) -> IAlertRepository:
    return SQLAlchemyAlertRepository(db)


def get_supply_repo(db: Session = Depends(get_db)) -> ISupplyRepository:
    return SQLAlchemySupplyRepository(db)


def get_activity_repo(db: Session = Depends(get_db)) -> IActivityRepository:
    return SQLAlchemyActivityRepository(db)


def get_batch_repo(db: Session = Depends(get_db)) -> IBatchRepository:
    return SQLAlchemyBatchRepository(db)


def get_washer_phase_repo(db: Session = Depends(get_db)) -> IPhaseRepository:
    return SQLAlchemyWasherPhaseRepository(db)


def get_patio_phase_repo(db: Session = Depends(get_db)) -> IPhaseRepository:
    return SQLAlchemyPatioPhaseRepository(db)


def get_dryer_phase_repo(db: Session = Depends(get_db)) -> IPhaseRepository:
    return SQLAlchemyDryerPhaseRepository(db)


def get_silo_phase_repo(db: Session = Depends(get_db)) -> IPhaseRepository:
    return SQLAlchemySiloPhaseRepository(db)


def get_processing_phase_repo(db: Session = Depends(get_db)) -> IPhaseRepository:
    return SQLAlchemyProcessingPhaseRepository(db)


def get_sale_repo(db: Session = Depends(get_db)) -> ISaleRepository:
    return SQLAlchemySaleRepository(db)


def get_financial_transaction_repo(db: Session = Depends(get_db)) -> IFinancialTransactionRepository:
    return SQLAlchemyFinancialTransactionRepository(db)


def get_coffee_tracking_repo(db: Session = Depends(get_db)) -> ICoffeeTrackingRepository:
    return SQLAlchemyCoffeeTrackingRepository(db)


def get_tracking_event_repo(db: Session = Depends(get_db)) -> ITrackingEventRepository:
    return SQLAlchemyTrackingEventRepository(db)


# ── Domínio de Custo ─────────────────────────────────────────────────────────

def get_season_repo(db: Session = Depends(get_db)) -> SQLAlchemySeasonRepository:
    return SQLAlchemySeasonRepository(db)


def get_plot_variety_repo(db: Session = Depends(get_db)) -> SQLAlchemyPlotVarietyRepository:
    return SQLAlchemyPlotVarietyRepository(db)


def get_production_repo(db: Session = Depends(get_db)) -> SQLAlchemyProductionRepository:
    return SQLAlchemyProductionRepository(db)


def get_machine_repo(db: Session = Depends(get_db)) -> SQLAlchemyMachineRepository:
    return SQLAlchemyMachineRepository(db)


def get_worker_repo(db: Session = Depends(get_db)) -> SQLAlchemyWorkerRepository:
    return SQLAlchemyWorkerRepository(db)


def get_service_definition_repo(db: Session = Depends(get_db)) -> SQLAlchemyServiceDefinitionRepository:
    return SQLAlchemyServiceDefinitionRepository(db)


def get_machine_usage_repo(db: Session = Depends(get_db)) -> SQLAlchemyMachineUsageRepository:
    return SQLAlchemyMachineUsageRepository(db)


def get_labor_entry_repo(db: Session = Depends(get_db)) -> SQLAlchemyLaborEntryRepository:
    return SQLAlchemyLaborEntryRepository(db)


def get_activity_supply_repo(db: Session = Depends(get_db)) -> SQLAlchemyActivitySupplyRepository:
    return SQLAlchemyActivitySupplyRepository(db)
