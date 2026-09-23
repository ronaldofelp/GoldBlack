
import uuid
from datetime import datetime
from typing import Annotated, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .database import engine
from . import models, schemas
from .dependencies import (
    get_user_repo, get_farm_repo, get_plot_repo,
    get_soil_analysis_repo, get_recommendation_repo,
    get_harvest_estimate_repo, get_weather_log_repo,
    get_alert_repo, get_supply_repo, get_activity_repo,
    get_batch_repo,
    get_washer_phase_repo, get_patio_phase_repo,
    get_dryer_phase_repo, get_silo_phase_repo,
    get_processing_phase_repo,
    get_sale_repo, get_financial_transaction_repo,
    get_coffee_tracking_repo, get_tracking_event_repo,
)
from .repositories import (
    IUserRepository, IFarmRepository, IPlotRepository,
    ISoilAnalysisRepository, IRecommendationRepository,
    IHarvestEstimateRepository, IWeatherLogRepository,
    IAlertRepository, ISupplyRepository, IActivityRepository,
    IBatchRepository, IPhaseRepository,
    ISaleRepository, IFinancialTransactionRepository,
    ICoffeeTrackingRepository, ITrackingEventRepository,
)
from passlib.context import CryptContext

from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)


def _auto_seed():
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            print("[*] Banco de dados vazio. Gerando dados mockados automaticamente...")
            import sys
            import os
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if backend_dir not in sys.path:
                sys.path.append(backend_dir)
            import mock_data
            mock_data.seed(db)
    except Exception as e:
        print(f"[*] Aviso: Nao foi possivel rodar o seed automatico: {e}")
    finally:
        db.close()


_auto_seed()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(
    title="GoldBlack Coffee Platform API",
    description=(
        "API RESTful para rastreabilidade e gestão agrícola da plataforma GoldBlack Coffee. "
        "Arquitetura baseada em DIP/SOLID com Repository Pattern para isolamento de banco de dados."
    ),
    version="1.0.0",
    contact={"name": "GoldBlack Coffee Team"},
    license_info={"name": "Proprietário"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://164.152.53.29:3000", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _404(entity: str, entity_id: str):
    raise HTTPException(status_code=404, detail=f"{entity} '{entity_id}' não encontrado.")


@app.post("/users", response_model=schemas.UserResponse, status_code=201, tags=["Usuários"])
def create_user(
    payload: schemas.UserCreate,
    repo: Annotated[IUserRepository, Depends(get_user_repo)],
):
    """Cria um novo usuário no sistema."""
    if repo.get_by_email(payload.email):
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")
    user = models.User(
        id=str(uuid.uuid4()),
        name=payload.name,
        email=payload.email,
        password_hash=pwd_context.hash(payload.password),
        role=payload.role,
    )
    return repo.create(user)


@app.get("/users", response_model=list[schemas.UserResponse], tags=["Usuários"])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IUserRepository, Depends(get_user_repo)] = None,
):
    """Lista todos os usuários com paginação."""
    return repo.list_all(skip=skip, limit=limit)


@app.get("/users/{user_id}", response_model=schemas.UserResponse, tags=["Usuários"])
def get_user(user_id: str, repo: Annotated[IUserRepository, Depends(get_user_repo)]):
    """Retorna um usuário pelo ID."""
    user = repo.get_by_id(user_id)
    if not user:
        _404("Usuário", user_id)
    return user


@app.patch("/users/{user_id}", response_model=schemas.UserResponse, tags=["Usuários"])
def update_user(
    user_id: str,
    payload: schemas.UserUpdate,
    repo: Annotated[IUserRepository, Depends(get_user_repo)],
):
    """Atualiza parcialmente os dados de um usuário."""
    user = repo.get_by_id(user_id)
    if not user:
        _404("Usuário", user_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    return repo.update(user)


@app.delete("/users/{user_id}", status_code=204, tags=["Usuários"])
def delete_user(user_id: str, repo: Annotated[IUserRepository, Depends(get_user_repo)]):
    """Remove um usuário."""
    if not repo.delete(user_id):
        _404("Usuário", user_id)


@app.post("/farms", response_model=schemas.FarmResponse, status_code=201, tags=["Propriedades"])
def create_farm(
    payload: schemas.FarmCreate,
    repo: Annotated[IFarmRepository, Depends(get_farm_repo)],
):
    farm = models.Farm(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(farm)


@app.get("/farms", response_model=list[schemas.FarmResponse], tags=["Propriedades"])
def list_farms(
    producer_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IFarmRepository, Depends(get_farm_repo)] = None,
):
    """Lista propriedades, opcionalmente filtrando por produtor."""
    if producer_id:
        return repo.list_by_producer(producer_id)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/farms/{farm_id}", response_model=schemas.FarmResponse, tags=["Propriedades"])
def get_farm(farm_id: str, repo: Annotated[IFarmRepository, Depends(get_farm_repo)]):
    farm = repo.get_by_id(farm_id)
    if not farm:
        _404("Propriedade", farm_id)
    return farm


@app.patch("/farms/{farm_id}", response_model=schemas.FarmResponse, tags=["Propriedades"])
def update_farm(
    farm_id: str,
    payload: schemas.FarmUpdate,
    repo: Annotated[IFarmRepository, Depends(get_farm_repo)],
):
    farm = repo.get_by_id(farm_id)
    if not farm:
        _404("Propriedade", farm_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(farm, field, value)
    return repo.update(farm)


@app.delete("/farms/{farm_id}", status_code=204, tags=["Propriedades"])
def delete_farm(farm_id: str, repo: Annotated[IFarmRepository, Depends(get_farm_repo)]):
    if not repo.delete(farm_id):
        _404("Propriedade", farm_id)


@app.post("/plots", response_model=schemas.PlotResponse, status_code=201, tags=["Talhões"])
def create_plot(
    payload: schemas.PlotCreate,
    repo: Annotated[IPlotRepository, Depends(get_plot_repo)],
):
    plot = models.Plot(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(plot)


@app.get("/plots", response_model=list[schemas.PlotResponse], tags=["Talhões"])
def list_plots(
    farm_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IPlotRepository, Depends(get_plot_repo)] = None,
):
    if farm_id:
        return repo.list_by_farm(farm_id)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/plots/{plot_id}", response_model=schemas.PlotResponse, tags=["Talhões"])
def get_plot(plot_id: str, repo: Annotated[IPlotRepository, Depends(get_plot_repo)]):
    plot = repo.get_by_id(plot_id)
    if not plot:
        _404("Talhão", plot_id)
    return plot


@app.patch("/plots/{plot_id}", response_model=schemas.PlotResponse, tags=["Talhões"])
def update_plot(
    plot_id: str,
    payload: schemas.PlotUpdate,
    repo: Annotated[IPlotRepository, Depends(get_plot_repo)],
):
    plot = repo.get_by_id(plot_id)
    if not plot:
        _404("Talhão", plot_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(plot, field, value)
    return repo.update(plot)


@app.delete("/plots/{plot_id}", status_code=204, tags=["Talhões"])
def delete_plot(plot_id: str, repo: Annotated[IPlotRepository, Depends(get_plot_repo)]):
    if not repo.delete(plot_id):
        _404("Talhão", plot_id)


@app.post("/soil-analyses", response_model=schemas.SoilAnalysisResponse, status_code=201, tags=["Análises de Solo"])
def create_soil_analysis(
    payload: schemas.SoilAnalysisCreate,
    repo: Annotated[ISoilAnalysisRepository, Depends(get_soil_analysis_repo)],
):
    analysis = models.SoilAnalysis(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(analysis)


@app.get("/soil-analyses", response_model=list[schemas.SoilAnalysisResponse], tags=["Análises de Solo"])
def list_soil_analyses(
    plot_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[ISoilAnalysisRepository, Depends(get_soil_analysis_repo)] = None,
):
    if plot_id:
        return repo.list_by_plot(plot_id)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/soil-analyses/{analysis_id}", response_model=schemas.SoilAnalysisResponse, tags=["Análises de Solo"])
def get_soil_analysis(analysis_id: str, repo: Annotated[ISoilAnalysisRepository, Depends(get_soil_analysis_repo)]):
    obj = repo.get_by_id(analysis_id)
    if not obj:
        _404("Análise de solo", analysis_id)
    return obj


@app.patch("/soil-analyses/{analysis_id}", response_model=schemas.SoilAnalysisResponse, tags=["Análises de Solo"])
def update_soil_analysis(
    analysis_id: str,
    payload: schemas.SoilAnalysisUpdate,
    repo: Annotated[ISoilAnalysisRepository, Depends(get_soil_analysis_repo)],
):
    obj = repo.get_by_id(analysis_id)
    if not obj:
        _404("Análise de solo", analysis_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/soil-analyses/{analysis_id}", status_code=204, tags=["Análises de Solo"])
def delete_soil_analysis(analysis_id: str, repo: Annotated[ISoilAnalysisRepository, Depends(get_soil_analysis_repo)]):
    if not repo.delete(analysis_id):
        _404("Análise de solo", analysis_id)


@app.post("/recommendations", response_model=schemas.TechnicalRecommendationResponse, status_code=201, tags=["Recomendações Técnicas"])
def create_recommendation(
    payload: schemas.TechnicalRecommendationCreate,
    repo: Annotated[IRecommendationRepository, Depends(get_recommendation_repo)],
):
    rec = models.TechnicalRecommendation(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(rec)


@app.get("/recommendations", response_model=list[schemas.TechnicalRecommendationResponse], tags=["Recomendações Técnicas"])
def list_recommendations(
    plot_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IRecommendationRepository, Depends(get_recommendation_repo)] = None,
):
    if plot_id:
        return repo.list_by_plot(plot_id)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/recommendations/{rec_id}", response_model=schemas.TechnicalRecommendationResponse, tags=["Recomendações Técnicas"])
def get_recommendation(rec_id: str, repo: Annotated[IRecommendationRepository, Depends(get_recommendation_repo)]):
    obj = repo.get_by_id(rec_id)
    if not obj:
        _404("Recomendação", rec_id)
    return obj


@app.patch("/recommendations/{rec_id}", response_model=schemas.TechnicalRecommendationResponse, tags=["Recomendações Técnicas"])
def update_recommendation(
    rec_id: str,
    payload: schemas.TechnicalRecommendationUpdate,
    repo: Annotated[IRecommendationRepository, Depends(get_recommendation_repo)],
):
    obj = repo.get_by_id(rec_id)
    if not obj:
        _404("Recomendação", rec_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/recommendations/{rec_id}", status_code=204, tags=["Recomendações Técnicas"])
def delete_recommendation(rec_id: str, repo: Annotated[IRecommendationRepository, Depends(get_recommendation_repo)]):
    if not repo.delete(rec_id):
        _404("Recomendação", rec_id)


@app.post("/harvest-estimates", response_model=schemas.HarvestEstimateResponse, status_code=201, tags=["Estimativas de Safra"])
def create_harvest_estimate(
    payload: schemas.HarvestEstimateCreate,
    repo: Annotated[IHarvestEstimateRepository, Depends(get_harvest_estimate_repo)],
):
    obj = models.HarvestEstimate(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@app.get("/harvest-estimates", response_model=list[schemas.HarvestEstimateResponse], tags=["Estimativas de Safra"])
def list_harvest_estimates(
    plot_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IHarvestEstimateRepository, Depends(get_harvest_estimate_repo)] = None,
):
    if plot_id:
        return repo.list_by_plot(plot_id)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/harvest-estimates/{estimate_id}", response_model=schemas.HarvestEstimateResponse, tags=["Estimativas de Safra"])
def get_harvest_estimate(estimate_id: str, repo: Annotated[IHarvestEstimateRepository, Depends(get_harvest_estimate_repo)]):
    obj = repo.get_by_id(estimate_id)
    if not obj:
        _404("Estimativa de safra", estimate_id)
    return obj


@app.patch("/harvest-estimates/{estimate_id}", response_model=schemas.HarvestEstimateResponse, tags=["Estimativas de Safra"])
def update_harvest_estimate(
    estimate_id: str,
    payload: schemas.HarvestEstimateUpdate,
    repo: Annotated[IHarvestEstimateRepository, Depends(get_harvest_estimate_repo)],
):
    obj = repo.get_by_id(estimate_id)
    if not obj:
        _404("Estimativa de safra", estimate_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/harvest-estimates/{estimate_id}", status_code=204, tags=["Estimativas de Safra"])
def delete_harvest_estimate(estimate_id: str, repo: Annotated[IHarvestEstimateRepository, Depends(get_harvest_estimate_repo)]):
    if not repo.delete(estimate_id):
        _404("Estimativa de safra", estimate_id)


@app.post("/weather-logs", response_model=schemas.WeatherLogResponse, status_code=201, tags=["Registros Climáticos"])
def create_weather_log(
    payload: schemas.WeatherLogCreate,
    repo: Annotated[IWeatherLogRepository, Depends(get_weather_log_repo)],
):
    obj = models.WeatherLog(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@app.get("/weather-logs", response_model=list[schemas.WeatherLogResponse], tags=["Registros Climáticos"])
def list_weather_logs(
    farm_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IWeatherLogRepository, Depends(get_weather_log_repo)] = None,
):
    if farm_id:
        return repo.list_by_farm(farm_id)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/weather-logs/{log_id}", response_model=schemas.WeatherLogResponse, tags=["Registros Climáticos"])
def get_weather_log(log_id: str, repo: Annotated[IWeatherLogRepository, Depends(get_weather_log_repo)]):
    obj = repo.get_by_id(log_id)
    if not obj:
        _404("Registro climático", log_id)
    return obj


@app.patch("/weather-logs/{log_id}", response_model=schemas.WeatherLogResponse, tags=["Registros Climáticos"])
def update_weather_log(
    log_id: str,
    payload: schemas.WeatherLogUpdate,
    repo: Annotated[IWeatherLogRepository, Depends(get_weather_log_repo)],
):
    obj = repo.get_by_id(log_id)
    if not obj:
        _404("Registro climático", log_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/weather-logs/{log_id}", status_code=204, tags=["Registros Climáticos"])
def delete_weather_log(log_id: str, repo: Annotated[IWeatherLogRepository, Depends(get_weather_log_repo)]):
    if not repo.delete(log_id):
        _404("Registro climático", log_id)


@app.post("/alerts", response_model=schemas.SystemAlertResponse, status_code=201, tags=["Alertas"])
def create_alert(
    payload: schemas.SystemAlertCreate,
    repo: Annotated[IAlertRepository, Depends(get_alert_repo)],
):
    obj = models.SystemAlert(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@app.get("/alerts", response_model=list[schemas.SystemAlertResponse], tags=["Alertas"])
def list_alerts(
    farm_id: Optional[str] = None,
    unread_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IAlertRepository, Depends(get_alert_repo)] = None,
):
    if farm_id:
        return repo.list_by_farm(farm_id, unread_only=unread_only)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/alerts/{alert_id}", response_model=schemas.SystemAlertResponse, tags=["Alertas"])
def get_alert(alert_id: str, repo: Annotated[IAlertRepository, Depends(get_alert_repo)]):
    obj = repo.get_by_id(alert_id)
    if not obj:
        _404("Alerta", alert_id)
    return obj


@app.patch("/alerts/{alert_id}", response_model=schemas.SystemAlertResponse, tags=["Alertas"])
def update_alert(
    alert_id: str,
    payload: schemas.SystemAlertUpdate,
    repo: Annotated[IAlertRepository, Depends(get_alert_repo)],
):
    obj = repo.get_by_id(alert_id)
    if not obj:
        _404("Alerta", alert_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/alerts/{alert_id}", status_code=204, tags=["Alertas"])
def delete_alert(alert_id: str, repo: Annotated[IAlertRepository, Depends(get_alert_repo)]):
    if not repo.delete(alert_id):
        _404("Alerta", alert_id)


@app.post("/supplies", response_model=schemas.AgriculturalSupplyResponse, status_code=201, tags=["Insumos"])
def create_supply(
    payload: schemas.AgriculturalSupplyCreate,
    repo: Annotated[ISupplyRepository, Depends(get_supply_repo)],
):
    obj = models.AgriculturalSupply(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@app.get("/supplies", response_model=list[schemas.AgriculturalSupplyResponse], tags=["Insumos"])
def list_supplies(
    category: Optional[models.SupplyCategory] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[ISupplyRepository, Depends(get_supply_repo)] = None,
):
    if category:
        return repo.list_by_category(category)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/supplies/{supply_id}", response_model=schemas.AgriculturalSupplyResponse, tags=["Insumos"])
def get_supply(supply_id: str, repo: Annotated[ISupplyRepository, Depends(get_supply_repo)]):
    obj = repo.get_by_id(supply_id)
    if not obj:
        _404("Insumo", supply_id)
    return obj


@app.patch("/supplies/{supply_id}", response_model=schemas.AgriculturalSupplyResponse, tags=["Insumos"])
def update_supply(
    supply_id: str,
    payload: schemas.AgriculturalSupplyUpdate,
    repo: Annotated[ISupplyRepository, Depends(get_supply_repo)],
):
    obj = repo.get_by_id(supply_id)
    if not obj:
        _404("Insumo", supply_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/supplies/{supply_id}", status_code=204, tags=["Insumos"])
def delete_supply(supply_id: str, repo: Annotated[ISupplyRepository, Depends(get_supply_repo)]):
    if not repo.delete(supply_id):
        _404("Insumo", supply_id)


@app.post("/activities", response_model=schemas.AgriculturalActivityResponse, status_code=201, tags=["Atividades Agrícolas"])
def create_activity(
    payload: schemas.AgriculturalActivityCreate,
    repo: Annotated[IActivityRepository, Depends(get_activity_repo)],
):
    obj = models.AgriculturalActivity(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@app.get("/activities", response_model=list[schemas.AgriculturalActivityResponse], tags=["Atividades Agrícolas"])
def list_activities(
    plot_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IActivityRepository, Depends(get_activity_repo)] = None,
):
    if plot_id:
        return repo.list_by_plot(plot_id)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/activities/{activity_id}", response_model=schemas.AgriculturalActivityResponse, tags=["Atividades Agrícolas"])
def get_activity(activity_id: str, repo: Annotated[IActivityRepository, Depends(get_activity_repo)]):
    obj = repo.get_by_id(activity_id)
    if not obj:
        _404("Atividade", activity_id)
    return obj


@app.patch("/activities/{activity_id}", response_model=schemas.AgriculturalActivityResponse, tags=["Atividades Agrícolas"])
def update_activity(
    activity_id: str,
    payload: schemas.AgriculturalActivityUpdate,
    repo: Annotated[IActivityRepository, Depends(get_activity_repo)],
):
    obj = repo.get_by_id(activity_id)
    if not obj:
        _404("Atividade", activity_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/activities/{activity_id}", status_code=204, tags=["Atividades Agrícolas"])
def delete_activity(activity_id: str, repo: Annotated[IActivityRepository, Depends(get_activity_repo)]):
    if not repo.delete(activity_id):
        _404("Atividade", activity_id)


@app.post("/batches", response_model=schemas.TraceabilityBatchResponse, status_code=201, tags=["Rastreabilidade"])
def create_batch(
    payload: schemas.TraceabilityBatchCreate,
    repo: Annotated[IBatchRepository, Depends(get_batch_repo)],
):
    if repo.get_by_code(payload.batch_code):
        raise HTTPException(status_code=409, detail=f"Código de lote '{payload.batch_code}' já existe.")
    obj = models.TraceabilityBatch(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@app.get("/batches", response_model=list[schemas.TraceabilityBatchResponse], tags=["Rastreabilidade"])
def list_batches(
    plot_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IBatchRepository, Depends(get_batch_repo)] = None,
):
    if plot_id:
        return repo.list_by_plot(plot_id)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/batches/{batch_id}", response_model=schemas.TraceabilityBatchResponse, tags=["Rastreabilidade"])
def get_batch(batch_id: str, repo: Annotated[IBatchRepository, Depends(get_batch_repo)]):
    obj = repo.get_by_id(batch_id)
    if not obj:
        _404("Lote", batch_id)
    return obj


@app.patch("/batches/{batch_id}", response_model=schemas.TraceabilityBatchResponse, tags=["Rastreabilidade"])
def update_batch(
    batch_id: str,
    payload: schemas.TraceabilityBatchUpdate,
    repo: Annotated[IBatchRepository, Depends(get_batch_repo)],
):
    obj = repo.get_by_id(batch_id)
    if not obj:
        _404("Lote", batch_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/batches/{batch_id}", status_code=204, tags=["Rastreabilidade"])
def delete_batch(batch_id: str, repo: Annotated[IBatchRepository, Depends(get_batch_repo)]):
    if not repo.delete(batch_id):
        _404("Lote", batch_id)


@app.post("/batches/{batch_id}/phases/washer", response_model=schemas.WasherPhaseResponse, status_code=201, tags=["Pós-Colheita"])
def create_washer_phase(
    batch_id: str,
    payload: schemas.WasherPhaseCreate,
    repo: Annotated[IPhaseRepository, Depends(get_washer_phase_repo)],
):
    if repo.get_by_batch(batch_id):
        raise HTTPException(status_code=409, detail="Fase lavador já registrada para este lote.")
    obj = models.WasherPhase(**payload.model_dump())
    return repo.create(obj)


@app.get("/batches/{batch_id}/phases/washer", response_model=schemas.WasherPhaseResponse, tags=["Pós-Colheita"])
def get_washer_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_washer_phase_repo)]):
    obj = repo.get_by_batch(batch_id)
    if not obj:
        _404("Fase lavador", batch_id)
    return obj


@app.delete("/batches/{batch_id}/phases/washer", status_code=204, tags=["Pós-Colheita"])
def delete_washer_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_washer_phase_repo)]):
    if not repo.delete(batch_id):
        _404("Fase lavador", batch_id)


@app.post("/batches/{batch_id}/phases/patio", response_model=schemas.PatioPhaseResponse, status_code=201, tags=["Pós-Colheita"])
def create_patio_phase(
    batch_id: str,
    payload: schemas.PatioPhaseCreate,
    repo: Annotated[IPhaseRepository, Depends(get_patio_phase_repo)],
):
    if repo.get_by_batch(batch_id):
        raise HTTPException(status_code=409, detail="Fase terreiro já registrada para este lote.")
    obj = models.PatioPhase(**payload.model_dump())
    return repo.create(obj)


@app.get("/batches/{batch_id}/phases/patio", response_model=schemas.PatioPhaseResponse, tags=["Pós-Colheita"])
def get_patio_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_patio_phase_repo)]):
    obj = repo.get_by_batch(batch_id)
    if not obj:
        _404("Fase terreiro", batch_id)
    return obj


@app.patch("/batches/{batch_id}/phases/patio", response_model=schemas.PatioPhaseResponse, tags=["Pós-Colheita"])
def update_patio_phase(
    batch_id: str,
    payload: schemas.PatioPhaseUpdate,
    repo: Annotated[IPhaseRepository, Depends(get_patio_phase_repo)],
):
    obj = repo.get_by_batch(batch_id)
    if not obj:
        _404("Fase terreiro", batch_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/batches/{batch_id}/phases/patio", status_code=204, tags=["Pós-Colheita"])
def delete_patio_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_patio_phase_repo)]):
    if not repo.delete(batch_id):
        _404("Fase terreiro", batch_id)


@app.post("/batches/{batch_id}/phases/dryer", response_model=schemas.DryerPhaseResponse, status_code=201, tags=["Pós-Colheita"])
def create_dryer_phase(
    batch_id: str,
    payload: schemas.DryerPhaseCreate,
    repo: Annotated[IPhaseRepository, Depends(get_dryer_phase_repo)],
):
    if repo.get_by_batch(batch_id):
        raise HTTPException(status_code=409, detail="Fase secador já registrada para este lote.")
    obj = models.DryerPhase(**payload.model_dump())
    return repo.create(obj)


@app.get("/batches/{batch_id}/phases/dryer", response_model=schemas.DryerPhaseResponse, tags=["Pós-Colheita"])
def get_dryer_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_dryer_phase_repo)]):
    obj = repo.get_by_batch(batch_id)
    if not obj:
        _404("Fase secador", batch_id)
    return obj


@app.patch("/batches/{batch_id}/phases/dryer", response_model=schemas.DryerPhaseResponse, tags=["Pós-Colheita"])
def update_dryer_phase(
    batch_id: str,
    payload: schemas.DryerPhaseUpdate,
    repo: Annotated[IPhaseRepository, Depends(get_dryer_phase_repo)],
):
    obj = repo.get_by_batch(batch_id)
    if not obj:
        _404("Fase secador", batch_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/batches/{batch_id}/phases/dryer", status_code=204, tags=["Pós-Colheita"])
def delete_dryer_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_dryer_phase_repo)]):
    if not repo.delete(batch_id):
        _404("Fase secador", batch_id)


@app.post("/batches/{batch_id}/phases/silo", response_model=schemas.SiloPhaseResponse, status_code=201, tags=["Pós-Colheita"])
def create_silo_phase(
    batch_id: str,
    payload: schemas.SiloPhaseCreate,
    repo: Annotated[IPhaseRepository, Depends(get_silo_phase_repo)],
):
    if repo.get_by_batch(batch_id):
        raise HTTPException(status_code=409, detail="Fase tulha já registrada para este lote.")
    obj = models.SiloPhase(**payload.model_dump())
    return repo.create(obj)


@app.get("/batches/{batch_id}/phases/silo", response_model=schemas.SiloPhaseResponse, tags=["Pós-Colheita"])
def get_silo_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_silo_phase_repo)]):
    obj = repo.get_by_batch(batch_id)
    if not obj:
        _404("Fase tulha", batch_id)
    return obj


@app.patch("/batches/{batch_id}/phases/silo", response_model=schemas.SiloPhaseResponse, tags=["Pós-Colheita"])
def update_silo_phase(
    batch_id: str,
    payload: schemas.SiloPhaseUpdate,
    repo: Annotated[IPhaseRepository, Depends(get_silo_phase_repo)],
):
    obj = repo.get_by_batch(batch_id)
    if not obj:
        _404("Fase tulha", batch_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/batches/{batch_id}/phases/silo", status_code=204, tags=["Pós-Colheita"])
def delete_silo_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_silo_phase_repo)]):
    if not repo.delete(batch_id):
        _404("Fase tulha", batch_id)


@app.post("/batches/{batch_id}/phases/processing", response_model=schemas.ProcessingPhaseResponse, status_code=201, tags=["Pós-Colheita"])
def create_processing_phase(
    batch_id: str,
    payload: schemas.ProcessingPhaseCreate,
    repo: Annotated[IPhaseRepository, Depends(get_processing_phase_repo)],
):
    if repo.get_by_batch(batch_id):
        raise HTTPException(status_code=409, detail="Fase beneficiamento já registrada para este lote.")
    obj = models.ProcessingPhase(**payload.model_dump())
    return repo.create(obj)


@app.get("/batches/{batch_id}/phases/processing", response_model=schemas.ProcessingPhaseResponse, tags=["Pós-Colheita"])
def get_processing_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_processing_phase_repo)]):
    obj = repo.get_by_batch(batch_id)
    if not obj:
        _404("Fase beneficiamento", batch_id)
    return obj


@app.patch("/batches/{batch_id}/phases/processing", response_model=schemas.ProcessingPhaseResponse, tags=["Pós-Colheita"])
def update_processing_phase(
    batch_id: str,
    payload: schemas.ProcessingPhaseUpdate,
    repo: Annotated[IPhaseRepository, Depends(get_processing_phase_repo)],
):
    obj = repo.get_by_batch(batch_id)
    if not obj:
        _404("Fase beneficiamento", batch_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/batches/{batch_id}/phases/processing", status_code=204, tags=["Pós-Colheita"])
def delete_processing_phase(batch_id: str, repo: Annotated[IPhaseRepository, Depends(get_processing_phase_repo)]):
    if not repo.delete(batch_id):
        _404("Fase beneficiamento", batch_id)


@app.post("/sales", response_model=schemas.SaleResponse, status_code=201, tags=["Comercialização"])
def create_sale(
    payload: schemas.SaleCreate,
    repo: Annotated[ISaleRepository, Depends(get_sale_repo)],
):
    if repo.get_by_batch(payload.batch_id):
        raise HTTPException(status_code=409, detail="Este lote já possui uma venda registrada.")
    obj = models.Sale(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@app.get("/sales", response_model=list[schemas.SaleResponse], tags=["Comercialização"])
def list_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[ISaleRepository, Depends(get_sale_repo)] = None,
):
    return repo.list_all(skip=skip, limit=limit)


@app.get("/sales/{sale_id}", response_model=schemas.SaleResponse, tags=["Comercialização"])
def get_sale(sale_id: str, repo: Annotated[ISaleRepository, Depends(get_sale_repo)]):
    obj = repo.get_by_id(sale_id)
    if not obj:
        _404("Venda", sale_id)
    return obj


@app.patch("/sales/{sale_id}", response_model=schemas.SaleResponse, tags=["Comercialização"])
def update_sale(
    sale_id: str,
    payload: schemas.SaleUpdate,
    repo: Annotated[ISaleRepository, Depends(get_sale_repo)],
):
    obj = repo.get_by_id(sale_id)
    if not obj:
        _404("Venda", sale_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/sales/{sale_id}", status_code=204, tags=["Comercialização"])
def delete_sale(sale_id: str, repo: Annotated[ISaleRepository, Depends(get_sale_repo)]):
    if not repo.delete(sale_id):
        _404("Venda", sale_id)


@app.post("/transactions", response_model=schemas.FinancialTransactionResponse, status_code=201, tags=["Financeiro"])
def create_transaction(
    payload: schemas.FinancialTransactionCreate,
    repo: Annotated[IFinancialTransactionRepository, Depends(get_financial_transaction_repo)],
):
    obj = models.FinancialTransaction(id=str(uuid.uuid4()), **payload.model_dump())
    return repo.create(obj)


@app.get("/transactions", response_model=list[schemas.FinancialTransactionResponse], tags=["Financeiro"])
def list_transactions(
    farm_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[IFinancialTransactionRepository, Depends(get_financial_transaction_repo)] = None,
):
    if farm_id:
        return repo.list_by_farm(farm_id)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/transactions/{transaction_id}", response_model=schemas.FinancialTransactionResponse, tags=["Financeiro"])
def get_transaction(transaction_id: str, repo: Annotated[IFinancialTransactionRepository, Depends(get_financial_transaction_repo)]):
    obj = repo.get_by_id(transaction_id)
    if not obj:
        _404("Transação", transaction_id)
    return obj


@app.patch("/transactions/{transaction_id}", response_model=schemas.FinancialTransactionResponse, tags=["Financeiro"])
def update_transaction(
    transaction_id: str,
    payload: schemas.FinancialTransactionUpdate,
    repo: Annotated[IFinancialTransactionRepository, Depends(get_financial_transaction_repo)],
):
    obj = repo.get_by_id(transaction_id)
    if not obj:
        _404("Transação", transaction_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/transactions/{transaction_id}", status_code=204, tags=["Financeiro"])
def delete_transaction(transaction_id: str, repo: Annotated[IFinancialTransactionRepository, Depends(get_financial_transaction_repo)]):
    if not repo.delete(transaction_id):
        _404("Transação", transaction_id)


@app.get("/health", tags=["Sistema"])
def health_check():
    """Verifica o status operacional da API."""
    return {"status": "ok", "service": "GoldBlack Coffee API", "version": "1.0.0"}


# ── Coffee Tracking ────────────────────────────────────────────────────────────

@app.post("/trackings", response_model=schemas.CoffeeTrackingResponse, status_code=201, tags=["Rastreio do Café"])
def create_tracking(
    payload: schemas.CoffeeTrackingCreate,
    repo: Annotated[ICoffeeTrackingRepository, Depends(get_coffee_tracking_repo)],
    event_repo: Annotated[ITrackingEventRepository, Depends(get_tracking_event_repo)],
):
    """Cria um novo rastreio. Gera automaticamente um código único (GB-ANO-XXXX)."""
    tracking_code = repo.next_tracking_code()
    obj = models.CoffeeTracking(
        id=str(uuid.uuid4()),
        tracking_code=tracking_code,
        batch_id=payload.batch_id,
        description=payload.description,
        current_stage=models.TrackingStage.COLHEITA,
        status=models.TrackingStatus.IN_PROGRESS,
    )
    created = repo.create(obj)
    # Registra o evento inicial de colheita
    initial_event = models.TrackingEvent(
        id=str(uuid.uuid4()),
        tracking_id=created.id,
        stage=models.TrackingStage.COLHEITA,
        notes="Rastreio criado — etapa inicial: Colheita",
    )
    event_repo.create(initial_event)
    # Refresh para incluir o evento na resposta
    return repo.get_by_id(created.id)


@app.get("/trackings", response_model=list[schemas.CoffeeTrackingListResponse], tags=["Rastreio do Café"])
def list_trackings(
    status_filter: Optional[models.TrackingStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: Annotated[ICoffeeTrackingRepository, Depends(get_coffee_tracking_repo)] = None,
):
    """Lista rastreios, opcionalmente filtrando por status (IN_PROGRESS / COMPLETED)."""
    if status_filter:
        return repo.list_by_status(status_filter, skip=skip, limit=limit)
    return repo.list_all(skip=skip, limit=limit)


@app.get("/trackings/code/{tracking_code}", response_model=schemas.CoffeeTrackingResponse, tags=["Rastreio do Café"])
def get_tracking_by_code(
    tracking_code: str,
    repo: Annotated[ICoffeeTrackingRepository, Depends(get_coffee_tracking_repo)],
):
    """Busca um rastreio pelo código (usado pelo QR Code)."""
    obj = repo.get_by_code(tracking_code)
    if not obj:
        _404("Rastreio", tracking_code)
    return obj


@app.get("/trackings/{tracking_id}", response_model=schemas.CoffeeTrackingResponse, tags=["Rastreio do Café"])
def get_tracking(
    tracking_id: str,
    repo: Annotated[ICoffeeTrackingRepository, Depends(get_coffee_tracking_repo)],
):
    """Retorna detalhes de um rastreio pelo ID, incluindo todos os eventos."""
    obj = repo.get_by_id(tracking_id)
    if not obj:
        _404("Rastreio", tracking_id)
    return obj


@app.patch("/trackings/{tracking_id}", response_model=schemas.CoffeeTrackingResponse, tags=["Rastreio do Café"])
def update_tracking(
    tracking_id: str,
    payload: schemas.CoffeeTrackingUpdate,
    repo: Annotated[ICoffeeTrackingRepository, Depends(get_coffee_tracking_repo)],
):
    """Atualiza dados de um rastreio (descrição, status)."""
    obj = repo.get_by_id(tracking_id)
    if not obj:
        _404("Rastreio", tracking_id)
    data = payload.model_dump(exclude_none=True)
    if data.get("status") == models.TrackingStatus.COMPLETED:
        data["completed_at"] = datetime.utcnow()
    for field, value in data.items():
        setattr(obj, field, value)
    return repo.update(obj)


@app.delete("/trackings/{tracking_id}", status_code=204, tags=["Rastreio do Café"])
def delete_tracking(
    tracking_id: str,
    repo: Annotated[ICoffeeTrackingRepository, Depends(get_coffee_tracking_repo)],
):
    """Remove um rastreio e todo o seu histórico."""
    if not repo.delete(tracking_id):
        _404("Rastreio", tracking_id)


@app.post("/trackings/{tracking_id}/events", response_model=schemas.TrackingEventResponse, status_code=201, tags=["Rastreio do Café"])
def create_tracking_event(
    tracking_id: str,
    payload: schemas.TrackingEventCreate,
    tracking_repo: Annotated[ICoffeeTrackingRepository, Depends(get_coffee_tracking_repo)],
    event_repo: Annotated[ITrackingEventRepository, Depends(get_tracking_event_repo)],
):
    """Registra uma nova etapa no rastreio. Atualiza o current_stage automaticamente."""
    tracking = tracking_repo.get_by_id(tracking_id)
    if not tracking:
        _404("Rastreio", tracking_id)
    if tracking.status == models.TrackingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Rastreio já finalizado. Não é possível adicionar novas etapas.")

    event = models.TrackingEvent(
        id=str(uuid.uuid4()),
        tracking_id=tracking_id,
        stage=payload.stage,
        notes=payload.notes,
        recorded_by=payload.recorded_by,
    )
    created_event = event_repo.create(event)

    # Atualiza a etapa atual do rastreio
    tracking.current_stage = payload.stage
    tracking.updated_at = datetime.utcnow()
    if payload.stage == models.TrackingStage.FINALIZADO:
        tracking.status = models.TrackingStatus.COMPLETED
        tracking.completed_at = datetime.utcnow()
    tracking_repo.update(tracking)

    return created_event


@app.get("/trackings/{tracking_id}/events", response_model=list[schemas.TrackingEventResponse], tags=["Rastreio do Café"])
def list_tracking_events(
    tracking_id: str,
    tracking_repo: Annotated[ICoffeeTrackingRepository, Depends(get_coffee_tracking_repo)],
    event_repo: Annotated[ITrackingEventRepository, Depends(get_tracking_event_repo)],
):
    """Lista todos os eventos/etapas de um rastreio em ordem cronológica."""
    if not tracking_repo.get_by_id(tracking_id):
        _404("Rastreio", tracking_id)
    return event_repo.list_by_tracking(tracking_id)


@app.get("/trackings/{tracking_id}/qrcode", tags=["Rastreio do Café"])
def get_tracking_qrcode(
    tracking_id: str,
    base_url: str = Query("http://localhost:3000", description="URL base do frontend"),
    repo: Annotated[ICoffeeTrackingRepository, Depends(get_coffee_tracking_repo)] = None,
):
    """Gera e retorna o QR Code do rastreio como imagem PNG."""
    import qrcode
    import io

    tracking = repo.get_by_id(tracking_id)
    if not tracking:
        _404("Rastreio", tracking_id)

    url = f"{base_url}/rastreio/atualizar/{tracking.tracking_code}"

    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1A1A1A", back_color="#FFFFFF")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="image/png",
        headers={"Content-Disposition": f'inline; filename="qrcode-{tracking.tracking_code}.png"'},
    )

