import uuid
from datetime import datetime, date
from sqlalchemy import (
    String, Integer, Numeric, Boolean, Text, Date, DateTime,
    ForeignKey, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from .database import Base


class UserRole(str, enum.Enum):
    PRODUCER = "PRODUCER"
    AGRONOMIST = "AGRONOMIST"
    OPERATOR = "OPERATOR"


class PlotStatus(str, enum.Enum):
    IN_PRODUCTION = "IN_PRODUCTION"
    RENOVATION = "RENOVATION"
    DEVELOPMENT = "DEVELOPMENT"


class RecommendationStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"


class SupplyCategory(str, enum.Enum):
    FERTILIZER = "FERTILIZER"
    PESTICIDE = "PESTICIDE"


class ActivityType(str, enum.Enum):
    FERTILIZATION = "FERTILIZATION"
    PRUNING = "PRUNING"
    HARVEST = "HARVEST"
    IRRIGATION = "IRRIGATION"
    PESTICIDE_APPLICATION = "PESTICIDE_APPLICATION"


class ActivityStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class CoffeeType(str, enum.Enum):
    NATURAL = "NATURAL"
    PULPED_NATURAL = "PULPED_NATURAL"


class TransactionType(str, enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"


class TransactionCategory(str, enum.Enum):
    SUPPLY = "SUPPLY"
    LABOR = "LABOR"
    COFFEE_SALE = "COFFEE_SALE"
    MAINTENANCE = "MAINTENANCE"


class TransactionStatus(str, enum.Enum):
    PAID = "PAID"
    PENDING = "PENDING"


class AlertType(str, enum.Enum):
    WEATHER = "WEATHER"
    AGRONOMIC = "AGRONOMIC"
    SYSTEM = "SYSTEM"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    farms: Mapped[list["Farm"]] = relationship("Farm", back_populates="producer", cascade="all, delete-orphan")
    recommendations: Mapped[list["TechnicalRecommendation"]] = relationship("TechnicalRecommendation", back_populates="agronomist")


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    producer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_area_ha: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    producer: Mapped["User"] = relationship("User", back_populates="farms")
    plots: Mapped[list["Plot"]] = relationship("Plot", back_populates="farm", cascade="all, delete-orphan")
    weather_logs: Mapped[list["WeatherLog"]] = relationship("WeatherLog", back_populates="farm", cascade="all, delete-orphan")
    system_alerts: Mapped[list["SystemAlert"]] = relationship("SystemAlert", back_populates="farm")
    financial_transactions: Mapped[list["FinancialTransaction"]] = relationship("FinancialTransaction", back_populates="farm", cascade="all, delete-orphan")


class Plot(Base):
    __tablename__ = "plots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    area_ha: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    variety: Mapped[str] = mapped_column(String(100), nullable=True)
    planting_year: Mapped[int] = mapped_column(Integer, nullable=True)
    status: Mapped[PlotStatus] = mapped_column(SAEnum(PlotStatus), nullable=False, default=PlotStatus.IN_PRODUCTION)

    farm: Mapped["Farm"] = relationship("Farm", back_populates="plots")
    soil_analyses: Mapped[list["SoilAnalysis"]] = relationship("SoilAnalysis", back_populates="plot", cascade="all, delete-orphan")
    recommendations: Mapped[list["TechnicalRecommendation"]] = relationship("TechnicalRecommendation", back_populates="plot")
    harvest_estimates: Mapped[list["HarvestEstimate"]] = relationship("HarvestEstimate", back_populates="plot", cascade="all, delete-orphan")
    system_alerts: Mapped[list["SystemAlert"]] = relationship("SystemAlert", back_populates="plot")
    activities: Mapped[list["AgriculturalActivity"]] = relationship("AgriculturalActivity", back_populates="plot", cascade="all, delete-orphan")
    traceability_batches: Mapped[list["TraceabilityBatch"]] = relationship("TraceabilityBatch", back_populates="plot", cascade="all, delete-orphan")


class SoilAnalysis(Base):
    __tablename__ = "soil_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("plots.id"), nullable=False)
    collection_date: Mapped[date] = mapped_column(Date, nullable=False)
    ph: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    organic_matter: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    report_url: Mapped[str] = mapped_column(String(500), nullable=True)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="soil_analyses")


class TechnicalRecommendation(Base):
    __tablename__ = "technical_recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agronomist_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("plots.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    deadline: Mapped[date] = mapped_column(Date, nullable=True)
    status: Mapped[RecommendationStatus] = mapped_column(SAEnum(RecommendationStatus), nullable=False, default=RecommendationStatus.PENDING)

    agronomist: Mapped["User"] = relationship("User", back_populates="recommendations")
    plot: Mapped["Plot"] = relationship("Plot", back_populates="recommendations")
    activities: Mapped[list["AgriculturalActivity"]] = relationship("AgriculturalActivity", back_populates="recommendation")


class HarvestEstimate(Base):
    __tablename__ = "harvest_estimates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("plots.id"), nullable=False)
    season: Mapped[str] = mapped_column(String(20), nullable=False)
    estimated_sacks: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    estimated_yield_per_ha: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[date] = mapped_column(Date, default=date.today)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="harvest_estimates")


class WeatherLog(Base):
    __tablename__ = "weather_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id"), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    temperature_celsius: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    precipitation_mm: Mapped[float] = mapped_column(Numeric(7, 2), nullable=True)
    relative_humidity: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)

    farm: Mapped["Farm"] = relationship("Farm", back_populates="weather_logs")


class SystemAlert(Base):
    __tablename__ = "system_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("plots.id"), nullable=True)
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id"), nullable=False)
    alert_type: Mapped[AlertType] = mapped_column(SAEnum(AlertType), nullable=False)
    message: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    farm: Mapped["Farm"] = relationship("Farm", back_populates="system_alerts")
    plot: Mapped["Plot"] = relationship("Plot", back_populates="system_alerts")


class AgriculturalSupply(Base):
    __tablename__ = "agricultural_supplies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[SupplyCategory] = mapped_column(SAEnum(SupplyCategory), nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(20), nullable=False)
    unit_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    stock_quantity: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    activity_supplies: Mapped[list["ActivitySupply"]] = relationship("ActivitySupply", back_populates="supply")


class AgriculturalActivity(Base):
    __tablename__ = "agricultural_activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("plots.id"), nullable=False)
    recommendation_id: Mapped[str] = mapped_column(String(36), ForeignKey("technical_recommendations.id"), nullable=True)
    type: Mapped[ActivityType] = mapped_column(SAEnum(ActivityType), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)
    status: Mapped[ActivityStatus] = mapped_column(SAEnum(ActivityStatus), nullable=False, default=ActivityStatus.PENDING)
    worked_hours: Mapped[float] = mapped_column(Numeric(8, 2), nullable=True)
    labor_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="activities")
    recommendation: Mapped["TechnicalRecommendation"] = relationship("TechnicalRecommendation", back_populates="activities")
    activity_supplies: Mapped[list["ActivitySupply"]] = relationship("ActivitySupply", back_populates="activity", cascade="all, delete-orphan")


class ActivitySupply(Base):
    __tablename__ = "activity_supplies"
    __table_args__ = (
        UniqueConstraint("activity_id", "supply_id", name="uq_activity_supply"),
    )

    activity_id: Mapped[str] = mapped_column(String(36), ForeignKey("agricultural_activities.id"), primary_key=True)
    supply_id: Mapped[str] = mapped_column(String(36), ForeignKey("agricultural_supplies.id"), primary_key=True)
    applied_quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    activity: Mapped["AgriculturalActivity"] = relationship("AgriculturalActivity", back_populates="activity_supplies")
    supply: Mapped["AgriculturalSupply"] = relationship("AgriculturalSupply", back_populates="activity_supplies")


class TraceabilityBatch(Base):
    __tablename__ = "traceability_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("plots.id"), nullable=False)
    harvest_season: Mapped[str] = mapped_column(String(20), nullable=False)
    batch_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    coffee_type: Mapped[CoffeeType] = mapped_column(SAEnum(CoffeeType), nullable=False)
    harvest_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_volume_measures: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="traceability_batches")
    washer_phase: Mapped["WasherPhase"] = relationship("WasherPhase", back_populates="batch", uselist=False, cascade="all, delete-orphan")
    patio_phase: Mapped["PatioPhase"] = relationship("PatioPhase", back_populates="batch", uselist=False, cascade="all, delete-orphan")
    dryer_phase: Mapped["DryerPhase"] = relationship("DryerPhase", back_populates="batch", uselist=False, cascade="all, delete-orphan")
    silo_phase: Mapped["SiloPhase"] = relationship("SiloPhase", back_populates="batch", uselist=False, cascade="all, delete-orphan")
    processing_phase: Mapped["ProcessingPhase"] = relationship("ProcessingPhase", back_populates="batch", uselist=False, cascade="all, delete-orphan")
    sale: Mapped["Sale"] = relationship("Sale", back_populates="batch", uselist=False, cascade="all, delete-orphan")


class WasherPhase(Base):
    __tablename__ = "washer_phases"

    batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("traceability_batches.id"), primary_key=True)
    processing_date: Mapped[date] = mapped_column(Date, nullable=False)
    separated_measures: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)

    batch: Mapped["TraceabilityBatch"] = relationship("TraceabilityBatch", back_populates="washer_phase")


class PatioPhase(Base):
    __tablename__ = "patio_phases"

    batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("traceability_batches.id"), primary_key=True)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    exit_date: Mapped[date] = mapped_column(Date, nullable=True)
    exposure_days: Mapped[int] = mapped_column(Integer, nullable=True)
    exit_humidity: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)

    batch: Mapped["TraceabilityBatch"] = relationship("TraceabilityBatch", back_populates="patio_phase")


class DryerPhase(Base):
    __tablename__ = "dryer_phases"

    batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("traceability_batches.id"), primary_key=True)
    equipment_identification: Mapped[str] = mapped_column(String(100), nullable=True)
    drying_date: Mapped[date] = mapped_column(Date, nullable=False)
    usage_hours: Mapped[float] = mapped_column(Numeric(8, 2), nullable=True)
    final_humidity: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)

    batch: Mapped["TraceabilityBatch"] = relationship("TraceabilityBatch", back_populates="dryer_phase")


class SiloPhase(Base):
    __tablename__ = "silo_phases"

    batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("traceability_batches.id"), primary_key=True)
    silo_identification: Mapped[str] = mapped_column(String(100), nullable=True)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    storage_days: Mapped[int] = mapped_column(Integer, nullable=True)

    batch: Mapped["TraceabilityBatch"] = relationship("TraceabilityBatch", back_populates="silo_phase")


class ProcessingPhase(Base):
    __tablename__ = "processing_phases"

    batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("traceability_batches.id"), primary_key=True)
    processing_hours: Mapped[float] = mapped_column(Numeric(8, 2), nullable=True)
    beverage_classification: Mapped[str] = mapped_column(String(100), nullable=True)
    bc_weight_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    escolha_weight_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    fundo_weight_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)

    batch: Mapped["TraceabilityBatch"] = relationship("TraceabilityBatch", back_populates="processing_phase")


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("traceability_batches.id"), unique=True, nullable=False)
    shipment_invoice: Mapped[str] = mapped_column(String(100), nullable=True)
    destination_warehouse: Mapped[str] = mapped_column(String(255), nullable=True)
    sale_invoice: Mapped[str] = mapped_column(String(100), nullable=True)
    sale_date: Mapped[date] = mapped_column(Date, nullable=False)
    customer: Mapped[str] = mapped_column(String(255), nullable=False)
    total_value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    batch: Mapped["TraceabilityBatch"] = relationship("TraceabilityBatch", back_populates="sale")


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id"), nullable=False)
    type: Mapped[TransactionType] = mapped_column(SAEnum(TransactionType), nullable=False)
    category: Mapped[TransactionCategory] = mapped_column(SAEnum(TransactionCategory), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=True)
    status: Mapped[TransactionStatus] = mapped_column(SAEnum(TransactionStatus), nullable=False, default=TransactionStatus.PENDING)

    farm: Mapped["Farm"] = relationship("Farm", back_populates="financial_transactions")
