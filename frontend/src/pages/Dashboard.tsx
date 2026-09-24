import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, TrendingUp, DollarSign, Target, Activity, AlertTriangle,
  Leaf, Sprout, ScanLine, Calculator, PackageSearch, ChevronRight,
  RefreshCw, TrendingDown,
} from 'lucide-react';

import { KPICard } from '../components/ui/KPICard';
import { AlertCard, EmptyAlerts } from '../components/ui/AlertCard';
import { WeatherWidget } from '../components/ui/WeatherWidget';
import {
  plotsApi, harvestEstimatesApi, transactionsApi, alertsApi,
  activitiesApi, weatherApi, seasonsApi, costApi,
} from '../services/api';
import type {
  Plot, HarvestEstimate, FinancialTransaction, SystemAlert,
  AgriculturalActivity, WeatherLog, Season, PlotSeasonCost,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Rótulos e formatação
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  FERTILIZATION: 'Adubação', PRUNING: 'Poda', HARVEST: 'Colheita',
  IRRIGATION: 'Irrigação', PESTICIDE_APPLICATION: 'Defensivo',
};
const STATUS_BADGE: Record<string, string> = {
  IN_PROGRESS: 'badge-info', PENDING: 'badge-warning',
};
const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'Em andamento', PENDING: 'Pendente',
};

// Cartões de acesso rápido aos módulos mais usados no dia a dia
const QUICK_LINKS: { to: string; label: string; desc: string; icon: React.ReactNode }[] = [
  { to: '/lavouras',   label: 'Lavouras',   desc: 'Talhões e atividades',   icon: <Leaf size={18} /> },
  { to: '/producao',   label: 'Produção',   desc: 'Colheita e lotes',       icon: <Sprout size={18} /> },
  { to: '/custo',      label: 'Custo',      desc: 'Custo por talhão/safra', icon: <Calculator size={18} /> },
  { to: '/financeiro', label: 'Financeiro', desc: 'Receita, custo e lucro', icon: <DollarSign size={18} /> },
  { to: '/rastreio',   label: 'Rastreio',   desc: 'QR Code dos lotes',      icon: <ScanLine size={18} /> },
  { to: '/vendas',     label: 'Vendas',     desc: 'Comercialização',        icon: <PackageSearch size={18} /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// Página — Painel Geral (visão consolidada da fazenda)
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardHome() {
  const [plots, setPlots]           = useState<Plot[]>([]);
  const [estimates, setEstimates]   = useState<HarvestEstimate[]>([]);
  const [transactions, setTx]       = useState<FinancialTransaction[]>([]);
  const [alerts, setAlerts]         = useState<SystemAlert[]>([]);
  const [activities, setActivities] = useState<AgriculturalActivity[]>([]);
  const [weather, setWeather]       = useState<WeatherLog[]>([]);
  const [seasonName, setSeasonName] = useState<string | null>(null);
  const [totalSacks, setTotalSacks] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [offline, setOffline]       = useState(false);

  // Carrega os dados de resumo. Usa allSettled para que a falta de um endpoint
  // (backend antigo) não zere a página inteira — cada fonte cai para vazio.
  useEffect(() => {
    (async () => {
      const [p, e, t, a, ac, w] = await Promise.allSettled([
        plotsApi.list(),
        harvestEstimatesApi.list(),
        transactionsApi.list(),
        alertsApi.list(undefined, false),
        activitiesApi.list(),
        weatherApi.list(),
      ]);
      if (p.status === 'fulfilled') setPlots(p.value.data);
      if (e.status === 'fulfilled') setEstimates(e.value.data);
      if (t.status === 'fulfilled') setTx(t.value.data);
      if (a.status === 'fulfilled') setAlerts(a.value.data);
      if (ac.status === 'fulfilled') setActivities(ac.value.data);
      if (w.status === 'fulfilled') setWeather(w.value.data);
      // Sinaliza offline só quando tudo falhou (backend fora do ar)
      if ([p, e, t, a, ac, w].every((r) => r.status === 'rejected')) setOffline(true);
      setLoading(false);
    })();
  }, []);

  // Sacas produzidas na safra mais recente (motor de custo) → base do custo/saca
  useEffect(() => {
    (async () => {
      try {
        const [ps, ss] = await Promise.all([plotsApi.list(), seasonsApi.list()]);
        const seasons: Season[] = ss.data;
        if (!seasons.length || !ps.data.length) return;
        const latest = seasons[seasons.length - 1];
        setSeasonName(latest.name);
        const results = await Promise.allSettled(
          ps.data.map((pl) => costApi.plotSeasonCost(pl.id, latest.id)),
        );
        const sacks = results.reduce((s, r) => {
          if (r.status !== 'fulfilled') return s;
          return s + (Number((r.value.data as PlotSeasonCost).sacks_produced) || 0);
        }, 0);
        setTotalSacks(sacks);
      } catch {
        /* endpoints de custo indisponíveis — custo/saca fica indefinido */
      }
    })();
  }, []);

  // ── Valores calculados ────────────────────────────────────────────────────
  const totalArea      = plots.reduce((s, p) => s + Number(p.area_ha), 0);
  const activePlots    = plots.filter((p) => p.status === 'IN_PRODUCTION').length;
  const totalEstimated = estimates.reduce((s, e) => s + Number(e.estimated_sacks ?? 0), 0);
  const revenue        = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const totalCost      = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
  const profit         = revenue - totalCost;
  const margin         = revenue > 0 ? (profit / revenue) * 100 : 0;
  const costPerSack    = totalSacks > 0 ? totalCost / totalSacks : null;

  const openActivities = activities
    .filter((a) => a.status !== 'COMPLETED')
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 6);
  const unreadAlerts   = alerts.filter((a) => !a.is_read);
  const latestWeather  = [...weather].sort((a, b) => b.log_date.localeCompare(a.log_date))[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold-shimmer">Painel Geral</h1>
          <p className="text-text-muted text-sm mt-0.5">
            GoldBlack Coffee — visão consolidada da fazenda{seasonName ? ` · Safra ${seasonName}` : ''}
          </p>
          {offline && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold bg-negative/15 text-negative-light border border-negative/30">
              Backend indisponível — dados não carregados
            </span>
          )}
        </div>
      </div>

      {/* ── Linha de KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Área Total"
          value={totalArea.toFixed(1)}
          unit="ha"
          subtitle={`${activePlots} talhões ativos`}
          icon={<MapPin size={18} />}
          variant="gold"
          accent
        />
        <KPICard
          title="Produção Estimada"
          value={totalEstimated > 0 ? totalEstimated.toLocaleString('pt-BR') : '—'}
          unit={totalEstimated > 0 ? 'sacas' : ''}
          subtitle="Safra atual"
          icon={<TrendingUp size={18} />}
          variant="default"
        />
        <KPICard
          title="Receita"
          value={`R$ ${(revenue / 1000).toFixed(0)}k`}
          subtitle="Vendas realizadas"
          icon={<TrendingUp size={18} />}
          variant="positive"
        />
        <KPICard
          title="Custo Total"
          value={`R$ ${(totalCost / 1000).toFixed(0)}k`}
          subtitle="Despesas lançadas"
          icon={<DollarSign size={18} />}
          variant="default"
        />
        <KPICard
          title="Lucro / Prejuízo"
          value={`R$ ${(profit / 1000).toFixed(0)}k`}
          subtitle={`Margem ${margin.toFixed(1)}%`}
          icon={profit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          variant={profit >= 0 ? 'positive' : 'negative'}
          accent={profit >= 0}
        />
        <KPICard
          title="Custo / Saca"
          value={costPerSack != null ? `R$ ${costPerSack.toFixed(0)}` : '—'}
          subtitle={totalSacks > 0 ? `${totalSacks} sacas produzidas` : 'Sem produção lançada'}
          icon={<Target size={18} />}
          variant="gold"
        />
      </div>

      {/* ── Atividades em aberto + Alertas/Clima ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Atividades em aberto */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-gold" />
              <h3 className="section-title">Atividades em Aberto</h3>
            </div>
            <Link to="/lavouras/atividades" className="text-xs text-gold hover:underline">
              Ver todas
            </Link>
          </div>
          {openActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-text-muted">
              <Activity size={28} className="opacity-40" />
              <p className="text-xs">Nenhuma atividade pendente ou em andamento</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/40">
                    <th className="table-header text-left">Talhão</th>
                    <th className="table-header text-left">Tipo</th>
                    <th className="table-header text-left">Início</th>
                    <th className="table-header text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {openActivities.map((act) => {
                    const plot = plots.find((p) => p.id === act.plot_id);
                    return (
                      <tr key={act.id} className="table-row">
                        <td className="table-cell font-medium text-gold">{plot?.code ?? '—'}</td>
                        <td className="table-cell">{ACTIVITY_LABELS[act.type] ?? act.type}</td>
                        <td className="table-cell text-text-muted">
                          {new Date(act.start_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${STATUS_BADGE[act.status] ?? 'badge-info'}`}>
                            {STATUS_LABEL[act.status] ?? act.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Coluna à direita: alertas + clima */}
        <div className="flex flex-col gap-4">
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
                    <AlertCard
                      key={a.id}
                      id={a.id}
                      type={a.alert_type}
                      message={a.message}
                      createdAt={a.created_at}
                      isRead={a.is_read}
                    />
                  ))
              }
            </div>
          </div>

          <WeatherWidget
            temperature={latestWeather?.temperature_celsius ?? 22}
            humidity={latestWeather?.relative_humidity ?? 70}
            precipitation={latestWeather?.precipitation_mm ?? 0}
          />
        </div>
      </div>

      {/* ── Acesso rápido aos módulos ─────────────────────────────────────────── */}
      <div>
        <h3 className="section-title mb-3">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="card p-4 flex flex-col gap-3 hover:border-gold/40 transition-colors duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gold/15 text-gold">
                  {link.icon}
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-gold transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{link.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
