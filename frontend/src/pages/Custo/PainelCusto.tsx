import { useEffect, useState } from 'react';
import { Calculator, DollarSign, Layers, Wheat, TrendingUp, Percent, RefreshCw } from 'lucide-react';
import { KPICard } from '../../components/ui/KPICard';
import { plotsApi, seasonsApi, costApi } from '../../services/api';
import type { Plot, Season, PlotSeasonCost } from '../../types';

const brl = (v: number | null | undefined) =>
  v == null ? '—' : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const num = (v: number | null | undefined, digits = 2) =>
  v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function PainelCusto() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [plotId, setPlotId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [cost, setCost] = useState<PlotSeasonCost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega talhões e safras para os seletores
  useEffect(() => {
    (async () => {
      try {
        const [plotsRes, seasonsRes] = await Promise.all([plotsApi.list(), seasonsApi.list()]);
        setPlots(plotsRes.data);
        setSeasons(seasonsRes.data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar talhões/safras');
      }
    })();
  }, []);

  // Recalcula o custo quando talhão e safra estão selecionados
  useEffect(() => {
    if (!plotId || !seasonId) { setCost(null); return; }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await costApi.plotSeasonCost(plotId, seasonId);
        setCost(res.data);
      } catch (err: any) {
        setError(err.message || 'Erro ao apurar o custo');
        setCost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [plotId, seasonId]);

  const margin = cost && cost.revenue > 0 ? (cost.gross_profit / cost.revenue) * 100 : null;
  const plotCode = plots.find((p) => p.id === plotId)?.code;
  const seasonName = seasons.find((s) => s.id === seasonId)?.name;

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-gold shadow-sm">
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Painel de Custo</h1>
          <p className="text-text-muted text-sm mt-0.5">Custo por talhão × safra, custo por saca e lucro bruto — calculado em tempo real</p>
        </div>
      </div>

      {/* Seletores */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col space-y-1.5 flex-1">
          <label className="text-sm font-medium text-text-primary">Talhão</label>
          <select className="input-base" value={plotId} onChange={(e) => setPlotId(e.target.value)}>
            <option value="">Selecione o talhão...</option>
            {plots.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
        </div>
        <div className="flex flex-col space-y-1.5 flex-1">
          <label className="text-sm font-medium text-text-primary">Safra</label>
          <select className="input-base" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
            <option value="">Selecione a safra...</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded bg-negative/10 border border-negative/20 text-negative-light text-sm mb-6">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-text-muted py-16">
          <RefreshCw className="animate-spin" size={20} /> Apurando custo...
        </div>
      )}

      {!loading && !cost && !error && (
        <div className="text-center text-text-muted py-16">
          <Calculator size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-text-primary mb-1">Selecione um talhão e uma safra</p>
          <p className="text-sm">O custo é apurado a partir dos lançamentos das atividades (insumos, mão de obra e hora-máquina).</p>
        </div>
      )}

      {!loading && cost && (
        <>
          <p className="text-sm text-text-muted mb-4">
            Apuração para <span className="text-gold font-semibold">{plotCode}</span> na safra{' '}
            <span className="text-gold font-semibold">{seasonName}</span> · área {num(cost.area_ha)} ha
          </p>

          {/* KPIs principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KPICard title="Custo Total" value={brl(cost.total_cost)} variant="gold" accent
              icon={<DollarSign size={18} />} subtitle="Insumos + mão de obra + máquina" />
            <KPICard title="Custo por Hectare" value={brl(cost.cost_per_hectare)} variant="default"
              icon={<Layers size={18} />} subtitle={`${num(cost.area_ha)} ha`} />
            <KPICard title="Custo por Saca" value={brl(cost.cost_per_sack)} variant="default"
              icon={<Wheat size={18} />}
              subtitle={cost.sacks_produced != null ? `${num(cost.sacks_produced)} sacas` : 'Sem produção lançada'} />
            <KPICard title="Receita" value={brl(cost.revenue)} variant="positive"
              icon={<TrendingUp size={18} />} subtitle="Vendas dos lotes na safra" />
            <KPICard title="Lucro Bruto" value={brl(cost.gross_profit)}
              variant={cost.gross_profit >= 0 ? 'positive' : 'negative'}
              icon={<DollarSign size={18} />} subtitle="Receita − custo total" />
            <KPICard title="Margem Bruta" value={margin != null ? `${num(margin, 1)}` : '—'} unit={margin != null ? '%' : undefined}
              variant={margin != null && margin >= 0 ? 'positive' : 'negative'}
              icon={<Percent size={18} />} subtitle="Lucro ÷ receita" />
          </div>

          {/* Composição do custo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Composição do Custo</h2>
              <CostBar label="Insumos" value={cost.supplies_cost} total={cost.total_cost} />
              <CostBar label="Mão de Obra" value={cost.labor_cost} total={cost.total_cost} />
              <CostBar label="Hora-Máquina" value={cost.machine_cost} total={cost.total_cost} />
            </div>

            {/* Custo por atividade */}
            <div className="card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-text-primary mb-4">
                Custo por Atividade ({cost.activities.length})
              </h2>
              {cost.activities.length === 0 ? (
                <p className="text-sm text-text-muted py-6 text-center">
                  Nenhuma atividade lançada nesta safra para este talhão.
                </p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-muted uppercase border-b border-border">
                      <tr>
                        <th className="py-2 pr-4 font-semibold">Atividade</th>
                        <th className="py-2 px-4 font-semibold text-right">Insumos</th>
                        <th className="py-2 px-4 font-semibold text-right">Mão de obra</th>
                        <th className="py-2 px-4 font-semibold text-right">Máquina</th>
                        <th className="py-2 pl-4 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {cost.activities.map((a) => (
                        <tr key={a.activity_id}>
                          <td className="py-2 pr-4 text-text-muted font-mono text-xs">{a.activity_id.slice(0, 8)}</td>
                          <td className="py-2 px-4 text-right text-text-muted">{brl(a.supplies_cost)}</td>
                          <td className="py-2 px-4 text-right text-text-muted">{brl(a.labor_cost)}</td>
                          <td className="py-2 px-4 text-right text-text-muted">{brl(a.machine_cost)}</td>
                          <td className="py-2 pl-4 text-right font-medium text-text-primary">{brl(a.total_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CostBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-primary font-medium">{brl(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-text-muted mt-1">{num(pct, 1)}%</p>
    </div>
  );
}
