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
    FERTILIZER = "FERTILIZER"      # adubo
    CORRECTIVE = "CORRECTIVE"      # corretivo (calcário, gesso...)
    PESTICIDE = "PESTICIDE"        # defensivo
    FUEL = "FUEL"                  # combustível (só entra no custo quando de um serviço da lavoura)


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


class WorkerType(str, enum.Enum):
    REGISTERED = "REGISTERED"      # funcionário registrado — paga por diária
    THIRD_PARTY = "THIRD_PARTY"    # terceirizado — paga por "serviço" (empreita)


class LaborType(str, enum.Enum):
    DIARIA = "DIARIA"              # nº de diárias × valor da diária
    SERVICO = "SERVICO"           # nº de serviços × valor do serviço (empreita)


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
    # variety segue como a variedade "principal" (compat); o detalhamento por
    # talhão fica em PlotVariety (SRFM: um talhão pode ter várias variedades).
    variety: Mapped[str] = mapped_column(String(100), nullable=True)
    planting_year: Mapped[int] = mapped_column(Integer, nullable=True)
    altitude_m: Mapped[float] = mapped_column(Numeric(7, 2), nullable=True)  # SRFM: altitude importa p/ qualidade
    status: Mapped[PlotStatus] = mapped_column(SAEnum(PlotStatus), nullable=False, default=PlotStatus.IN_PRODUCTION)

    farm: Mapped["Farm"] = relationship("Farm", back_populates="plots")
    soil_analyses: Mapped[list["SoilAnalysis"]] = relationship("SoilAnalysis", back_populates="plot", cascade="all, delete-orphan")
    recommendations: Mapped[list["TechnicalRecommendation"]] = relationship("TechnicalRecommendation", back_populates="plot")
    harvest_estimates: Mapped[list["HarvestEstimate"]] = relationship("HarvestEstimate", back_populates="plot", cascade="all, delete-orphan")
    system_alerts: Mapped[list["SystemAlert"]] = relationship("SystemAlert", back_populates="plot")
    activities: Mapped[list["AgriculturalActivity"]] = relationship("AgriculturalActivity", back_populates="plot", cascade="all, delete-orphan")
    traceability_batches: Mapped[list["TraceabilityBatch"]] = relationship("TraceabilityBatch", back_populates="plot", cascade="all, delete-orphan")
    varieties: Mapped[list["PlotVariety"]] = relationship("PlotVariety", back_populates="plot", cascade="all, delete-orphan")
    productions: Mapped[list["Production"]] = relationship("Production", back_populates="plot", cascade="all, delete-orphan")


class PlotVariety(Base):
    """Variedades cultivadas num talhão (SRFM). Um talhão pode ter mais de uma."""
    __tablename__ = "plot_varieties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("plots.id"), nullable=False)
    variety: Mapped[str] = mapped_column(String(100), nullable=False)
    planting_year: Mapped[int] = mapped_column(Integer, nullable=True)
    area_ha: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="varieties")


class Season(Base):
    """Safra como entidade de 1ª classe (SRFM). Eixo de granularidade do custo:
    o custo é sempre apurado por talhão × safra."""
    __tablename__ = "seasons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # ex.: "2025/2026"
    start_date: Mapped[date] = mapped_column(Date, nullable=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)

    productions: Mapped[list["Production"]] = relationship("Production", back_populates="season", cascade="all, delete-orphan")
    activities: Mapped[list["AgriculturalActivity"]] = relationship("AgriculturalActivity", back_populates="season")


class Production(Base):
    """Produção real (sacas) de um talhão numa safra — o DENOMINADOR do custo/saca."""
    __tablename__ = "productions"
    __table_args__ = (
        UniqueConstraint("plot_id", "season_id", name="uq_production_plot_season"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("plots.id"), nullable=False)
    season_id: Mapped[str] = mapped_column(String(36), ForeignKey("seasons.id"), nullable=False)
    sacks_produced: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    harvest_date: Mapped[date] = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="productions")
    season: Mapped["Season"] = relationship("Season", back_populates="productions")


class Machine(Base):
    """Máquina/implemento com custo/hora — base do apontamento de hora-máquina."""
    __tablename__ = "machines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hourly_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    farm: Mapped["Farm"] = relationship("Farm")
    usages: Mapped[list["MachineUsage"]] = relationship("MachineUsage", back_populates="machine")


class Worker(Base):
    """Trabalhador. REGISTERED paga por diária; THIRD_PARTY por serviço (empreita)."""
    __tablename__ = "workers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[WorkerType] = mapped_column(SAEnum(WorkerType), nullable=False)
    daily_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)  # valor da diária (registrado)

    farm: Mapped["Farm"] = relationship("Farm")
    labor_entries: Mapped[list["LaborEntry"]] = relationship("LaborEntry", back_populates="worker")


class ServiceDefinition(Base):
    """Definição de 'serviço'/empreita por operação (SRFM/funcional): 1 serviço = X ruas,
    valendo unit_value (referência = 1 diária). O terceiro ganha proporcional ao que produz."""
    __tablename__ = "service_definitions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)              # ex.: "Desbrota"
    unit_description: Mapped[str] = mapped_column(String(255), nullable=True)   # ex.: "1 serviço = 15 ruas"
    unit_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)   # R$ por serviço

    farm: Mapped["Farm"] = relationship("Farm")
    labor_entries: Mapped[list["LaborEntry"]] = relationship("LaborEntry", back_populates="service_definition")


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
    season_id: Mapped[str] = mapped_column(String(36), ForeignKey("seasons.id"), nullable=True)  # atribui o custo a talhão×safra
    recommendation_id: Mapped[str] = mapped_column(String(36), ForeignKey("technical_recommendations.id"), nullable=True)
    type: Mapped[ActivityType] = mapped_column(SAEnum(ActivityType), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)
    status: Mapped[ActivityStatus] = mapped_column(SAEnum(ActivityStatus), nullable=False, default=ActivityStatus.PENDING)
    worked_hours: Mapped[float] = mapped_column(Numeric(8, 2), nullable=True)
    # labor_cost legado: mantido só p/ compat. O custo de mão de obra real é
    # calculado on-the-fly a partir de labor_entries (ver app/services/costing.py).
    labor_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="activities")
    season: Mapped["Season"] = relationship("Season", back_populates="activities")
    recommendation: Mapped["TechnicalRecommendation"] = relationship("TechnicalRecommendation", back_populates="activities")
    activity_supplies: Mapped[list["ActivitySupply"]] = relationship("ActivitySupply", back_populates="activity", cascade="all, delete-orphan")
    labor_entries: Mapped[list["LaborEntry"]] = relationship("LaborEntry", back_populates="activity", cascade="all, delete-orphan")
    machine_usages: Mapped[list["MachineUsage"]] = relationship("MachineUsage", back_populates="activity", cascade="all, delete-orphan")


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


class MachineUsage(Base):
    """Apontamento de hora-máquina numa atividade. Custo = hours × machine.hourly_cost
    (calculado on-the-fly; nada de total gravado, exceto a snapshot opcional abaixo)."""
    __tablename__ = "machine_usages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_id: Mapped[str] = mapped_column(String(36), ForeignKey("agricultural_activities.id"), nullable=False)
    machine_id: Mapped[str] = mapped_column(String(36), ForeignKey("machines.id"), nullable=False)
    hours: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)

    activity: Mapped["AgriculturalActivity"] = relationship("AgriculturalActivity", back_populates="machine_usages")
    machine: Mapped["Machine"] = relationship("Machine", back_populates="usages")


class LaborEntry(Base):
    """Apontamento de mão de obra numa atividade.
    - DIARIA:  quantity = nº de diárias; custo = quantity × (unit_value ou worker.daily_rate)
    - SERVICO: quantity = nº de serviços; custo = quantity × (unit_value ou service_definition.unit_value)
    unit_value é uma snapshot opcional do valor no momento do apontamento (histórico)."""
    __tablename__ = "labor_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_id: Mapped[str] = mapped_column(String(36), ForeignKey("agricultural_activities.id"), nullable=False)
    labor_type: Mapped[LaborType] = mapped_column(SAEnum(LaborType), nullable=False)
    worker_id: Mapped[str] = mapped_column(String(36), ForeignKey("workers.id"), nullable=True)
    service_definition_id: Mapped[str] = mapped_column(String(36), ForeignKey("service_definitions.id"), nullable=True)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)  # nº de diárias ou de serviços
    unit_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)  # snapshot; se nulo, usa a taxa da referência

    activity: Mapped["AgriculturalActivity"] = relationship("AgriculturalActivity", back_populates="labor_entries")
    worker: Mapped["Worker"] = relationship("Worker", back_populates="labor_entries")
    service_definition: Mapped["ServiceDefinition"] = relationship("ServiceDefinition", back_populates="labor_entries")


class TraceabilityBatch(Base):
    __tablename__ = "traceability_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plot_id: Mapped[str] = mapped_column(String(36), ForeignKey("plots.id"), nullable=False)
    harvest_season: Mapped[str] = mapped_column(String(20), nullable=False)
    batch_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    coffee_type: Mapped[CoffeeType] = mapped_column(SAEnum(CoffeeType), nullable=False)
    harvest_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_volume_measures: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    # Qualidade/cupping (SRFM) — sustenta a narrativa de procedência premium no QR.
    cupping_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)          # pontuação SCA 0–100
    quality_classification: Mapped[str] = mapped_column(String(100), nullable=True)     # ex.: "Especial", "Bebida Dura"
    cupping_notes: Mapped[str] = mapped_column(Text, nullable=True)                       # notas sensoriais

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


class TrackingStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class TrackingStage(str, enum.Enum):
    COLHEITA = "COLHEITA"
    LAVADOR = "LAVADOR"
    TERREIRO = "TERREIRO"
    SECADOR = "SECADOR"
    TULHA = "TULHA"
    BENEFICIAMENTO = "BENEFICIAMENTO"
    CLASSIFICACAO = "CLASSIFICACAO"
    COMERCIALIZACAO = "COMERCIALIZACAO"
    FINALIZADO = "FINALIZADO"


class CoffeeTracking(Base):
    __tablename__ = "coffee_trackings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tracking_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("traceability_batches.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    current_stage: Mapped[TrackingStage] = mapped_column(SAEnum(TrackingStage), nullable=False, default=TrackingStage.COLHEITA)
    status: Mapped[TrackingStatus] = mapped_column(SAEnum(TrackingStatus), nullable=False, default=TrackingStatus.IN_PROGRESS)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    batch: Mapped["TraceabilityBatch"] = relationship("TraceabilityBatch")
    events: Mapped[list["TrackingEvent"]] = relationship("TrackingEvent", back_populates="tracking", cascade="all, delete-orphan", order_by="TrackingEvent.recorded_at")


class TrackingEvent(Base):
    __tablename__ = "tracking_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tracking_id: Mapped[str] = mapped_column(String(36), ForeignKey("coffee_trackings.id"), nullable=False)
    stage: Mapped[TrackingStage] = mapped_column(SAEnum(TrackingStage), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    recorded_by: Mapped[str] = mapped_column(String(255), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tracking: Mapped["CoffeeTracking"] = relationship("CoffeeTracking", back_populates="events")

