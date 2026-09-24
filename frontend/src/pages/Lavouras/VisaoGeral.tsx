import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Leaf, TrendingUp, Activity, MapPin, AlertTriangle,
  RefreshCw, ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

import { KPICard } from '../../components/ui/KPICard';
import { ChartCard, CustomTooltip } from '../../components/ui/ChartCard';
import { AlertCard, EmptyAlerts } from '../../components/ui/AlertCard';
import { WeatherWidget } from '../../components/ui/WeatherWidget';
import {
  plotsApi, harvestEstimatesApi, weatherApi, alertsApi, activitiesApi,
  productionsApi, soilAnalysesApi,
} from '../../services/api';
import type {
  Plot, HarvestEstimate, WeatherLog, SystemAlert, AgriculturalActivity, Production,
} from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Dados mock de fallback (exibidos quando a API está offline)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PLOTS: Plot[] = [
  { id: '1', farm_id: 'f1', code: 'T-01', area_ha: 45.0, variety: 'Catuaí Vermelho',   planting_year: 2015, status: 'IN_PRODUCTION' },
  { id: '2', farm_id: 'f1', code: 'T-02', area_ha: 30.0, variety: 'Bourbon Amarelo',   planting_year: 2019, status: 'IN_PRODUCTION' },
  { id: '3', farm_id: 'f1', code: 'T-03', area_ha: 25.5, variety: 'Mundo Novo',        planting_year: 2022, status: 'DEVELOPMENT' },
  { id: '4', farm_id: 'f1', code: 'T-04', area_ha: 20.0, variety: 'Catuaí Amarelo',   planting_year: 2012, status: 'IN_PRODUCTION' },
];

const MOCK_ESTIMATES: HarvestEstimate[] = [
  { id: 'e1', plot_id: '1', season: '2025/2026', estimated_sacks: 1350, estimated_yield_per_ha: 30.0, created_at: '2025-03-01' },
  { id: 'e2', plot_id: '2', season: '2025/2026', estimated_sacks: 750,  estimated_yield_per_ha: 25.0, created_at: '2025-03-01' },
  { id: 'e3', plot_id: '4', season: '2025/2026', estimated_sacks: 480,  estimated_yield_per_ha: 24.0, created_at: '2025-03-01' },
];

const MOCK_WEATHER: WeatherLog[] = [
  { id: 'w1', farm_id: 'f1', log_date: '2025-07-12', temperature_celsius: 22.5, precipitation_mm: 12.3, relative_humidity: 75.0 },
];

const MOCK_ALERTS: SystemAlert[] = [
  { id: 'a1', farm_id: 'f1', plot_id: '1', alert_type: 'WEATHER',   message: 'Previsão de geada para os próximos 3 dias. Recomenda-se irrigação preventiva.', is_read: false, created_at: '2025-07-10T08:00:00' },
  { id: 'a2', farm_id: 'f1', plot_id: null, alert_type: 'AGRONOMIC', message: 'Período crítico de floração. Evitar aplicação de defensivos nas próximas 48h.', is_read: false, created_at: '2025-07-09T14:00:00' },
];

const MOCK_ACTIVITIES: AgriculturalActivity[] = [
  { id: 'ac1', plot_id: '1', recommendation_id: null, type: 'FERTILIZATION',        start_date: '2025-07-05', end_date: '2025-07-07', status: 'COMPLETED',  worked_hours: 16, labor_cost: 480 },
  { id: 'ac2', plot_id: '2', recommendation_id: null, type: 'IRRIGATION',           start_date: '2025-07-08', end_date: null,          status: 'IN_PROGRESS', worked_hours: 4,  labor_cost: 120 },
  { id: 'ac3', plot_id: '3', recommendation_id: null, type: 'PESTICIDE_APPLICATION',start_date: '2025-07-10', end_date: null,          status: 'PENDING',     worked_hours: null, labor_cost: null },
  { id: 'ac4', plot_id: '4', recommendation_id: null, type: 'PRUNING',              start_date: '2025-06-20', end_date: '2025-06-25', status: 'COMPLETED',  worked_hours: 40, labor_cost: 1200 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Auxiliares
// ─────────────────────────────────────────────────────────────────────────────

const VARIETY_COLORS = ['#C5A059', '#D4B47A', '#8B6914', '#F0D080', '#6B4F12', '#E8C866'];

const ACTIVITY_LABELS: Record<string, string> = {
  FERTILIZATION: 'Adubação', PRUNING: 'Poda', HARVEST: 'Colheita',
  IRRIGATION: 'Irrigação', PESTICIDE_APPLICATION: 'Defensivo',
};

const STATUS_BADGE: Record<string, string> = {
  COMPLETED:   'badge-positive',
  IN_PROGRESS: 'badge-info',
  PENDING:     'badge-warning',
};
const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Concluído', IN_PROGRESS: 'Em andamento', PENDING: 'Pendente',
};

const PLOT_STATUS_BADGE: Record<string, string> = {
  IN_PRODUCTION: 'badge-positive',
  RENOVATION:    'badge-warning',
  DEVELOPMENT:   'badge-info',
};
const PLOT_STATUS_LABEL: Record<string, string> = {
  IN_PRODUCTION: 'Em Produção', RENOVATION: 'Renovação', DEVELOPMENT: 'Desenvolvimento',
};

function calcAge(year: number | null): string {
  if (!year) return '—';
  return `${new Date().getFullYear() - year} anos`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────────

export function VisaoGeral() {
  const [plots, setPlots]             = useState<Plot[]>(MOCK_PLOTS);
  const [estimates, setEstimates]     = useState<HarvestEstimate[]>(MOCK_ESTIMATES);
  const [weather, setWeather]         = useState<WeatherLog[]>(MOCK_WEATHER);
  const [alerts, setAlerts]           = useState<SystemAlert[]>(MOCK_ALERTS);
  const [activities, setActivities]   = useState<AgriculturalActivity[]>(MOCK_ACTIVITIES);
  const [productions, setProductions] = useState<Production[]>([]);
  const [soil, setSoil]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [usingMock, setUsingMock]     = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [p, e, w, a, ac] = await Promise.all([
          plotsApi.list(),
          harvestEstimatesApi.list(),
          weatherApi.list(),
          alertsApi.list(undefined, false),
          activitiesApi.list(),
        ]);
        // Sucesso manda: dados reais mesmo que vazios (não mascarar com mock).
        setPlots(p.data);
        setEstimates(e.data);
        setWeather(w.data);
        setAlerts(a.data);
        setActivities(ac.data);
      } catch {
        setUsingMock(true); // backend indisponível → dados de demonstração
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Produção realizada + solo vêm do domínio de custo (backend novo); fetch isolado
  // para não regredir os dados acima quando esses endpoints não existirem (backend antigo).
  useEffect(() => {
    (async () => {
      const [prR, soR] = await Promise.allSettled([productionsApi.list(), soilAnalysesApi.list()]);
      if (prR.status === 'fulfilled' && prR.value.data.length) setProductions(prR.value.data);
      if (soR.status === 'fulfilled' && soR.value.data.length) setSoil(soR.value.data);
    })();
  }, []);

  // ── Valores calculados ────────────────────────────────────────────────────────

  const totalArea       = plots.reduce((s, p) => s + Number(p.area_ha), 0);
  const activePlots     = plots.filter((p) => p.status === 'IN_PRODUCTION').length;
  const totalEstimated  = estimates.reduce((s, e) => s + Number(e.estimated_sacks ?? 0), 0);
  const avgYield        = totalArea > 0 ? totalEstimated / totalArea : 0;
  const totalRealized   = productions.reduce((s, p) => s + Number(p.sacks_produced ?? 0), 0);
  const realizedTrend   = totalEstimated > 0 && totalRealized > 0
    ? +(((totalRealized - totalEstimated) / totalEstimated) * 100).toFixed(1)
    : undefined;
  const avgAge          = (() => {
    const withYear = plots.filter((p) => p.planting_year);
    if (!withYear.length) return 0;
    const curr = new Date().getFullYear();
    return withYear.reduce((s, p) => s + (curr - p.planting_year!), 0) / withYear.length;
  })();

  // Distribuição de variedades (gráfico de pizza)
  const varietyMap = new Map<string, number>();
  plots.forEach((p) => {
    const key = p.variety ?? 'Outros';
    varietyMap.set(key, (varietyMap.get(key) ?? 0) + Number(p.area_ha));
  });
  const varietyData = Array.from(varietyMap.entries()).map(([name, value], i) => ({
    name, value: +Number(value).toFixed(1), color: VARIETY_COLORS[i % VARIETY_COLORS.length],
  }));

  // Distribuição por idade (gráfico de barras)
  const ageRanges = [
    { range: '< 5 anos',  min: 0,  max: 4  },
    { range: '5–10 anos', min: 5,  max: 10 },
    { range: '10–15 anos',min: 11, max: 15 },
    { range: '> 15 anos', min: 16, max: 999 },
  ];
  const curr = new Date().getFullYear();
  const ageData = ageRanges.map(({ range, min, max }) => ({
    range,
    count: plots.filter((p) => {
      if (!p.planting_year) return false;
      const age = curr - p.planting_year;
      return age >= min && age <= max;
    }).length,
  }));

  // Clima mais recente
  const latestWeather = [...weather].sort((a, b) => b.log_date.localeCompare(a.log_date))[0];

  // Índices agronômicos — pH e matéria orgânica REAIS das análises de solo;
  // índice de produtividade calculado. Só entra o que tem fonte de dado.
  const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
  const avgPh = avg(soil.map((a) => a.ph).filter((v): v is number => v != null).map(Number));
  const avgOm = avg(soil.map((a) => a.organic_matter).filter((v): v is number => v != null).map(Number));
  const agronomicIndices: { name: string; value: string; unit: string; status: 'good' | 'warning' | 'critical' }[] = [
    ...(avgPh != null ? [{ name: 'pH Médio do Solo', value: avgPh.toFixed(1), unit: '', status: (avgPh >= 5.5 && avgPh <= 6.5 ? 'good' : 'warning') as 'good' | 'warning' }] : []),
    ...(avgOm != null ? [{ name: 'Matéria Orgânica', value: avgOm.toFixed(1), unit: '%', status: (avgOm >= 3 ? 'good' : 'warning') as 'good' | 'warning' }] : []),
    { name: 'Índice Produtividade', value: avgYield.toFixed(1), unit: 'sc/ha', status: (avgYield >= 25 ? 'good' : 'warning') as 'good' | 'warning' },
  ];

  const unreadAlerts = alerts.filter((a) => !a.is_read);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho da página ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
            <Leaf size={14} className="text-gold" />
            <span>Lavouras</span>
            <ChevronRight size={12} />
            <span className="text-gold font-medium">Visão Geral</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Visão Geral das Lavouras</h1>
          <p className="text-text-muted text-sm mt-0.5">Safra 2025/2026 — Fazenda Ouro Preto</p>
          {usingMock && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold bg-gold/15 text-gold border border-gold/30">
              Dados de demonstração — backend indisponível
            </span>
          )}
        </div>
        <button className="btn-secondary">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {/* ── Linha de KPIs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          title="Área Total Plantada"
          value={totalArea.toFixed(1)}
          unit="ha"
          subtitle={`${activePlots} talhões ativos`}
          icon={<MapPin size={18} />}
          variant="gold"
          accent
        />
        <KPICard
          title="Produção Estimada"
          value={totalEstimated.toLocaleString('pt-BR')}
          unit="sacas"
          subtitle="Safra atual"
          icon={<TrendingUp size={18} />}
          variant="positive"
        />
        <KPICard
          title="Produção Realizada"
          value={totalRealized > 0 ? totalRealized.toLocaleString('pt-BR') : '—'}
          unit={totalRealized > 0 ? 'sacas' : ''}
          subtitle={totalRealized > 0 ? 'Sacas colhidas (real)' : 'Sem apontamento de colheita'}
          trend={realizedTrend}
          icon={<TrendingUp size={18} />}
          variant="default"
        />
        <KPICard
          title="Rendimento Médio"
          value={avgYield.toFixed(1)}
          unit="sc/ha"
          subtitle="Meta: 30 sc/ha"
          icon={<Activity size={18} />}
          variant={avgYield >= 28 ? 'positive' : 'gold'}
        />
        <KPICard
          title="Idade Média"
          value={avgAge.toFixed(0)}
          unit="anos"
          subtitle="Lavoura madura"
          icon={<Leaf size={18} />}
          variant="default"
        />
      </div>

      {/* ── Linha de gráficos ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de pizza de variedades */}
        <ChartCard
          title="Distribuição por Variedade"
          subtitle="Área total por cultivar (ha)"
          minHeight={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={varietyData}
                cx="40%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {varietyData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip formatter={(v: number) => [`${v} ha`, 'Área']} />}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gráfico de barras por idade */}
        <ChartCard
          title="Faixa Etária da Lavoura"
          subtitle="Quantidade de talhões por idade"
          minHeight={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => [`${v} talhões`, 'Quantidade']} />} />
              <Bar dataKey="count" fill="#C5A059" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Tabelas + painéis laterais ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabela de atividades */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="section-title">Atividades Recentes</h3>
            <button className="text-xs text-gold hover:underline">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/40">
                  <th className="table-header text-left">Talhão</th>
                  <th className="table-header text-left">Tipo</th>
                  <th className="table-header text-left">Início</th>
                  <th className="table-header text-left">H. Trabalhadas</th>
                  <th className="table-header text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 6).map((act) => {
                  const plot = plots.find((p) => p.id === act.plot_id);
                  return (
                    <tr key={act.id} className="table-row">
                      <td className="table-cell font-medium text-gold">{plot?.code ?? '—'}</td>
                      <td className="table-cell">{ACTIVITY_LABELS[act.type] ?? act.type}</td>
                      <td className="table-cell text-text-muted">
                        {new Date(act.start_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="table-cell text-text-muted">
                        {act.worked_hours != null ? `${act.worked_hours}h` : '—'}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${STATUS_BADGE[act.status]}`}>
                          {STATUS_LABEL[act.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coluna à direita: alertas + clima */}
        <div className="flex flex-col gap-4">
          {/* Alertas */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="section-title">Alertas</h3>
                {unreadAlerts.length > 0 && (
                  <span className="badge badge-negative">{unreadAlerts.length}</span>
                )}
              </div>
              <AlertTriangle size={15} className="text-warning" />
            </div>
            <div className="p-4 space-y-3 max-h-56 overflow-y-auto">
              {alerts.length === 0
                ? <EmptyAlerts />
                : alerts.slice(0, 4).map((a) => (
                    <AlertCard key={a.id} id={a.id} type={a.alert_type} message={a.message} createdAt={a.created_at} isRead={a.is_read} />
                  ))
              }
            </div>
          </div>

          {/* Clima */}
          <WeatherWidget
            temperature={latestWeather?.temperature_celsius ?? 22}
            humidity={latestWeather?.relative_humidity ?? 70}
            precipitation={latestWeather?.precipitation_mm ?? 0}
          />
        </div>
      </div>

      {/* ── Tabela de talhões ──────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="section-title">Talhões</h3>
          <button className="btn-secondary text-xs px-3 py-1.5">
            + Novo Talhão
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/40">
                {['Código', 'Variedade', 'Área (ha)', 'Ano Plantio', 'Idade', 'Est. Safra (sc)', 'Status'].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plots.map((plot) => {
                const est = estimates.find((e) => e.plot_id === plot.id);
                return (
                  <tr key={plot.id} className="table-row cursor-pointer">
                    <td className="table-cell font-bold text-gold">{plot.code}</td>
                    <td className="table-cell">{plot.variety ?? '—'}</td>
                    <td className="table-cell font-medium">{plot.area_ha}</td>
                    <td className="table-cell text-text-muted">{plot.planting_year ?? '—'}</td>
                    <td className="table-cell text-text-muted">{calcAge(plot.planting_year)}</td>
                    <td className="table-cell font-medium">
                      {est?.estimated_sacks?.toLocaleString('pt-BR') ?? '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${PLOT_STATUS_BADGE[plot.status]}`}>
                        {PLOT_STATUS_LABEL[plot.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Índices agronômicos ────────────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Índices Agronômicos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {agronomicIndices.map((idx) => (
            <div
              key={idx.name}
              className={clsx(
                'flex flex-col gap-2 p-3 rounded-lg border',
                idx.status === 'good'     && 'border-positive/30 bg-positive/5',
                idx.status === 'warning'  && 'border-warning/30 bg-warning/5',
                idx.status === 'critical' && 'border-negative/30 bg-negative/5',
              )}
            >
              <p className="text-xs text-text-muted leading-tight">{idx.name}</p>
              <div className="flex items-baseline gap-1">
                <span
                  className={clsx(
                    'text-xl font-bold',
                    idx.status === 'good'     && 'text-positive-light',
                    idx.status === 'warning'  && 'text-warning',
                    idx.status === 'critical' && 'text-negative-light',
                  )}
                >
                  {idx.value}
                </span>
                {idx.unit && <span className="text-xs text-text-muted">{idx.unit}</span>}
              </div>
              <div className={clsx(
                'h-1 rounded-full',
                idx.status === 'good'     && 'bg-positive/40',
                idx.status === 'warning'  && 'bg-warning/40',
                idx.status === 'critical' && 'bg-negative/40',
              )} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
