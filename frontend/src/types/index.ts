// ─────────────────────────────────────────────────────────────────────────────
// TypeScript types mirroring the FastAPI Pydantic schemas
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────────────────────
export type UserRole       = 'PRODUCER' | 'AGRONOMIST' | 'OPERATOR';
export type PlotStatus     = 'IN_PRODUCTION' | 'RENOVATION' | 'DEVELOPMENT';
export type ActivityType   = 'FERTILIZATION' | 'PRUNING' | 'HARVEST' | 'IRRIGATION' | 'PESTICIDE_APPLICATION';
export type ActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type CoffeeType     = 'NATURAL' | 'PULPED_NATURAL';
export type AlertType      = 'WEATHER' | 'AGRONOMIC' | 'SYSTEM';
export type SupplyCategory = 'FERTILIZER' | 'PESTICIDE';
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
