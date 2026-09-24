// ─────────────────────────────────────────────────────────────────────────────
// TypeScript types mirroring the FastAPI Pydantic schemas
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────────────────────
export type UserRole       = 'ADMIN' | 'OPERATOR';
export type PlotStatus     = 'IN_PRODUCTION' | 'RENOVATION' | 'DEVELOPMENT';
export type ActivityType   = 'FERTILIZATION' | 'PRUNING' | 'HARVEST' | 'IRRIGATION' | 'PESTICIDE_APPLICATION';
export type ActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type CoffeeType     = 'NATURAL' | 'PULPED_NATURAL';
export type AlertType      = 'WEATHER' | 'AGRONOMIC' | 'SYSTEM';
export type SupplyCategory = 'FERTILIZER' | 'PESTICIDE' | 'CORRECTIVE' | 'FUEL';
export type WorkerType = 'REGISTERED' | 'THIRD_PARTY';
export type LaborType  = 'DIARIA' | 'SERVICO';
export type TransactionType     = 'INCOME' | 'EXPENSE';
export type TransactionCategory = 'SUPPLY' | 'LABOR' | 'COFFEE_SALE' | 'MAINTENANCE';
export type TransactionStatus   = 'PAID' | 'PENDING';

// ── Domain entities ───────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Farm {
  id: string;
  producer_id: string;
  name: string;
  total_area_ha: number;
}

export interface Plot {
  id: string;
  farm_id: string;
  code: string;
  area_ha: number;
  variety: string | null;
  planting_year: number | null;
  altitude_m?: number | null;
  status: PlotStatus;
}

export interface HarvestEstimate {
  id: string;
  plot_id: string;
  season: string;
  estimated_sacks: number | null;
  estimated_yield_per_ha: number | null;
  created_at: string;
}

export interface WeatherLog {
  id: string;
  farm_id: string;
  log_date: string;
  temperature_celsius: number | null;
  precipitation_mm: number | null;
  relative_humidity: number | null;
}

export interface SystemAlert {
  id: string;
  farm_id: string;
  plot_id: string | null;
  alert_type: AlertType;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AgriculturalActivity {
  id: string;
  plot_id: string;
  season_id?: string | null;
  recommendation_id: string | null;
  type: ActivityType;
  start_date: string;
  end_date: string | null;
  status: ActivityStatus;
  worked_hours: number | null;
  labor_cost: number | null;
}

export interface AgriculturalSupply {
  id: string;
  name: string;
  category: SupplyCategory;
  unit_of_measure: string;
  unit_cost: number;
  stock_quantity: number;
}

export interface TraceabilityBatch {
  id: string;
  plot_id: string;
  harvest_season: string;
  batch_code: string;
  coffee_type: CoffeeType;
  harvest_date: string;
  total_volume_measures: number;
}

export interface Sale {
  id: string;
  batch_id: string;
  shipment_invoice: string | null;
  destination_warehouse: string | null;
  sale_invoice: string | null;
  sale_date: string;
  customer: string;
  total_value: number;
}

export interface FinancialTransaction {
  id: string;
  farm_id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: TransactionStatus;
}

// ── Dashboard computed types (frontend-only) ──────────────────────────────────

export interface PlotKPI {
  totalArea: number;
  estimatedProduction: number;
  realizedProduction: number;
  averageYield: number;
  averageAge: number;
  activePlots: number;
}

export interface VarietyDistribution {
  name: string;
  value: number;
  color: string;
}

export interface AgeDistribution {
  range: string;
  count: number;
}

export interface AgronomicIndex {
  name: string;
  value: string;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export interface WeatherCurrent {
  temperature: number;
  humidity: number;
  precipitation: number;
  description: string;
  icon: string;
}

export interface FinancialKPI {
  totalCost: number;
  costPerSack: number;
  revenue: number;
  profit: number;
  margin: number;
  breakEven: number;
}

export interface CostBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyFinancial {
  month: string;
  cost: number;
  revenue: number;
  profit: number;
}

export interface PlotProfitability {
  code: string;
  variety: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  sacksProduced: number;
}

export interface DRELine {
  description: string;
  value: number;
  type: 'income' | 'cost' | 'result' | 'subtotal';
  indent?: boolean;
}

// ── Coffee Tracking ───────────────────────────────────────────────────────────

export type TrackingStage =
  | 'COLHEITA'
  | 'LAVADOR'
  | 'TERREIRO'
  | 'SECADOR'
  | 'TULHA'
  | 'BENEFICIAMENTO'
  | 'CLASSIFICACAO'
  | 'COMERCIALIZACAO'
  | 'FINALIZADO';

export type TrackingStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface TrackingEvent {
  id: string;
  tracking_id: string;
  stage: TrackingStage;
  notes: string | null;
  recorded_by: string | null;
  recorded_at: string;
}

export interface CoffeeTracking {
  id: string;
  tracking_code: string;
  batch_id: string;
  description: string;
  current_stage: TrackingStage;
  status: TrackingStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  events?: TrackingEvent[];
}

export const STAGE_LABELS: Record<TrackingStage, string> = {
  COLHEITA: 'Colheita',
  LAVADOR: 'Lavador',
  TERREIRO: 'Terreiro',
  SECADOR: 'Secador',
  TULHA: 'Tulha / Silo',
  BENEFICIAMENTO: 'Beneficiamento',
  CLASSIFICACAO: 'Classificação',
  COMERCIALIZACAO: 'Comercialização',
  FINALIZADO: 'Finalizado',
};

export const STAGE_ORDER: TrackingStage[] = [
  'COLHEITA',
  'LAVADOR',
  'TERREIRO',
  'SECADOR',
  'TULHA',
  'BENEFICIAMENTO',
  'CLASSIFICACAO',
  'COMERCIALIZACAO',
  'FINALIZADO',
];

// ── Domínio de custo (talhão × safra) ─────────────────────────────────────────

export interface Season {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface Production {
  id: string;
  plot_id: string;
  season_id: string;
  sacks_produced: number;
  harvest_date: string | null;
  notes: string | null;
}

export interface Machine {
  id: string;
  farm_id: string;
  name: string;
  hourly_cost: number;
}

export interface Worker {
  id: string;
  farm_id: string;
  name: string;
  type: WorkerType;
  daily_rate: number | null;
}

export interface ServiceDefinition {
  id: string;
  farm_id: string;
  name: string;
  unit_description: string | null;
  unit_value: number;
}

export interface PlotVariety {
  id: string;
  plot_id: string;
  variety: string;
  planting_year: number | null;
  area_ha: number | null;
}

export interface ActivitySupply {
  activity_id: string;
  supply_id: string;
  applied_quantity: number;
  total_cost: number;
}

export interface MachineUsage {
  id: string;
  activity_id: string;
  machine_id: string;
  hours: number;
}

export interface LaborEntry {
  id: string;
  activity_id: string;
  labor_type: LaborType;
  worker_id: string | null;
  service_definition_id: string | null;
  quantity: number;
  unit_value: number | null;
}

// ── Saídas do motor de custo (on-the-fly) ─────────────────────────────────────

export interface ActivityCostBreakdown {
  activity_id: string;
  supplies_cost: number;
  labor_cost: number;
  machine_cost: number;
  total_cost: number;
}

export interface PlotSeasonCost {
  plot_id: string;
  season_id: string;
  area_ha: number;
  supplies_cost: number;
  labor_cost: number;
  machine_cost: number;
  total_cost: number;
  cost_per_hectare: number | null;
  sacks_produced: number | null;
  cost_per_sack: number | null;
  revenue: number;
  gross_profit: number;
  activities: ActivityCostBreakdown[];
}

