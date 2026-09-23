import axios from 'axios';
import type {
  Plot, Farm, HarvestEstimate, WeatherLog, SystemAlert,
  AgriculturalActivity, TraceabilityBatch, Sale, FinancialTransaction,
  CoffeeTracking, TrackingEvent,
  Season, Production, Machine, Worker, ServiceDefinition, PlotVariety,
  ActivitySupply, MachineUsage, LaborEntry,
  ActivityCostBreakdown, PlotSeasonCost,
  LoginResponse, AuthUser,
} from '../types';

export const TOKEN_KEY = '@GoldBlack:token';
export const USER_KEY = '@GoldBlack:user';


const getBaseUrl = () => {

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {

    return `http://${window.location.hostname}:8000`;
  }

  return 'http://localhost:8000';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de requisição: anexa o token JWT (Bearer) quando existir
api.interceptors.request.use((config: import('axios').InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Interceptor de resposta: repassa erros de forma legível + trata sessão expirada (401)
api.interceptors.response.use(
  (res: import('axios').AxiosResponse) => res,
  (err: import('axios').AxiosError) => {
    const status = err.response?.status;
    const url = err.config?.url ?? '';
    const isLoginAttempt = url.includes('/auth/login');

    // Token ausente/expirado/inválido: limpa sessão e manda pro login
    if (status === 401 && !isLoginAttempt && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    const data = err.response?.data as Record<string, unknown> | undefined;
    const msg = (data?.['detail'] as string) ?? err.message ?? 'Erro desconhecido';
    return Promise.reject(new Error(msg));
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Chamadas tipadas
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  me: () => api.get<AuthUser>('/auth/me'),
};

export const plotsApi = {
  list: (farmId?: string) =>
    api.get<Plot[]>('/plots', { params: farmId ? { farm_id: farmId } : {} }),
  getById: (id: string) => api.get<Plot>(`/plots/${id}`),
  create: (data: Omit<Plot, 'id'>) => api.post<Plot>('/plots', data),
};

export const farmsApi = {
  list: () => api.get<Farm[]>('/farms'),
  getById: (id: string) => api.get<Farm>(`/farms/${id}`),
  create: (data: Omit<Farm, 'id'>) => api.post<Farm>('/farms', data),
};

export const harvestEstimatesApi = {
  list: (plotId?: string) =>
    api.get<HarvestEstimate[]>('/harvest-estimates', { params: plotId ? { plot_id: plotId } : {} }),
  create: (data: Omit<HarvestEstimate, 'id' | 'created_at'>) => api.post<HarvestEstimate>('/harvest-estimates', data),
};

export const soilAnalysesApi = {
  list: (plotId?: string) =>
    api.get<any[]>('/soil-analyses', { params: plotId ? { plot_id: plotId } : {} }),
  create: (data: Omit<any, 'id'>) => api.post<any>('/soil-analyses', data),
};

export const weatherApi = {
  list: (farmId?: string) =>
    api.get<WeatherLog[]>('/weather-logs', { params: farmId ? { farm_id: farmId } : {} }),
  create: (data: Omit<WeatherLog, 'id'>) => api.post<WeatherLog>('/weather-logs', data),
};

export const alertsApi = {
  list: (farmId?: string, unreadOnly = false) =>
    api.get<SystemAlert[]>('/alerts', {
      params: { ...(farmId ? { farm_id: farmId } : {}), unread_only: unreadOnly },
    }),
  markRead: (id: string) => api.patch<SystemAlert>(`/alerts/${id}`, { is_read: true }),
  create: (data: Omit<SystemAlert, 'id' | 'created_at' | 'is_read'>) => api.post<SystemAlert>('/alerts', data),
};

export const suppliesApi = {
  list: (category?: string) =>
    api.get<any[]>('/supplies', { params: category ? { category } : {} }),
  create: (data: Omit<any, 'id'>) => api.post<any>('/supplies', data),
};

export const activitiesApi = {
  list: (plotId?: string) =>
    api.get<AgriculturalActivity[]>('/activities', { params: plotId ? { plot_id: plotId } : {} }),
  create: (data: Omit<AgriculturalActivity, 'id'>) => api.post<AgriculturalActivity>('/activities', data),
};

export const batchesApi = {
  list: (plotId?: string) =>
    api.get<TraceabilityBatch[]>('/batches', { params: plotId ? { plot_id: plotId } : {} }),
  create: (data: Omit<TraceabilityBatch, 'id'>) => api.post<TraceabilityBatch>('/batches', data),
};

export const salesApi = {
  list: () => api.get<Sale[]>('/sales'),
  create: (data: Omit<Sale, 'id'>) => api.post<Sale>('/sales', data),
};

export const transactionsApi = {
  list: (farmId?: string) =>
    api.get<FinancialTransaction[]>('/transactions', { params: farmId ? { farm_id: farmId } : {} }),
  create: (data: Omit<FinancialTransaction, 'id'>) => api.post<FinancialTransaction>('/transactions', data),
};

export const healthApi = {
  check: () => api.get<{ status: string; service: string; version: string }>('/health'),
};

export const trackingsApi = {
  list: (status?: string) =>
    api.get<CoffeeTracking[]>('/trackings', { params: status ? { status } : {} }),
  getById: (id: string) => api.get<CoffeeTracking>(`/trackings/${id}`),
  getByCode: (code: string) => api.get<CoffeeTracking>(`/trackings/code/${code}`),
  create: (data: { batch_id: string; description: string }) =>
    api.post<CoffeeTracking>('/trackings', data),
  update: (id: string, data: { description?: string; status?: string }) =>
    api.patch<CoffeeTracking>(`/trackings/${id}`, data),
  delete: (id: string) => api.delete(`/trackings/${id}`),
  addEvent: (id: string, data: { stage: string; notes?: string; recorded_by?: string }) =>
    api.post<TrackingEvent>(`/trackings/${id}/events`, data),
  getEvents: (id: string) => api.get<TrackingEvent[]>(`/trackings/${id}/events`),
  getQRCodeUrl: (id: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${api.defaults.baseURL}/trackings/${id}/qrcode?base_url=${encodeURIComponent(baseUrl)}`;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Domínio de custo (talhão × safra)
// ─────────────────────────────────────────────────────────────────────────────

export const seasonsApi = {
  list: () => api.get<Season[]>('/seasons'),
  getById: (id: string) => api.get<Season>(`/seasons/${id}`),
  create: (data: Omit<Season, 'id'>) => api.post<Season>('/seasons', data),
  update: (id: string, data: Partial<Omit<Season, 'id'>>) => api.patch<Season>(`/seasons/${id}`, data),
  delete: (id: string) => api.delete(`/seasons/${id}`),
};

export const productionsApi = {
  list: (plotId?: string) =>
    api.get<Production[]>('/productions', { params: plotId ? { plot_id: plotId } : {} }),
  create: (data: Omit<Production, 'id'>) => api.post<Production>('/productions', data),
  update: (id: string, data: Partial<Omit<Production, 'id'>>) => api.patch<Production>(`/productions/${id}`, data),
  delete: (id: string) => api.delete(`/productions/${id}`),
};

export const machinesApi = {
  list: (farmId?: string) =>
    api.get<Machine[]>('/machines', { params: farmId ? { farm_id: farmId } : {} }),
  create: (data: Omit<Machine, 'id'>) => api.post<Machine>('/machines', data),
  update: (id: string, data: Partial<Omit<Machine, 'id'>>) => api.patch<Machine>(`/machines/${id}`, data),
  delete: (id: string) => api.delete(`/machines/${id}`),
};

export const workersApi = {
  list: (farmId?: string) =>
    api.get<Worker[]>('/workers', { params: farmId ? { farm_id: farmId } : {} }),
  create: (data: Omit<Worker, 'id'>) => api.post<Worker>('/workers', data),
  update: (id: string, data: Partial<Omit<Worker, 'id'>>) => api.patch<Worker>(`/workers/${id}`, data),
  delete: (id: string) => api.delete(`/workers/${id}`),
};

export const serviceDefinitionsApi = {
  list: (farmId?: string) =>
    api.get<ServiceDefinition[]>('/service-definitions', { params: farmId ? { farm_id: farmId } : {} }),
  create: (data: Omit<ServiceDefinition, 'id'>) => api.post<ServiceDefinition>('/service-definitions', data),
  update: (id: string, data: Partial<Omit<ServiceDefinition, 'id'>>) => api.patch<ServiceDefinition>(`/service-definitions/${id}`, data),
  delete: (id: string) => api.delete(`/service-definitions/${id}`),
};

export const plotVarietiesApi = {
  list: (plotId?: string) =>
    api.get<PlotVariety[]>('/plot-varieties', { params: plotId ? { plot_id: plotId } : {} }),
  create: (data: Omit<PlotVariety, 'id'>) => api.post<PlotVariety>('/plot-varieties', data),
  delete: (id: string) => api.delete(`/plot-varieties/${id}`),
};

// Lançamentos de custo dentro de uma atividade
export const activityCostApi = {
  listSupplies: (activityId: string) =>
    api.get<ActivitySupply[]>(`/activities/${activityId}/supplies`),
  addSupply: (activityId: string, data: { supply_id: string; applied_quantity: number; total_cost?: number | null }) =>
    api.post<ActivitySupply>(`/activities/${activityId}/supplies`, data),
  removeSupply: (activityId: string, supplyId: string) =>
    api.delete(`/activities/${activityId}/supplies/${supplyId}`),

  listLabor: (activityId: string) =>
    api.get<LaborEntry[]>(`/activities/${activityId}/labor`),
  addLabor: (activityId: string, data: Omit<LaborEntry, 'id' | 'activity_id'>) =>
    api.post<LaborEntry>(`/activities/${activityId}/labor`, data),
  removeLabor: (activityId: string, entryId: string) =>
    api.delete(`/activities/${activityId}/labor/${entryId}`),

  listMachineUsage: (activityId: string) =>
    api.get<MachineUsage[]>(`/activities/${activityId}/machine-usage`),
  addMachineUsage: (activityId: string, data: { machine_id: string; hours: number }) =>
    api.post<MachineUsage>(`/activities/${activityId}/machine-usage`, data),
  removeMachineUsage: (activityId: string, usageId: string) =>
    api.delete(`/activities/${activityId}/machine-usage/${usageId}`),
};

// Agregação de custo (calculada on-the-fly no backend)
export const costApi = {
  activityCost: (activityId: string) =>
    api.get<ActivityCostBreakdown>(`/activities/${activityId}/cost`),
  plotSeasonCost: (plotId: string, seasonId: string) =>
    api.get<PlotSeasonCost>(`/plots/${plotId}/seasons/${seasonId}/cost`),
};
