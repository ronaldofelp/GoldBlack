import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  RefreshCw, ChevronRight, Target, AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

import { KPICard } from '../../components/ui/KPICard';
import { ChartCard, CustomTooltip } from '../../components/ui/ChartCard';
import { transactionsApi, salesApi, plotsApi, seasonsApi, costApi } from '../../services/api';
import type { FinancialTransaction, Sale, Plot, Season, PlotSeasonCost } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Dados mock de fallback
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: FinancialTransaction[] = [
  { id: 't1', farm_id: 'f1', type: 'INCOME',  category: 'COFFEE_SALE',  amount: 87000,  due_date: '2025-08-20', payment_date: '2025-08-22', status: 'PAID' },
  { id: 't2', farm_id: 'f1', type: 'INCOME',  category: 'COFFEE_SALE',  amount: 42500,  due_date: '2025-05-10', payment_date: '2025-05-12', status: 'PAID' },
  { id: 't3', farm_id: 'f1', type: 'EXPENSE', category: 'SUPPLY',       amount: 4800,   due_date: '2025-04-10', payment_date: '2025-04-10', status: 'PAID' },
  { id: 't4', farm_id: 'f1', type: 'EXPENSE', category: 'LABOR',        amount: 12500,  due_date: '2025-09-05', payment_date: null,         status: 'PENDING' },
  { id: 't5', farm_id: 'f1', type: 'EXPENSE', category: 'MAINTENANCE',  amount: 3200,   due_date: '2025-07-15', payment_date: '2025-07-15', status: 'PAID' },
  { id: 't6', farm_id: 'f1', type: 'EXPENSE', category: 'SUPPLY',       amount: 9100,   due_date: '2025-06-01', payment_date: '2025-06-01', status: 'PAID' },
];

const MOCK_SALES: Sale[] = [
  { id: 's1', batch_id: 'b1', shipment_invoice: 'REM-4521', destination_warehouse: 'Armazém Santos',    sale_invoice: 'NF-8801', sale_date: '2025-08-20', customer: 'Torrefação Premium Ltda.',   total_value: 87000 },
  { id: 's2', batch_id: 'b2', shipment_invoice: 'REM-3910', destination_warehouse: 'Armazém Campinas',  sale_invoice: 'NF-7640', sale_date: '2025-05-10', customer: 'Café Especial Exportação',  total_value: 42500 },
];

const MONTHLY_DATA = [
  { month: 'Jan', cost: 8500,  revenue: 0,     profit: -8500  },
  { month: 'Fev', cost: 12000, revenue: 0,     profit: -12000 },
  { month: 'Mar', cost: 9800,  revenue: 0,     profit: -9800  },
  { month: 'Abr', cost: 14200, revenue: 0,     profit: -14200 },
  { month: 'Mai', cost: 7300,  revenue: 42500, profit: 35200  },
  { month: 'Jun', cost: 9100,  revenue: 0,     profit: -9100  },
  { month: 'Jul', cost: 6800,  revenue: 0,     profit: -6800  },
  { month: 'Ago', cost: 16000, revenue: 87000, profit: 71000  },
];

const PLOT_PROFITABILITY = [
  { code: 'T-01', variety: 'Catuaí Vermelho', revenue: 87000, cost: 38000, profit: 49000, margin: 56.3, sacksProduced: 1200 },
  { code: 'T-02', variety: 'Bourbon Amarelo', revenue: 42500, cost: 18500, profit: 24000, margin: 56.5, sacksProduced: 680  },
  { code: 'T-04', variety: 'Catuaí Amarelo',  revenue: 0,     cost: 12000, profit: -12000,margin: 0,    sacksProduced: 0    },
  { code: 'T-03', variety: 'Mundo Novo',       revenue: 0,     cost: 4600,  profit: -4600, margin: 0,    sacksProduced: 0    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Auxiliares
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

const CATEGORY_LABELS: Record<string, string> = {
  SUPPLY: 'Insumos', LABOR: 'Mão de Obra', COFFEE_SALE: 'Venda Café', MAINTENANCE: 'Manutenção',
};

const COST_COLORS = ['#C5A059', '#D4B47A', '#8B6914', '#F0D080', '#6B4F12'];

// Categorias de despesa que compõem o Custo de Produção (o resto vira Despesa Operacional)
const PRODUCTION_COST_CATS = new Set(['SUPPLY', 'LABOR']);

const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type ProfitRow = { code: string; variety: string; revenue: number; cost: number; profit: number; margin: number; sacksProduced: number };

// Agrega transações reais por mês (usa data de pagamento; cai na de vencimento)
function buildMonthly(txs: FinancialTransaction[]) {
  const byMonth = new Map<string, { cost: number; revenue: number }>();
  txs.forEach((t) => {
    const d = t.payment_date ?? t.due_date;
    if (!d) return;
    const key = d.slice(0, 7); // YYYY-MM
    const cur = byMonth.get(key) ?? { cost: 0, revenue: 0 };
    if (t.type === 'INCOME') cur.revenue += Number(t.amount);
    else cur.cost += Number(t.amount);
    byMonth.set(key, cur);
  });
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      month: MONTH_ABBR[Number(key.slice(5, 7)) - 1] ?? key,
      cost: v.cost,
      revenue: v.revenue,
      profit: v.revenue - v.cost,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────────

export function FinanceiroDashboard() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(MOCK_TRANSACTIONS);
  const [sales, setSales]               = useState<Sale[]>(MOCK_SALES);
  const [plots, setPlots]               = useState<Plot[]>([]);
  const [seasons, setSeasons]           = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [plotCosts, setPlotCosts]       = useState<ProfitRow[] | null>(null); // null = usar mock
  const [loading, setLoading]           = useState(true);
  // Verdadeiro só quando a API falha e caímos nos dados fabricados — nesse caso
  // mostramos um selo "demonstração" para ninguém confundir com números reais.
  const [usingMock, setUsingMock]       = useState(false);

  // ── Financeiro (transações + vendas) ────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [t, s] = await Promise.all([transactionsApi.list(), salesApi.list()]);
        // Sucesso manda: usa o que veio do backend MESMO que vazio. Um conjunto
        // legitimamente vazio (fazenda nova) não pode ser mascarado pelo mock.
        setTransactions(t.data);
        setSales(s.data);
      } catch {
        setUsingMock(true); // backend indisponível → mantém dados de demonstração
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Dados de referência para a rentabilidade (talhões + safras) ──────────────
  useEffect(() => {
    async function loadRefs() {
      try {
        const [p, se] = await Promise.all([plotsApi.list(), seasonsApi.list()]);
        setPlots(p.data);
        setSeasons(se.data);
        if (se.data.length) {
          setSelectedSeasonId((cur) => cur || se.data[se.data.length - 1].id);
        }
      } catch {
        setUsingMock(true); // endpoints indisponíveis → rentabilidade em modo demo
      }
    }
    loadRefs();
  }, []);

  // ── Rentabilidade REAL por talhão (motor de custo) na safra selecionada ──────
  useEffect(() => {
    if (!selectedSeasonId) { setPlotCosts(null); return; }
    if (!plots.length) { setPlotCosts([]); return; } // refs carregaram vazias → sem mock
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        plots.map((pl) =>
          costApi.plotSeasonCost(pl.id, selectedSeasonId)
            .then((r) => ({ plot: pl, cost: r.data as PlotSeasonCost }))
            .catch(() => null),
        ),
      );
      if (cancelled) return;
      const rows: ProfitRow[] = results
        .filter((x): x is { plot: Plot; cost: PlotSeasonCost } => x !== null)
        .map(({ plot, cost }) => {
          const revenue = Number(cost.revenue) || 0;
          const c       = Number(cost.total_cost) || 0;
          const profit  = Number(cost.gross_profit ?? revenue - c);
          return {
            code: plot.code,
            variety: plot.variety ?? '—',
            revenue,
            cost: c,
            profit,
            margin: revenue > 0 ? (profit / revenue) * 100 : 0,
            sacksProduced: Number(cost.sacks_produced) || 0,
          };
        });
      setPlotCosts(rows); // mesmo vazio: não mascara com o mock de rentabilidade
    })();
    return () => { cancelled = true; };
  }, [plots, selectedSeasonId]);

  // ── KPIs calculados ──────────────────────────────────────────────────────────
  const revenue    = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const totalCost  = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
  const profit     = revenue - totalCost;
  const margin     = revenue > 0 ? (profit / revenue) * 100 : 0;
  // Sacas reais do motor de custo. Sem produção lançada → custo/saca indisponível
  // (nada de dividir por um número fictício).
  const totalSacks = (plotCosts ?? []).reduce((s, r) => s + r.sacksProduced, 0);
  const costPerSack: number | null = totalSacks > 0 ? totalCost / totalSacks : null;
  const breakEven  = revenue > 0 && profit > 0 ? totalCost : revenue;

  // Rentabilidade e evolução mensal: reais quando disponíveis; mock só em modo demo
  const profitability = plotCosts ?? (usingMock ? PLOT_PROFITABILITY : []);
  const monthlyData    = (() => {
    const real = buildMonthly(transactions);
    return real.length ? real : (usingMock ? MONTHLY_DATA : []);
  })();
  const seasonName = seasons.find((s) => s.id === selectedSeasonId)?.name;

  // ── Composição de custos ─────────────────────────────────────────────────────────
  const costByCategory = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      const k = CATEGORY_LABELS[t.category] ?? t.category;
      costByCategory.set(k, (costByCategory.get(k) ?? 0) + Number(t.amount));
    });
  const costPieData = Array.from(costByCategory.entries()).map(([name, value], i) => ({
    name, value, color: COST_COLORS[i % COST_COLORS.length],
    pct: totalCost > 0 ? ((value / totalCost) * 100).toFixed(1) : '0',
  }));

  // ── DRE (derivado de dados reais — sem imposto/depreciação fictícios) ───────
  const productionCost = transactions
    .filter((t) => t.type === 'EXPENSE' && PRODUCTION_COST_CATS.has(t.category))
    .reduce((s, t) => s + Number(t.amount), 0);
  const opex = totalCost - productionCost;
  const grossProfit = revenue - productionCost;
  const dreLines = [
    { description: 'Receita Bruta de Vendas',                      value: revenue,        type: 'income'   as const },
    { description: '  (-) Custo de Produção (insumos + mão de obra)', value: productionCost, type: 'cost'   as const, indent: true },
    { description: 'Lucro Bruto',                                  value: grossProfit,    type: 'subtotal' as const },
    { description: '  (-) Despesas Operacionais',                  value: opex,           type: 'cost'     as const, indent: true },
    { description: 'Resultado Operacional',                        value: profit,         type: 'result'   as const },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
            <DollarSign size={14} className="text-gold" />
            <span>Financeiro</span>
            <ChevronRight size={12} />
            <span className="text-gold font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard Financeiro</h1>
          <p className="text-text-muted text-sm mt-0.5">{seasonName ?? 'Safra atual'} — Fazenda Ouro Preto</p>
          {usingMock && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold bg-gold/15 text-gold border border-gold/30">
              Dados de demonstração — backend indisponível
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input-base text-xs pr-8"
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
          >
            {seasons.length
              ? seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
              : ['Safra 2025/2026', 'Safra 2024/2025', 'Safra 2023/2024'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
          </select>
          <button className="btn-secondary">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Linha de KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Custo Total"       value={`R$ ${(totalCost/1000).toFixed(0)}k`}  unit=""             subtitle="Insumos + Mão de obra"   icon={<DollarSign size={18} />} variant="default" />
        <KPICard title="Custo / Saca"      value={costPerSack != null ? `R$ ${costPerSack.toFixed(0)}` : '—'} unit="" subtitle={totalSacks > 0 ? `${totalSacks} sacas` : 'Sem produção lançada'}  icon={<Target size={18} />}     variant="default" />
        <KPICard title="Receita Total"     value={`R$ ${(revenue/1000).toFixed(0)}k`}     unit=""             subtitle="Vendas realizadas"       icon={<TrendingUp size={18} />} variant="positive" />
        <KPICard title="Lucro / Prejuízo"  value={`R$ ${(profit/1000).toFixed(0)}k`}      unit=""             subtitle={`Margem ${margin.toFixed(1)}%`} icon={profit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />} variant={profit >= 0 ? 'positive' : 'negative'} accent={profit >= 0} />
        <KPICard title="Margem Líquida"    value={`${margin.toFixed(1)}`}                 unit="%"            subtitle="Sobre receita bruta"    icon={<BarChart3 size={18} />}  variant={margin >= 40 ? 'positive' : margin >= 20 ? 'gold' : 'negative'} />
        <KPICard title="Ponto de Equilíbrio" value={`R$ ${(breakEven/1000).toFixed(0)}k`} unit=""            subtitle="Equilíbrio da safra"       icon={<AlertCircle size={18} />} variant="gold" />
      </div>

      {/* ── Linha de gráficos ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gráfico de pizza de custos */}
        <ChartCard title="Composição de Custos" subtitle="Distribuição por categoria" className="lg:col-span-2" minHeight={280}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costPieData}
                cx="40%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {costPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={(v: number, n: string) => [
                      `R$ ${v.toLocaleString('pt-BR')} (${costPieData.find((d) => d.name === n)?.pct}%)`,
                      n,
                    ]}
                  />
                }
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: '#9CA3AF', fontSize: 11 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gráfico combinado: custo vs receita */}
        <ChartCard title="Evolução Mensal" subtitle="Custo vs Receita (R$)" className="lg:col-span-3" minHeight={280}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                     tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                content={
                  <CustomTooltip formatter={(v: number, n: string) => [`R$ ${v.toLocaleString('pt-BR')}`, n]} />
                }
              />
              <Bar dataKey="cost"    name="Custo"   fill="#C5A059" radius={[3,3,0,0]} barSize={20} />
              <Bar dataKey="revenue" name="Receita" fill="#2E7D32" radius={[3,3,0,0]} barSize={20} />
              <Line dataKey="profit" name="Lucro" type="monotone" stroke="#F0D080" strokeWidth={2} dot={{ fill: '#F0D080', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Tabela de rentabilidade ──────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="section-title">Rentabilidade por Talhão</h3>
          <button className="text-xs text-gold hover:underline">Exportar</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/40">
                {['Talhão', 'Variedade', 'Sacas Prod.', 'Receita', 'Custos', 'Lucro', 'Margem'].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profitability.map((row) => (
                <tr key={row.code} className="table-row">
                  <td className="table-cell font-bold text-gold">{row.code}</td>
                  <td className="table-cell">{row.variety}</td>
                  <td className="table-cell font-medium">{row.sacksProduced.toLocaleString('pt-BR')}</td>
                  <td className="table-cell text-positive-light font-medium">{fmt(row.revenue)}</td>
                  <td className="table-cell text-negative-light font-medium">{fmt(row.cost)}</td>
                  <td className={clsx('table-cell font-bold', row.profit >= 0 ? 'text-positive-light' : 'text-negative-light')}>
                    {row.profit >= 0 ? '' : '-'}{fmt(Math.abs(row.profit))}
                  </td>
                  <td className="table-cell">
                    {row.margin > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-border rounded-full h-1.5 max-w-[60px]">
                          <div
                            className="h-1.5 rounded-full bg-positive"
                            style={{ width: `${Math.min(row.margin, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-positive-light">{row.margin.toFixed(1)}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Linha inferior: detalhamento de gastos + DRE ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhamento de gastos */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="section-title">Detalhamento de Gastos</h3>
          </div>
          <div className="p-4 space-y-3">
            {costPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-text-primary">{item.name}</span>
                    <span className="text-sm font-semibold text-text-primary">{fmt(item.value)}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-text-muted w-10 text-right flex-shrink-0">
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DRE */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="section-title">DRE Simplificado</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                {dreLines.map((line, i) => (
                  <tr
                    key={i}
                    className={clsx(
                      'border-t border-border',
                      line.type === 'result'   && 'bg-gold/5',
                      line.type === 'subtotal' && 'bg-border/30',
                    )}
                  >
                    <td className={clsx(
                      'py-2 pr-4',
                      line.indent && 'pl-4 text-text-muted',
                      !line.indent && 'font-semibold text-text-primary',
                    )}>
                      {line.description}
                    </td>
                    <td className={clsx(
                      'py-2 text-right font-mono font-semibold',
                      line.type === 'income'  && 'text-positive-light',
                      line.type === 'cost'    && 'text-negative-light',
                      line.type === 'result'  && (line.value >= 0 ? 'text-gold' : 'text-negative-light'),
                      line.type === 'subtotal'&& 'text-text-primary',
                    )}>
                      {line.type === 'cost' ? `(${fmt(line.value)})` : fmt(Math.abs(line.value))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
