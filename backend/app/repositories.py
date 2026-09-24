import uuid
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional

from sqlalchemy.orm import Session

from . import models

T = TypeVar("T")


class IRepository(ABC, Generic[T]):
    @abstractmethod
    def get_by_id(self, entity_id: str) -> Optional[T]:
        ...

    @abstractmethod
    def list_all(self, skip: int = 0, limit: int = 100) -> list[T]:
        ...

    @abstractmethod
    def create(self, entity: T) -> T:
        ...

    @abstractmethod
    def update(self, entity: T) -> T:
        ...

    @abstractmethod
    def delete(self, entity_id: str) -> bool:
        ...


class IUserRepository(IRepository[models.User]):
    @abstractmethod
    def get_by_email(self, email: str) -> Optional[models.User]:
        ...


class SQLAlchemyUserRepository(IUserRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.User]:
        return self.db.get(models.User, entity_id)

    def get_by_email(self, email: str) -> Optional[models.User]:
        return self.db.query(models.User).filter(models.User.email == email).first()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.User]:
        return self.db.query(models.User).offset(skip).limit(limit).all()

    def create(self, entity: models.User) -> models.User:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.User) -> models.User:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IFarmRepository(IRepository[models.Farm]):
    @abstractmethod
    def list_by_producer(self, producer_id: str) -> list[models.Farm]:
        ...


class SQLAlchemyFarmRepository(IFarmRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.Farm]:
        return self.db.get(models.Farm, entity_id)

    def list_by_producer(self, producer_id: str) -> list[models.Farm]:
        return self.db.query(models.Farm).filter(models.Farm.producer_id == producer_id).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.Farm]:
        return self.db.query(models.Farm).offset(skip).limit(limit).all()

    def create(self, entity: models.Farm) -> models.Farm:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.Farm) -> models.Farm:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IPlotRepository(IRepository[models.Plot]):
    @abstractmethod
    def list_by_farm(self, farm_id: str) -> list[models.Plot]:
        ...


class SQLAlchemyPlotRepository(IPlotRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.Plot]:
        return self.db.get(models.Plot, entity_id)

    def list_by_farm(self, farm_id: str) -> list[models.Plot]:
        return self.db.query(models.Plot).filter(models.Plot.farm_id == farm_id).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.Plot]:
        return self.db.query(models.Plot).offset(skip).limit(limit).all()

    def create(self, entity: models.Plot) -> models.Plot:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.Plot) -> models.Plot:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class ISoilAnalysisRepository(IRepository[models.SoilAnalysis]):
    @abstractmethod
    def list_by_plot(self, plot_id: str) -> list[models.SoilAnalysis]:
        ...


class SQLAlchemySoilAnalysisRepository(ISoilAnalysisRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.SoilAnalysis]:
        return self.db.get(models.SoilAnalysis, entity_id)

    def list_by_plot(self, plot_id: str) -> list[models.SoilAnalysis]:
        return self.db.query(models.SoilAnalysis).filter(models.SoilAnalysis.plot_id == plot_id).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.SoilAnalysis]:
        return self.db.query(models.SoilAnalysis).offset(skip).limit(limit).all()

    def create(self, entity: models.SoilAnalysis) -> models.SoilAnalysis:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.SoilAnalysis) -> models.SoilAnalysis:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IRecommendationRepository(IRepository[models.TechnicalRecommendation]):
    @abstractmethod
    def list_by_plot(self, plot_id: str) -> list[models.TechnicalRecommendation]:
        ...


class SQLAlchemyRecommendationRepository(IRecommendationRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.TechnicalRecommendation]:
        return self.db.get(models.TechnicalRecommendation, entity_id)

    def list_by_plot(self, plot_id: str) -> list[models.TechnicalRecommendation]:
        return self.db.query(models.TechnicalRecommendation).filter(
            models.TechnicalRecommendation.plot_id == plot_id
        ).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.TechnicalRecommendation]:
        return self.db.query(models.TechnicalRecommendation).offset(skip).limit(limit).all()

    def create(self, entity: models.TechnicalRecommendation) -> models.TechnicalRecommendation:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.TechnicalRecommendation) -> models.TechnicalRecommendation:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IHarvestEstimateRepository(IRepository[models.HarvestEstimate]):
    @abstractmethod
    def list_by_plot(self, plot_id: str) -> list[models.HarvestEstimate]:
        ...


class SQLAlchemyHarvestEstimateRepository(IHarvestEstimateRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.HarvestEstimate]:
        return self.db.get(models.HarvestEstimate, entity_id)

    def list_by_plot(self, plot_id: str) -> list[models.HarvestEstimate]:
        return self.db.query(models.HarvestEstimate).filter(
            models.HarvestEstimate.plot_id == plot_id
        ).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.HarvestEstimate]:
        return self.db.query(models.HarvestEstimate).offset(skip).limit(limit).all()

    def create(self, entity: models.HarvestEstimate) -> models.HarvestEstimate:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.HarvestEstimate) -> models.HarvestEstimate:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IWeatherLogRepository(IRepository[models.WeatherLog]):
    @abstractmethod
    def list_by_farm(self, farm_id: str) -> list[models.WeatherLog]:
        ...


class SQLAlchemyWeatherLogRepository(IWeatherLogRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.WeatherLog]:
        return self.db.get(models.WeatherLog, entity_id)

    def list_by_farm(self, farm_id: str) -> list[models.WeatherLog]:
        return self.db.query(models.WeatherLog).filter(models.WeatherLog.farm_id == farm_id).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.WeatherLog]:
        return self.db.query(models.WeatherLog).offset(skip).limit(limit).all()

    def create(self, entity: models.WeatherLog) -> models.WeatherLog:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.WeatherLog) -> models.WeatherLog:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IAlertRepository(IRepository[models.SystemAlert]):
    @abstractmethod
    def list_by_farm(self, farm_id: str, unread_only: bool) -> list[models.SystemAlert]:
        ...


class SQLAlchemyAlertRepository(IAlertRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.SystemAlert]:
        return self.db.get(models.SystemAlert, entity_id)

    def list_by_farm(self, farm_id: str, unread_only: bool = False) -> list[models.SystemAlert]:
        q = self.db.query(models.SystemAlert).filter(models.SystemAlert.farm_id == farm_id)
        if unread_only:
            q = q.filter(models.SystemAlert.is_read == False)
        return q.all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.SystemAlert]:
        return self.db.query(models.SystemAlert).offset(skip).limit(limit).all()

    def create(self, entity: models.SystemAlert) -> models.SystemAlert:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.SystemAlert) -> models.SystemAlert:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class ISupplyRepository(IRepository[models.AgriculturalSupply]):
    @abstractmethod
    def list_by_category(self, category: models.SupplyCategory) -> list[models.AgriculturalSupply]:
        ...


class SQLAlchemySupplyRepository(ISupplyRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.AgriculturalSupply]:
        return self.db.get(models.AgriculturalSupply, entity_id)

    def list_by_category(self, category: models.SupplyCategory) -> list[models.AgriculturalSupply]:
        return self.db.query(models.AgriculturalSupply).filter(
            models.AgriculturalSupply.category == category
        ).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.AgriculturalSupply]:
        return self.db.query(models.AgriculturalSupply).offset(skip).limit(limit).all()

    def create(self, entity: models.AgriculturalSupply) -> models.AgriculturalSupply:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.AgriculturalSupply) -> models.AgriculturalSupply:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IActivityRepository(IRepository[models.AgriculturalActivity]):
    @abstractmethod
    def list_by_plot(self, plot_id: str) -> list[models.AgriculturalActivity]:
        ...


class SQLAlchemyActivityRepository(IActivityRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.AgriculturalActivity]:
        return self.db.get(models.AgriculturalActivity, entity_id)

    def list_by_plot(self, plot_id: str) -> list[models.AgriculturalActivity]:
        return self.db.query(models.AgriculturalActivity).filter(
            models.AgriculturalActivity.plot_id == plot_id
        ).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.AgriculturalActivity]:
        return self.db.query(models.AgriculturalActivity).offset(skip).limit(limit).all()

    def create(self, entity: models.AgriculturalActivity) -> models.AgriculturalActivity:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.AgriculturalActivity) -> models.AgriculturalActivity:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IBatchRepository(IRepository[models.TraceabilityBatch]):
    @abstractmethod
    def get_by_code(self, batch_code: str) -> Optional[models.TraceabilityBatch]:
        ...

    @abstractmethod
    def list_by_plot(self, plot_id: str) -> list[models.TraceabilityBatch]:
        ...


class SQLAlchemyBatchRepository(IBatchRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.TraceabilityBatch]:
        return self.db.get(models.TraceabilityBatch, entity_id)

    def get_by_code(self, batch_code: str) -> Optional[models.TraceabilityBatch]:
        return self.db.query(models.TraceabilityBatch).filter(
            models.TraceabilityBatch.batch_code == batch_code
        ).first()

    def list_by_plot(self, plot_id: str) -> list[models.TraceabilityBatch]:
        return self.db.query(models.TraceabilityBatch).filter(
            models.TraceabilityBatch.plot_id == plot_id
        ).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.TraceabilityBatch]:
        return self.db.query(models.TraceabilityBatch).offset(skip).limit(limit).all()

    def create(self, entity: models.TraceabilityBatch) -> models.TraceabilityBatch:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.TraceabilityBatch) -> models.TraceabilityBatch:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IPhaseRepository(ABC):
    @abstractmethod
    def get_by_batch(self, batch_id: str):
        ...

    @abstractmethod
    def create(self, entity) -> object:
        ...

    @abstractmethod
    def update(self, entity) -> object:
        ...

    @abstractmethod
    def delete(self, batch_id: str) -> bool:
        ...


class _SQLAlchemyPhaseRepository(IPhaseRepository):
    _model_class = None

    def __init__(self, db: Session):
        self.db = db

    def get_by_batch(self, batch_id: str):
        return self.db.get(self._model_class, batch_id)

    def create(self, entity) -> object:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity) -> object:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, batch_id: str) -> bool:
        obj = self.get_by_batch(batch_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class SQLAlchemyWasherPhaseRepository(_SQLAlchemyPhaseRepository):
    _model_class = models.WasherPhase


class SQLAlchemyPatioPhaseRepository(_SQLAlchemyPhaseRepository):
    _model_class = models.PatioPhase


class SQLAlchemyDryerPhaseRepository(_SQLAlchemyPhaseRepository):
    _model_class = models.DryerPhase


class SQLAlchemySiloPhaseRepository(_SQLAlchemyPhaseRepository):
    _model_class = models.SiloPhase


class SQLAlchemyProcessingPhaseRepository(_SQLAlchemyPhaseRepository):
    _model_class = models.ProcessingPhase


class ISaleRepository(IRepository[models.Sale]):
    @abstractmethod
    def get_by_batch(self, batch_id: str) -> Optional[models.Sale]:
        ...


class SQLAlchemySaleRepository(ISaleRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.Sale]:
        return self.db.get(models.Sale, entity_id)

    def get_by_batch(self, batch_id: str) -> Optional[models.Sale]:
        return self.db.query(models.Sale).filter(models.Sale.batch_id == batch_id).first()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.Sale]:
        return self.db.query(models.Sale).offset(skip).limit(limit).all()

    def create(self, entity: models.Sale) -> models.Sale:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.Sale) -> models.Sale:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class IFinancialTransactionRepository(IRepository[models.FinancialTransaction]):
    @abstractmethod
    def list_by_farm(self, farm_id: str) -> list[models.FinancialTransaction]:
        ...


class SQLAlchemyFinancialTransactionRepository(IFinancialTransactionRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.FinancialTransaction]:
        return self.db.get(models.FinancialTransaction, entity_id)

    def list_by_farm(self, farm_id: str) -> list[models.FinancialTransaction]:
        return self.db.query(models.FinancialTransaction).filter(
            models.FinancialTransaction.farm_id == farm_id
        ).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.FinancialTransaction]:
        return self.db.query(models.FinancialTransaction).offset(skip).limit(limit).all()

    def create(self, entity: models.FinancialTransaction) -> models.FinancialTransaction:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.FinancialTransaction) -> models.FinancialTransaction:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


# ── Coffee Tracking ────────────────────────────────────────────────────────────

class ICoffeeTrackingRepository(IRepository[models.CoffeeTracking]):
    @abstractmethod
    def get_by_code(self, tracking_code: str) -> Optional[models.CoffeeTracking]:
        ...

    @abstractmethod
    def list_by_status(self, status: models.TrackingStatus, skip: int = 0, limit: int = 100) -> list[models.CoffeeTracking]:
        ...

    @abstractmethod
    def next_tracking_code(self) -> str:
        ...


class SQLAlchemyCoffeeTrackingRepository(ICoffeeTrackingRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[models.CoffeeTracking]:
        return self.db.get(models.CoffeeTracking, entity_id)

    def get_by_code(self, tracking_code: str) -> Optional[models.CoffeeTracking]:
        return self.db.query(models.CoffeeTracking).filter(
            models.CoffeeTracking.tracking_code == tracking_code
        ).first()

    def list_by_status(self, status: models.TrackingStatus, skip: int = 0, limit: int = 100) -> list[models.CoffeeTracking]:
        return self.db.query(models.CoffeeTracking).filter(
            models.CoffeeTracking.status == status
        ).order_by(models.CoffeeTracking.updated_at.desc()).offset(skip).limit(limit).all()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[models.CoffeeTracking]:
        return self.db.query(models.CoffeeTracking).order_by(
            models.CoffeeTracking.updated_at.desc()
        ).offset(skip).limit(limit).all()

    def next_tracking_code(self) -> str:
        from datetime import datetime as _dt
        year = _dt.utcnow().year
        prefix = f"GB-{year}-"
        last = self.db.query(models.CoffeeTracking).filter(
            models.CoffeeTracking.tracking_code.like(f"{prefix}%")
        ).order_by(models.CoffeeTracking.tracking_code.desc()).first()
        if last:
            seq = int(last.tracking_code.split("-")[-1]) + 1
        else:
            seq = 1
        return f"{prefix}{seq:04d}"

    def create(self, entity: models.CoffeeTracking) -> models.CoffeeTracking:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: models.CoffeeTracking) -> models.CoffeeTracking:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class ITrackingEventRepository(ABC):
    @abstractmethod
    def list_by_tracking(self, tracking_id: str) -> list[models.TrackingEvent]:
        ...

    @abstractmethod
    def create(self, entity: models.TrackingEvent) -> models.TrackingEvent:
        ...


class SQLAlchemyTrackingEventRepository(ITrackingEventRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_by_tracking(self, tracking_id: str) -> list[models.TrackingEvent]:
        return self.db.query(models.TrackingEvent).filter(
            models.TrackingEvent.tracking_id == tracking_id
        ).order_by(models.TrackingEvent.recorded_at).all()

    def create(self, entity: models.TrackingEvent) -> models.TrackingEvent:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity


# ── Domínio de Custo ─────────────────────────────────────────────────────────
# Base CRUD genérica: elimina a repetição de get/list/create/update/delete que
# os repositórios acima trazem um a um. Cada repo novo só declara o `model` e os
# filtros específicos. (Retrofit dos repos antigos p/ esta base = follow-up.)

ModelT = TypeVar("ModelT")


class SQLAlchemyCRUDRepository(Generic[ModelT]):
    model: type = None

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[ModelT]:
        return self.db.get(self.model, entity_id)

    def list_all(self, skip: int = 0, limit: int = 100) -> list[ModelT]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, entity: ModelT) -> ModelT:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: ModelT) -> ModelT:
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: str) -> bool:
        obj = self.get_by_id(entity_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True


class SQLAlchemySeasonRepository(SQLAlchemyCRUDRepository[models.Season]):
    model = models.Season

    def get_by_name(self, name: str) -> Optional[models.Season]:
        return self.db.query(models.Season).filter(models.Season.name == name).first()


class SQLAlchemyPlotVarietyRepository(SQLAlchemyCRUDRepository[models.PlotVariety]):
    model = models.PlotVariety

    def list_by_plot(self, plot_id: str) -> list[models.PlotVariety]:
        return self.db.query(models.PlotVariety).filter(models.PlotVariety.plot_id == plot_id).all()


class SQLAlchemyProductionRepository(SQLAlchemyCRUDRepository[models.Production]):
    model = models.Production

    def list_by_plot(self, plot_id: str) -> list[models.Production]:
        return self.db.query(models.Production).filter(models.Production.plot_id == plot_id).all()

    def get_by_plot_season(self, plot_id: str, season_id: str) -> Optional[models.Production]:
        return self.db.query(models.Production).filter(
            models.Production.plot_id == plot_id,
            models.Production.season_id == season_id,
        ).first()


class SQLAlchemyMachineRepository(SQLAlchemyCRUDRepository[models.Machine]):
    model = models.Machine

    def list_by_farm(self, farm_id: str) -> list[models.Machine]:
        return self.db.query(models.Machine).filter(models.Machine.farm_id == farm_id).all()


class SQLAlchemyWorkerRepository(SQLAlchemyCRUDRepository[models.Worker]):
    model = models.Worker

    def list_by_farm(self, farm_id: str) -> list[models.Worker]:
        return self.db.query(models.Worker).filter(models.Worker.farm_id == farm_id).all()


class SQLAlchemyServiceDefinitionRepository(SQLAlchemyCRUDRepository[models.ServiceDefinition]):
    model = models.ServiceDefinition

    def list_by_farm(self, farm_id: str) -> list[models.ServiceDefinition]:
        return self.db.query(models.ServiceDefinition).filter(
            models.ServiceDefinition.farm_id == farm_id
        ).all()


class SQLAlchemyMachineUsageRepository(SQLAlchemyCRUDRepository[models.MachineUsage]):
    model = models.MachineUsage

    def list_by_activity(self, activity_id: str) -> list[models.MachineUsage]:
        return self.db.query(models.MachineUsage).filter(
            models.MachineUsage.activity_id == activity_id
        ).all()


class SQLAlchemyLaborEntryRepository(SQLAlchemyCRUDRepository[models.LaborEntry]):
    model = models.LaborEntry

    def list_by_activity(self, activity_id: str) -> list[models.LaborEntry]:
        return self.db.query(models.LaborEntry).filter(
            models.LaborEntry.activity_id == activity_id
        ).all()


class SQLAlchemyActivitySupplyRepository:
    """ActivitySupply tem PK composta (activity_id, supply_id) — não usa a base genérica."""
    def __init__(self, db: Session):
        self.db = db

    def list_by_activity(self, activity_id: str) -> list[models.ActivitySupply]:
        return self.db.query(models.ActivitySupply).filter(
            models.ActivitySupply.activity_id == activity_id
        ).all()

    def get(self, activity_id: str, supply_id: str) -> Optional[models.ActivitySupply]:
        return self.db.get(models.ActivitySupply, (activity_id, supply_id))

    def create(self, entity: models.ActivitySupply) -> models.ActivitySupply:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, activity_id: str, supply_id: str) -> bool:
        obj = self.get(activity_id, supply_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True

