from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
import uuid

from .models import (
    UserRole, PlotStatus, RecommendationStatus, SupplyCategory,
    ActivityType, ActivityStatus, CoffeeType,
    TransactionType, TransactionCategory, TransactionStatus, AlertType,
    TrackingStatus, TrackingStage,
    WorkerType, LaborType,
)


class OrmBase(BaseModel):
    model_config = {"from_attributes": True}


class UserCreate(OrmBase):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole


class UserUpdate(OrmBase):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None


class UserResponse(OrmBase):
    id: str
    name: str
    email: str
    role: UserRole
    created_at: datetime


class LoginRequest(OrmBase):
    email: EmailStr
    password: str


class Token(OrmBase):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class FarmCreate(OrmBase):
    producer_id: str
    name: str = Field(..., min_length=2, max_length=255)
    total_area_ha: Decimal = Field(..., gt=0)


class FarmUpdate(OrmBase):
    name: Optional[str] = None
    total_area_ha: Optional[Decimal] = None


class FarmResponse(OrmBase):
    id: str
    producer_id: str
    name: str
    total_area_ha: Decimal


class PlotCreate(OrmBase):
    farm_id: str
    code: str = Field(..., max_length=50)
    area_ha: Decimal = Field(..., gt=0)
    variety: Optional[str] = None
    planting_year: Optional[int] = None
    altitude_m: Optional[Decimal] = None
    status: PlotStatus = PlotStatus.IN_PRODUCTION


class PlotUpdate(OrmBase):
    code: Optional[str] = None
    area_ha: Optional[Decimal] = None
    variety: Optional[str] = None
    planting_year: Optional[int] = None
    altitude_m: Optional[Decimal] = None
    status: Optional[PlotStatus] = None


class PlotResponse(OrmBase):
    id: str
    farm_id: str
    code: str
    area_ha: Decimal
    variety: Optional[str]
    planting_year: Optional[int]
    altitude_m: Optional[Decimal]
    status: PlotStatus


class SoilAnalysisCreate(OrmBase):
    plot_id: str
    collection_date: date
    ph: Optional[Decimal] = None
    organic_matter: Optional[Decimal] = None
    report_url: Optional[str] = None


class SoilAnalysisUpdate(OrmBase):
    collection_date: Optional[date] = None
    ph: Optional[Decimal] = None
    organic_matter: Optional[Decimal] = None
    report_url: Optional[str] = None


class SoilAnalysisResponse(OrmBase):
    id: str
    plot_id: str
    collection_date: date
    ph: Optional[Decimal]
    organic_matter: Optional[Decimal]
    report_url: Optional[str]


class TechnicalRecommendationCreate(OrmBase):
    agronomist_id: str
    plot_id: str
    description: str
    issue_date: date
    deadline: Optional[date] = None
    status: RecommendationStatus = RecommendationStatus.PENDING


class TechnicalRecommendationUpdate(OrmBase):
    description: Optional[str] = None
    deadline: Optional[date] = None
    status: Optional[RecommendationStatus] = None


class TechnicalRecommendationResponse(OrmBase):
    id: str
    agronomist_id: str
    plot_id: str
    description: str
    issue_date: date
    deadline: Optional[date]
    status: RecommendationStatus


class HarvestEstimateCreate(OrmBase):
    plot_id: str
    season: str = Field(..., max_length=20)
    estimated_sacks: Optional[Decimal] = None
    estimated_yield_per_ha: Optional[Decimal] = None


class HarvestEstimateUpdate(OrmBase):
    season: Optional[str] = None
    estimated_sacks: Optional[Decimal] = None
    estimated_yield_per_ha: Optional[Decimal] = None


class HarvestEstimateResponse(OrmBase):
    id: str
    plot_id: str
    season: str
    estimated_sacks: Optional[Decimal]
    estimated_yield_per_ha: Optional[Decimal]
    created_at: date


class WeatherLogCreate(OrmBase):
    farm_id: str
    log_date: date
    temperature_celsius: Optional[Decimal] = None
    precipitation_mm: Optional[Decimal] = None
    relative_humidity: Optional[Decimal] = None


class WeatherLogUpdate(OrmBase):
    temperature_celsius: Optional[Decimal] = None
    precipitation_mm: Optional[Decimal] = None
    relative_humidity: Optional[Decimal] = None


class WeatherLogResponse(OrmBase):
    id: str
    farm_id: str
    log_date: date
    temperature_celsius: Optional[Decimal]
    precipitation_mm: Optional[Decimal]
    relative_humidity: Optional[Decimal]


class SystemAlertCreate(OrmBase):
    farm_id: str
    plot_id: Optional[str] = None
    alert_type: AlertType
    message: str = Field(..., max_length=1000)


class SystemAlertUpdate(OrmBase):
    is_read: Optional[bool] = None


class SystemAlertResponse(OrmBase):
    id: str
    farm_id: str
    plot_id: Optional[str]
    alert_type: AlertType
    message: str
    is_read: bool
    created_at: datetime


class AgriculturalSupplyCreate(OrmBase):
    name: str = Field(..., max_length=255)
    category: SupplyCategory
    unit_of_measure: str = Field(..., max_length=20)
    unit_cost: Decimal = Field(..., ge=0)
    stock_quantity: Decimal = Field(default=Decimal("0"), ge=0)


class AgriculturalSupplyUpdate(OrmBase):
    name: Optional[str] = None
    unit_cost: Optional[Decimal] = None
    stock_quantity: Optional[Decimal] = None


class AgriculturalSupplyResponse(OrmBase):
    id: str
    name: str
    category: SupplyCategory
    unit_of_measure: str
    unit_cost: Decimal
    stock_quantity: Decimal


class AgriculturalActivityCreate(OrmBase):
    plot_id: str
    season_id: Optional[str] = None
    recommendation_id: Optional[str] = None
    type: ActivityType
    start_date: date
    end_date: Optional[date] = None
    status: ActivityStatus = ActivityStatus.PENDING
    worked_hours: Optional[Decimal] = None
    labor_cost: Optional[Decimal] = None


class AgriculturalActivityUpdate(OrmBase):
    season_id: Optional[str] = None
    end_date: Optional[date] = None
    status: Optional[ActivityStatus] = None
    worked_hours: Optional[Decimal] = None
    labor_cost: Optional[Decimal] = None


class AgriculturalActivityResponse(OrmBase):
    id: str
    plot_id: str
    season_id: Optional[str]
    recommendation_id: Optional[str]
    type: ActivityType
    start_date: date
    end_date: Optional[date]
    status: ActivityStatus
    worked_hours: Optional[Decimal]
    labor_cost: Optional[Decimal]


class TraceabilityBatchCreate(OrmBase):
    plot_id: str
    harvest_season: str = Field(..., max_length=20)
    batch_code: str = Field(..., max_length=100)
    coffee_type: CoffeeType
    harvest_date: date
    total_volume_measures: Decimal = Field(..., gt=0)
    cupping_score: Optional[Decimal] = None
    quality_classification: Optional[str] = None
    cupping_notes: Optional[str] = None


class TraceabilityBatchUpdate(OrmBase):
    harvest_season: Optional[str] = None
    coffee_type: Optional[CoffeeType] = None
    total_volume_measures: Optional[Decimal] = None
    cupping_score: Optional[Decimal] = None
    quality_classification: Optional[str] = None
    cupping_notes: Optional[str] = None


class TraceabilityBatchResponse(OrmBase):
    id: str
    plot_id: str
    harvest_season: str
    batch_code: str
    coffee_type: CoffeeType
    harvest_date: date
    total_volume_measures: Decimal
    cupping_score: Optional[Decimal]
    quality_classification: Optional[str]
    cupping_notes: Optional[str]


class WasherPhaseCreate(OrmBase):
    batch_id: str
    processing_date: date
    separated_measures: Optional[Decimal] = None


class WasherPhaseResponse(OrmBase):
    batch_id: str
    processing_date: date
    separated_measures: Optional[Decimal]


class PatioPhaseCreate(OrmBase):
    batch_id: str
    entry_date: date
    exit_date: Optional[date] = None
    exposure_days: Optional[int] = None
    exit_humidity: Optional[Decimal] = None


class PatioPhaseUpdate(OrmBase):
    exit_date: Optional[date] = None
    exposure_days: Optional[int] = None
    exit_humidity: Optional[Decimal] = None


class PatioPhaseResponse(OrmBase):
    batch_id: str
    entry_date: date
    exit_date: Optional[date]
    exposure_days: Optional[int]
    exit_humidity: Optional[Decimal]


class DryerPhaseCreate(OrmBase):
    batch_id: str
    equipment_identification: Optional[str] = None
    drying_date: date
    usage_hours: Optional[Decimal] = None
    final_humidity: Optional[Decimal] = None


class DryerPhaseUpdate(OrmBase):
    usage_hours: Optional[Decimal] = None
    final_humidity: Optional[Decimal] = None


class DryerPhaseResponse(OrmBase):
    batch_id: str
    equipment_identification: Optional[str]
    drying_date: date
    usage_hours: Optional[Decimal]
    final_humidity: Optional[Decimal]


class SiloPhaseCreate(OrmBase):
    batch_id: str
    silo_identification: Optional[str] = None
    entry_date: date
    storage_days: Optional[int] = None


class SiloPhaseUpdate(OrmBase):
    storage_days: Optional[int] = None


class SiloPhaseResponse(OrmBase):
    batch_id: str
    silo_identification: Optional[str]
    entry_date: date
    storage_days: Optional[int]


class ProcessingPhaseCreate(OrmBase):
    batch_id: str
    processing_hours: Optional[Decimal] = None
    beverage_classification: Optional[str] = None
    bc_weight_kg: Optional[Decimal] = None
    escolha_weight_kg: Optional[Decimal] = None
    fundo_weight_kg: Optional[Decimal] = None


class ProcessingPhaseUpdate(OrmBase):
    processing_hours: Optional[Decimal] = None
    beverage_classification: Optional[str] = None
    bc_weight_kg: Optional[Decimal] = None
    escolha_weight_kg: Optional[Decimal] = None
    fundo_weight_kg: Optional[Decimal] = None


class ProcessingPhaseResponse(OrmBase):
    batch_id: str
    processing_hours: Optional[Decimal]
    beverage_classification: Optional[str]
    bc_weight_kg: Optional[Decimal]
    escolha_weight_kg: Optional[Decimal]
    fundo_weight_kg: Optional[Decimal]


class SaleCreate(OrmBase):
    batch_id: str
    shipment_invoice: Optional[str] = None
    destination_warehouse: Optional[str] = None
    sale_invoice: Optional[str] = None
    sale_date: date
    customer: str = Field(..., max_length=255)
    total_value: Decimal = Field(..., gt=0)


class SaleUpdate(OrmBase):
    shipment_invoice: Optional[str] = None
    destination_warehouse: Optional[str] = None
    sale_invoice: Optional[str] = None
    customer: Optional[str] = None
    total_value: Optional[Decimal] = None


class SaleResponse(OrmBase):
    id: str
    batch_id: str
    shipment_invoice: Optional[str]
    destination_warehouse: Optional[str]
    sale_invoice: Optional[str]
    sale_date: date
    customer: str
    total_value: Decimal


class FinancialTransactionCreate(OrmBase):
    farm_id: str
    type: TransactionType
    category: TransactionCategory
    amount: Decimal = Field(..., gt=0)
    due_date: date
    payment_date: Optional[date] = None
    status: TransactionStatus = TransactionStatus.PENDING


class FinancialTransactionUpdate(OrmBase):
    payment_date: Optional[date] = None
    status: Optional[TransactionStatus] = None
    amount: Optional[Decimal] = None


class FinancialTransactionResponse(OrmBase):
    id: str
    farm_id: str
    type: TransactionType
    category: TransactionCategory
    amount: Decimal
    due_date: date
    payment_date: Optional[date]
    status: TransactionStatus


# ── Coffee Tracking ────────────────────────────────────────────────────────────

class TrackingEventResponse(OrmBase):
    id: str
    tracking_id: str
    stage: TrackingStage
    notes: Optional[str]
    recorded_by: Optional[str]
    recorded_at: datetime


class CoffeeTrackingCreate(OrmBase):
    batch_id: str
    description: str = Field(..., min_length=2)


class CoffeeTrackingUpdate(OrmBase):
    description: Optional[str] = None
    status: Optional[TrackingStatus] = None


class CoffeeTrackingListResponse(OrmBase):
    id: str
    tracking_code: str
    batch_id: str
    description: str
    current_stage: TrackingStage
    status: TrackingStatus
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]


class CoffeeTrackingResponse(CoffeeTrackingListResponse):
    events: list[TrackingEventResponse] = []


class TrackingEventCreate(OrmBase):
    stage: TrackingStage
    notes: Optional[str] = Field(None, max_length=2000)  # cap: rota pública de escrita
    recorded_by: Optional[str] = None


# ── Domínio de Custo (talhão × safra) ────────────────────────────────────────

class PlotVarietyCreate(OrmBase):
    plot_id: str
    variety: str = Field(..., max_length=100)
    planting_year: Optional[int] = None
    area_ha: Optional[Decimal] = None


class PlotVarietyUpdate(OrmBase):
    variety: Optional[str] = None
    planting_year: Optional[int] = None
    area_ha: Optional[Decimal] = None


class PlotVarietyResponse(OrmBase):
    id: str
    plot_id: str
    variety: str
    planting_year: Optional[int]
    area_ha: Optional[Decimal]


class SeasonCreate(OrmBase):
    name: str = Field(..., max_length=20)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SeasonUpdate(OrmBase):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SeasonResponse(OrmBase):
    id: str
    name: str
    start_date: Optional[date]
    end_date: Optional[date]


class ProductionCreate(OrmBase):
    plot_id: str
    season_id: str
    sacks_produced: Decimal = Field(..., ge=0)
    harvest_date: Optional[date] = None
    notes: Optional[str] = None


class ProductionUpdate(OrmBase):
    sacks_produced: Optional[Decimal] = None
    harvest_date: Optional[date] = None
    notes: Optional[str] = None


class ProductionResponse(OrmBase):
    id: str
    plot_id: str
    season_id: str
    sacks_produced: Decimal
    harvest_date: Optional[date]
    notes: Optional[str]


class MachineCreate(OrmBase):
    farm_id: str
    name: str = Field(..., max_length=255)
    hourly_cost: Decimal = Field(..., ge=0)


class MachineUpdate(OrmBase):
    name: Optional[str] = None
    hourly_cost: Optional[Decimal] = None


class MachineResponse(OrmBase):
    id: str
    farm_id: str
    name: str
    hourly_cost: Decimal


class WorkerCreate(OrmBase):
    farm_id: str
    name: str = Field(..., max_length=255)
    type: WorkerType
    daily_rate: Optional[Decimal] = None


class WorkerUpdate(OrmBase):
    name: Optional[str] = None
    type: Optional[WorkerType] = None
    daily_rate: Optional[Decimal] = None


class WorkerResponse(OrmBase):
    id: str
    farm_id: str
    name: str
    type: WorkerType
    daily_rate: Optional[Decimal]


class ServiceDefinitionCreate(OrmBase):
    farm_id: str
    name: str = Field(..., max_length=255)
    unit_description: Optional[str] = None
    unit_value: Decimal = Field(..., ge=0)


class ServiceDefinitionUpdate(OrmBase):
    name: Optional[str] = None
    unit_description: Optional[str] = None
    unit_value: Optional[Decimal] = None


class ServiceDefinitionResponse(OrmBase):
    id: str
    farm_id: str
    name: str
    unit_description: Optional[str]
    unit_value: Decimal


# ── Lançamentos ligados a uma atividade (insumo / mão de obra / máquina) ──────

class ActivitySupplyCreate(OrmBase):
    supply_id: str
    applied_quantity: Decimal = Field(..., gt=0)
    # total_cost é opcional: se omitido, o backend calcula qtd × unit_cost do insumo.
    total_cost: Optional[Decimal] = None


class ActivitySupplyResponse(OrmBase):
    activity_id: str
    supply_id: str
    applied_quantity: Decimal
    total_cost: Decimal


class MachineUsageCreate(OrmBase):
    machine_id: str
    hours: Decimal = Field(..., gt=0)


class MachineUsageResponse(OrmBase):
    id: str
    activity_id: str
    machine_id: str
    hours: Decimal


class LaborEntryCreate(OrmBase):
    labor_type: LaborType
    worker_id: Optional[str] = None
    service_definition_id: Optional[str] = None
    quantity: Decimal = Field(..., gt=0)
    # unit_value opcional: se omitido, usa worker.daily_rate (DIARIA) ou
    # service_definition.unit_value (SERVICO).
    unit_value: Optional[Decimal] = None


class LaborEntryResponse(OrmBase):
    id: str
    activity_id: str
    labor_type: LaborType
    worker_id: Optional[str]
    service_definition_id: Optional[str]
    quantity: Decimal
    unit_value: Optional[Decimal]


# ── Respostas de custo (calculadas on-the-fly) ───────────────────────────────

class ActivityCostBreakdown(OrmBase):
    activity_id: str
    supplies_cost: Decimal
    labor_cost: Decimal
    machine_cost: Decimal
    total_cost: Decimal


class PlotSeasonCost(OrmBase):
    plot_id: str
    season_id: str
    area_ha: Decimal
    supplies_cost: Decimal
    labor_cost: Decimal
    machine_cost: Decimal
    total_cost: Decimal
    cost_per_hectare: Optional[Decimal]        # total ÷ área
    sacks_produced: Optional[Decimal]
    cost_per_sack: Optional[Decimal]           # total ÷ sacas produzidas
    revenue: Decimal
    gross_profit: Decimal                       # receita − custo
    activities: list[ActivityCostBreakdown] = []

