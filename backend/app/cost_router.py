"""
cost_router.py — Endpoints do domínio de custo (talhão × safra).

Agrupa as entidades novas do MVP robusto: safras, produção (sacas), máquinas,
trabalhadores, definições de serviço/empreita, variedades por talhão e os
lançamentos ligados a uma atividade (insumo / mão de obra / hora-máquina).

O cálculo de custo em si (custo/ha, custo/saca, lucro bruto) é feito on-the-fly
em app/services/costing.py e exposto pelos endpoints de agregação no fim.
"""
import uuid
from decimal import Decimal
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from . import models, schemas
from .database import get_db
from .services import costing
from .dependencies import (
    get_season_repo, get_plot_variety_repo, get_production_repo,
    get_machine_repo, get_worker_repo, get_service_definition_repo,
    get_machine_usage_repo, get_labor_entry_repo, get_activity_supply_repo,
    get_activity_repo, get_plot_repo, get_supply_repo,
)
from .repositories import (
    SQLAlchemySeasonRepository, SQLAlchemyPlotVarietyRepository,
    SQLAlchemyProductionRepository, SQLAlchemyMachineRepository,
    SQLAlchemyWorkerRepository, SQLAlchemyServiceDefinitionRepository,
    SQLAlchemyMachineUsageRepository, SQLAlchemyLaborEntryRepository,
    SQLAlchemyActivitySupplyRepository,
    IActivityRepository, IPlotRepository, ISupplyRepository,
)

router = APIRouter()


def _404(entity: str, entity_id: str):
    raise HTTPException(status_code=404, detail=f"{entity} '{entity_id}' não encontrado.")


def _require_activity(repo: IActivityRepository, activity_id: str) -> models.AgriculturalActivity:
    obj = repo.get_by_id(activity_id)
    if not obj:
        _404("Atividade", activity_id)
    return obj


# ── Safras ───────────────────────────────────────────────────────────────────

@router.post("/seasons", response_model=schemas.SeasonResponse, status_code=201, tags=["Safras"])
def create_season(
    payload: schemas.SeasonCreate,
    repo: Annotated[SQLAlchemySeasonRepository, Depends(get_season_repo)],
):
    if repo.get_by_name(payload.name):
        raise HTTPException(status_code=409, detail=f"Safra '{payload.name}' já existe.")
    obj = models.Season(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@router.get("/seasons", response_model=list[schemas.SeasonResponse], tags=["Safras"])
def list_seasons(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[SQLAlchemySeasonRepository, Depends(get_season_repo)] = None,
):
    return repo.list_all(skip=skip, limit=limit)


@router.get("/seasons/{season_id}", response_model=schemas.SeasonResponse, tags=["Safras"])
def get_season(season_id: str, repo: Annotated[SQLAlchemySeasonRepository, Depends(get_season_repo)]):
    obj = repo.get_by_id(season_id)
    if not obj:
        _404("Safra", season_id)
    return obj


@router.patch("/seasons/{season_id}", response_model=schemas.SeasonResponse, tags=["Safras"])
def update_season(
    season_id: str,
    payload: schemas.SeasonUpdate,
    repo: Annotated[SQLAlchemySeasonRepository, Depends(get_season_repo)],
):
    obj = repo.get_by_id(season_id)
    if not obj:
        _404("Safra", season_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@router.delete("/seasons/{season_id}", status_code=204, tags=["Safras"])
def delete_season(season_id: str, repo: Annotated[SQLAlchemySeasonRepository, Depends(get_season_repo)]):
    if not repo.delete(season_id):
        _404("Safra", season_id)


# ── Produção (talhão × safra → sacas) ─────────────────────────────────────────

@router.post("/productions", response_model=schemas.ProductionResponse, status_code=201, tags=["Produção"])
def create_production(
    payload: schemas.ProductionCreate,
    repo: Annotated[SQLAlchemyProductionRepository, Depends(get_production_repo)],
):
    if repo.get_by_plot_season(payload.plot_id, payload.season_id):
        raise HTTPException(status_code=409, detail="Já existe produção para este talhão nesta safra.")
    obj = models.Production(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@router.get("/productions", response_model=list[schemas.ProductionResponse], tags=["Produção"])
def list_productions(
    plot_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[SQLAlchemyProductionRepository, Depends(get_production_repo)] = None,
):
    if plot_id:
        return repo.list_by_plot(plot_id)
    return repo.list_all(skip=skip, limit=limit)


@router.get("/productions/{production_id}", response_model=schemas.ProductionResponse, tags=["Produção"])
def get_production(production_id: str, repo: Annotated[SQLAlchemyProductionRepository, Depends(get_production_repo)]):
    obj = repo.get_by_id(production_id)
    if not obj:
        _404("Produção", production_id)
    return obj


@router.patch("/productions/{production_id}", response_model=schemas.ProductionResponse, tags=["Produção"])
def update_production(
    production_id: str,
    payload: schemas.ProductionUpdate,
    repo: Annotated[SQLAlchemyProductionRepository, Depends(get_production_repo)],
):
    obj = repo.get_by_id(production_id)
    if not obj:
        _404("Produção", production_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@router.delete("/productions/{production_id}", status_code=204, tags=["Produção"])
def delete_production(production_id: str, repo: Annotated[SQLAlchemyProductionRepository, Depends(get_production_repo)]):
    if not repo.delete(production_id):
        _404("Produção", production_id)


# ── Máquinas ───────────────────────────────────────────────────────────────

@router.post("/machines", response_model=schemas.MachineResponse, status_code=201, tags=["Máquinas"])
def create_machine(
    payload: schemas.MachineCreate,
    repo: Annotated[SQLAlchemyMachineRepository, Depends(get_machine_repo)],
):
    obj = models.Machine(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@router.get("/machines", response_model=list[schemas.MachineResponse], tags=["Máquinas"])
def list_machines(
    farm_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[SQLAlchemyMachineRepository, Depends(get_machine_repo)] = None,
):
    if farm_id:
        return repo.list_by_farm(farm_id)
    return repo.list_all(skip=skip, limit=limit)


@router.get("/machines/{machine_id}", response_model=schemas.MachineResponse, tags=["Máquinas"])
def get_machine(machine_id: str, repo: Annotated[SQLAlchemyMachineRepository, Depends(get_machine_repo)]):
    obj = repo.get_by_id(machine_id)
    if not obj:
        _404("Máquina", machine_id)
    return obj


@router.patch("/machines/{machine_id}", response_model=schemas.MachineResponse, tags=["Máquinas"])
def update_machine(
    machine_id: str,
    payload: schemas.MachineUpdate,
    repo: Annotated[SQLAlchemyMachineRepository, Depends(get_machine_repo)],
):
    obj = repo.get_by_id(machine_id)
    if not obj:
        _404("Máquina", machine_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@router.delete("/machines/{machine_id}", status_code=204, tags=["Máquinas"])
def delete_machine(machine_id: str, repo: Annotated[SQLAlchemyMachineRepository, Depends(get_machine_repo)]):
    if not repo.delete(machine_id):
        _404("Máquina", machine_id)


# ── Trabalhadores ────────────────────────────────────────────────────────────

@router.post("/workers", response_model=schemas.WorkerResponse, status_code=201, tags=["Mão de Obra"])
def create_worker(
    payload: schemas.WorkerCreate,
    repo: Annotated[SQLAlchemyWorkerRepository, Depends(get_worker_repo)],
):
    obj = models.Worker(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@router.get("/workers", response_model=list[schemas.WorkerResponse], tags=["Mão de Obra"])
def list_workers(
    farm_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[SQLAlchemyWorkerRepository, Depends(get_worker_repo)] = None,
):
    if farm_id:
        return repo.list_by_farm(farm_id)
    return repo.list_all(skip=skip, limit=limit)


@router.get("/workers/{worker_id}", response_model=schemas.WorkerResponse, tags=["Mão de Obra"])
def get_worker(worker_id: str, repo: Annotated[SQLAlchemyWorkerRepository, Depends(get_worker_repo)]):
    obj = repo.get_by_id(worker_id)
    if not obj:
        _404("Trabalhador", worker_id)
    return obj


@router.patch("/workers/{worker_id}", response_model=schemas.WorkerResponse, tags=["Mão de Obra"])
def update_worker(
    worker_id: str,
    payload: schemas.WorkerUpdate,
    repo: Annotated[SQLAlchemyWorkerRepository, Depends(get_worker_repo)],
):
    obj = repo.get_by_id(worker_id)
    if not obj:
        _404("Trabalhador", worker_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@router.delete("/workers/{worker_id}", status_code=204, tags=["Mão de Obra"])
def delete_worker(worker_id: str, repo: Annotated[SQLAlchemyWorkerRepository, Depends(get_worker_repo)]):
    if not repo.delete(worker_id):
        _404("Trabalhador", worker_id)


# ── Definições de serviço (empreita) ──────────────────────────────────────────

@router.post("/service-definitions", response_model=schemas.ServiceDefinitionResponse, status_code=201, tags=["Mão de Obra"])
def create_service_definition(
    payload: schemas.ServiceDefinitionCreate,
    repo: Annotated[SQLAlchemyServiceDefinitionRepository, Depends(get_service_definition_repo)],
):
    obj = models.ServiceDefinition(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@router.get("/service-definitions", response_model=list[schemas.ServiceDefinitionResponse], tags=["Mão de Obra"])
def list_service_definitions(
    farm_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[SQLAlchemyServiceDefinitionRepository, Depends(get_service_definition_repo)] = None,
):
    if farm_id:
        return repo.list_by_farm(farm_id)
    return repo.list_all(skip=skip, limit=limit)


@router.patch("/service-definitions/{sd_id}", response_model=schemas.ServiceDefinitionResponse, tags=["Mão de Obra"])
def update_service_definition(
    sd_id: str,
    payload: schemas.ServiceDefinitionUpdate,
    repo: Annotated[SQLAlchemyServiceDefinitionRepository, Depends(get_service_definition_repo)],
):
    obj = repo.get_by_id(sd_id)
    if not obj:
        _404("Definição de serviço", sd_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@router.delete("/service-definitions/{sd_id}", status_code=204, tags=["Mão de Obra"])
def delete_service_definition(sd_id: str, repo: Annotated[SQLAlchemyServiceDefinitionRepository, Depends(get_service_definition_repo)]):
    if not repo.delete(sd_id):
        _404("Definição de serviço", sd_id)


# ── Variedades por talhão ─────────────────────────────────────────────────────

@router.post("/plot-varieties", response_model=schemas.PlotVarietyResponse, status_code=201, tags=["Talhões"])
def create_plot_variety(
    payload: schemas.PlotVarietyCreate,
    repo: Annotated[SQLAlchemyPlotVarietyRepository, Depends(get_plot_variety_repo)],
    plot_repo: Annotated[IPlotRepository, Depends(get_plot_repo)],
):
    if not plot_repo.get_by_id(payload.plot_id):
        _404("Talhão", payload.plot_id)
    obj = models.PlotVariety(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@router.get("/plot-varieties", response_model=list[schemas.PlotVarietyResponse], tags=["Talhões"])
def list_plot_varieties(
    plot_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[SQLAlchemyPlotVarietyRepository, Depends(get_plot_variety_repo)] = None,
):
    if plot_id:
        return repo.list_by_plot(plot_id)
    return repo.list_all(skip=skip, limit=limit)


@router.delete("/plot-varieties/{variety_id}", status_code=204, tags=["Talhões"])
def delete_plot_variety(variety_id: str, repo: Annotated[SQLAlchemyPlotVarietyRepository, Depends(get_plot_variety_repo)]):
    if not repo.delete(variety_id):
        _404("Variedade do talhão", variety_id)


# ── Lançamentos numa atividade: insumos ───────────────────────────────────────

@router.get("/activities/{activity_id}/supplies", response_model=list[schemas.ActivitySupplyResponse], tags=["Custo da Atividade"])
def list_activity_supplies(
    activity_id: str,
    activity_repo: Annotated[IActivityRepository, Depends(get_activity_repo)],
    repo: Annotated[SQLAlchemyActivitySupplyRepository, Depends(get_activity_supply_repo)],
):
    _require_activity(activity_repo, activity_id)
    return repo.list_by_activity(activity_id)


@router.post("/activities/{activity_id}/supplies", response_model=schemas.ActivitySupplyResponse, status_code=201, tags=["Custo da Atividade"])
def add_activity_supply(
    activity_id: str,
    payload: schemas.ActivitySupplyCreate,
    activity_repo: Annotated[IActivityRepository, Depends(get_activity_repo)],
    supply_repo: Annotated[ISupplyRepository, Depends(get_supply_repo)],
    repo: Annotated[SQLAlchemyActivitySupplyRepository, Depends(get_activity_supply_repo)],
):
    _require_activity(activity_repo, activity_id)
    supply = supply_repo.get_by_id(payload.supply_id)
    if not supply:
        _404("Insumo", payload.supply_id)
    if repo.get(activity_id, payload.supply_id):
        raise HTTPException(status_code=409, detail="Este insumo já está lançado nesta atividade.")
    # total_cost = qtd × preço unitário do insumo, quando não informado.
    total_cost = payload.total_cost
    if total_cost is None:
        total_cost = Decimal(str(payload.applied_quantity)) * Decimal(str(supply.unit_cost))
    obj = models.ActivitySupply(
        activity_id=activity_id,
        supply_id=payload.supply_id,
        applied_quantity=payload.applied_quantity,
        total_cost=total_cost,
    )
    return repo.create(obj)


@router.delete("/activities/{activity_id}/supplies/{supply_id}", status_code=204, tags=["Custo da Atividade"])
def remove_activity_supply(
    activity_id: str,
    supply_id: str,
    repo: Annotated[SQLAlchemyActivitySupplyRepository, Depends(get_activity_supply_repo)],
):
    if not repo.delete(activity_id, supply_id):
        _404("Insumo da atividade", supply_id)


# ── Lançamentos numa atividade: mão de obra ───────────────────────────────────

@router.get("/activities/{activity_id}/labor", response_model=list[schemas.LaborEntryResponse], tags=["Custo da Atividade"])
def list_labor_entries(
    activity_id: str,
    activity_repo: Annotated[IActivityRepository, Depends(get_activity_repo)],
    repo: Annotated[SQLAlchemyLaborEntryRepository, Depends(get_labor_entry_repo)],
):
    _require_activity(activity_repo, activity_id)
    return repo.list_by_activity(activity_id)


@router.post("/activities/{activity_id}/labor", response_model=schemas.LaborEntryResponse, status_code=201, tags=["Custo da Atividade"])
def add_labor_entry(
    activity_id: str,
    payload: schemas.LaborEntryCreate,
    activity_repo: Annotated[IActivityRepository, Depends(get_activity_repo)],
    repo: Annotated[SQLAlchemyLaborEntryRepository, Depends(get_labor_entry_repo)],
    worker_repo: Annotated[SQLAlchemyWorkerRepository, Depends(get_worker_repo)],
    sd_repo: Annotated[SQLAlchemyServiceDefinitionRepository, Depends(get_service_definition_repo)],
):
    _require_activity(activity_repo, activity_id)
    if payload.labor_type == models.LaborType.DIARIA and not (payload.worker_id or payload.unit_value):
        raise HTTPException(status_code=422, detail="DIARIA exige worker_id (p/ usar a diária) ou unit_value.")
    if payload.labor_type == models.LaborType.SERVICO and not (payload.service_definition_id or payload.unit_value):
        raise HTTPException(status_code=422, detail="SERVICO exige service_definition_id ou unit_value.")
    # Se a taxa não veio explícita (unit_value), a referência PRECISA existir e ter
    # valor — senão o custo entraria como zero silencioso e subestimaria custo/saca.
    if payload.unit_value is None:
        if payload.labor_type == models.LaborType.DIARIA:
            worker = worker_repo.get_by_id(payload.worker_id)
            if not worker:
                _404("Trabalhador", payload.worker_id)
            if worker.daily_rate is None:
                raise HTTPException(
                    status_code=422,
                    detail="Trabalhador sem diária (daily_rate) cadastrada: informe unit_value ou defina a diária do trabalhador.",
                )
        elif payload.labor_type == models.LaborType.SERVICO:
            sd = sd_repo.get_by_id(payload.service_definition_id)
            if not sd:
                _404("Definição de serviço", payload.service_definition_id)
    obj = models.LaborEntry(id=str(uuid.uuid4()), activity_id=activity_id, **payload.model_dump())
    return repo.create(obj)


@router.delete("/activities/{activity_id}/labor/{entry_id}", status_code=204, tags=["Custo da Atividade"])
def remove_labor_entry(
    activity_id: str,
    entry_id: str,
    repo: Annotated[SQLAlchemyLaborEntryRepository, Depends(get_labor_entry_repo)],
):
    if not repo.delete(entry_id):
        _404("Apontamento de mão de obra", entry_id)


# ── Lançamentos numa atividade: hora-máquina ──────────────────────────────────

@router.get("/activities/{activity_id}/machine-usage", response_model=list[schemas.MachineUsageResponse], tags=["Custo da Atividade"])
def list_machine_usage(
    activity_id: str,
    activity_repo: Annotated[IActivityRepository, Depends(get_activity_repo)],
    repo: Annotated[SQLAlchemyMachineUsageRepository, Depends(get_machine_usage_repo)],
):
    _require_activity(activity_repo, activity_id)
    return repo.list_by_activity(activity_id)


@router.post("/activities/{activity_id}/machine-usage", response_model=schemas.MachineUsageResponse, status_code=201, tags=["Custo da Atividade"])
def add_machine_usage(
    activity_id: str,
    payload: schemas.MachineUsageCreate,
    activity_repo: Annotated[IActivityRepository, Depends(get_activity_repo)],
    machine_repo: Annotated[SQLAlchemyMachineRepository, Depends(get_machine_repo)],
    repo: Annotated[SQLAlchemyMachineUsageRepository, Depends(get_machine_usage_repo)],
):
    _require_activity(activity_repo, activity_id)
    if not machine_repo.get_by_id(payload.machine_id):
        _404("Máquina", payload.machine_id)
    obj = models.MachineUsage(id=str(uuid.uuid4()), activity_id=activity_id, **payload.model_dump())
    return repo.create(obj)


@router.delete("/activities/{activity_id}/machine-usage/{usage_id}", status_code=204, tags=["Custo da Atividade"])
def remove_machine_usage(
    activity_id: str,
    usage_id: str,
    repo: Annotated[SQLAlchemyMachineUsageRepository, Depends(get_machine_usage_repo)],
):
    if not repo.delete(usage_id):
        _404("Apontamento de hora-máquina", usage_id)


# ── Agregação de custo (calculada on-the-fly) ─────────────────────────────────

@router.get("/activities/{activity_id}/cost", response_model=schemas.ActivityCostBreakdown, tags=["Custo"])
def get_activity_cost(
    activity_id: str,
    activity_repo: Annotated[IActivityRepository, Depends(get_activity_repo)],
):
    """Decompõe o custo de uma atividade: insumos + mão de obra + hora-máquina."""
    activity = _require_activity(activity_repo, activity_id)
    return costing.activity_cost(activity)


@router.get("/plots/{plot_id}/seasons/{season_id}/cost", response_model=schemas.PlotSeasonCost, tags=["Custo"])
def get_plot_season_cost(
    plot_id: str,
    season_id: str,
    plot_repo: Annotated[IPlotRepository, Depends(get_plot_repo)],
    season_repo: Annotated[SQLAlchemySeasonRepository, Depends(get_season_repo)],
    db: Annotated[Session, Depends(get_db)],
):
    """Custo do talhão na safra + custo/ha, custo/saca, receita e lucro bruto.
    Esta é a saída de valor de gestão do MVP."""
    plot = plot_repo.get_by_id(plot_id)
    if not plot:
        _404("Talhão", plot_id)
    season = season_repo.get_by_id(season_id)
    if not season:
        _404("Safra", season_id)
    return costing.plot_season_cost(db, plot, season)
