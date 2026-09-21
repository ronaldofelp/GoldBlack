import axios from 'axios';
import type {
  Plot, Farm, HarvestEstimate, WeatherLog, SystemAlert,
  AgriculturalActivity, TraceabilityBatch, Sale, FinancialTransaction,
  CoffeeTracking, TrackingEvent,
} from '../types';


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

// Interceptor: repassa erros de forma legível
api.interceptors.response.use(
  (res: import('axios').AxiosResponse) => res,
  (err: import('axios').AxiosError) => {
    const data = err.response?.data as Record<string, unknown> | undefined;
    const msg = (data?.['detail'] as string) ?? err.message ?? 'Erro desconhecido';
    return Promise.reject(new Error(msg));
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Chamadas tipadas
// ─────────────────────────────────────────────────────────────────────────────

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
