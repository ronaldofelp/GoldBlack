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
import { transactionsApi, salesApi } from '../../services/api';
import type { FinancialTransaction, Sale } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Mock fallback
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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

const CATEGORY_LABELS: Record<string, string> = {
  SUPPLY: 'Insumos', LABOR: 'Mão de Obra', COFFEE_SALE: 'Venda Café', MAINTENANCE: 'Manutenção',
};

const COST_COLORS = ['#C5A059', '#D4B47A', '#8B6914', '#F0D080', '#6B4F12'];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function FinanceiroDashboard() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(MOCK_TRANSACTIONS);
  const [sales, setSales]               = useState<Sale[]>(MOCK_SALES);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [t, s] = await Promise.all([transactionsApi.list(), salesApi.list()]);
        if (t.data.length) setTransactions(t.data);
        if (s.data.length) setSales(s.data);
      } catch {
        // fallback to mock
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Computed KPIs ──────────────────────────────────────────────────────────
  const revenue    = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const totalCost  = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
  const profit     = revenue - totalCost;
  const margin     = revenue > 0 ? (profit / revenue) * 100 : 0;
  const totalSacks = sales.reduce((s: number, sale: Sale) => s + (sale.total_value > 0 ? 1 : 0), 0) * 100 || 1880;
  const costPerSack = totalSacks > 0 ? totalCost / totalSacks : 0;
  const breakEven  = revenue > 0 && profit > 0 ? totalCost : revenue;

  // ── Cost breakdown ─────────────────────────────────────────────────────────
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

  // ── DRE ───────────────────────────────────────────────────────────────────
  const dreLines = [
    { description: 'Receita Bruta de Vendas',    value: revenue,         type: 'income'   as const },
    { description: '  (-) Impostos e Deduções',  value: revenue * 0.05,  type: 'cost'     as const, indent: true },
    { description: 'Receita Líquida',            value: revenue * 0.95,  type: 'subtotal' as const },
    { description: '  (-) Custo de Produção',    value: totalCost * 0.65, type: 'cost'   as const, indent: true },
    { description: 'Lucro Bruto',                value: (revenue * 0.95) - (totalCost * 0.65), type: 'subtotal' as const },
    { description: '  (-) Despesas Operacionais',value: totalCost * 0.35, type: 'cost'   as const, indent: true },
    { description: 'EBITDA',                     value: profit,           type: 'result'  as const },
    { description: '  (-) Depreciação',          value: 2400,             type: 'cost'   as const, indent: true },
    { description: 'Resultado Líquido',          value: profit - 2400,    type: 'result'  as const },
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
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
            <DollarSign size={14} className="text-gold" />
            <span>Financeiro</span>
            <ChevronRight size={12} />
            <span className="text-gold font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard Financeiro</h1>
          <p className="text-text-muted text-sm mt-0.5">Safra 2025/2026 — Fazenda Ouro Preto</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-base text-xs pr-8">
            {['Safra 2025/2026', 'Safra 2024/2025', 'Safra 2023/2024'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="btn-secondary">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Custo Total"       value={`R$ ${(totalCost/1000).toFixed(0)}k`}  unit=""             subtitle="Insumos + Mão de obra"   icon={<DollarSign size={18} />} variant="default" />
        <KPICard title="Custo / Saca"      value={`R$ ${costPerSack.toFixed(0)}`}         unit=""             subtitle={`${totalSacks} sacas`}  icon={<Target size={18} />}     variant="default" />
        <KPICard title="Receita Total"     value={`R$ ${(revenue/1000).toFixed(0)}k`}     unit=""             subtitle="Vendas realizadas"       icon={<TrendingUp size={18} />} variant="positive" />
        <KPICard title="Lucro / Prejuízo"  value={`R$ ${(profit/1000).toFixed(0)}k`}      unit=""             subtitle={`Margem ${margin.toFixed(1)}%`} icon={profit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />} variant={profit >= 0 ? 'positive' : 'negative'} accent={profit >= 0} />
        <KPICard title="Margem Líquida"    value={`${margin.toFixed(1)}`}                 unit="%"            subtitle="Sobre receita bruta"    icon={<BarChart3 size={18} />}  variant={margin >= 40 ? 'positive' : margin >= 20 ? 'gold' : 'negative'} />
        <KPICard title="Ponto de Equilíbrio" value={`R$ ${(breakEven/1000).toFixed(0)}k`} unit=""            subtitle="Break-even safra"       icon={<AlertCircle size={18} />} variant="gold" />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cost Pie */}
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

        {/* Composed chart: Cost vs Revenue */}
        <ChartCard title="Evolução Mensal" subtitle="Custo vs Receita (R$)" className="lg:col-span-3" minHeight={280}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={MONTHLY_DATA}>
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

      {/* ── Profitability Table ──────────────────────────────────────────── */}
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
              {PLOT_PROFITABILITY.map((row) => (
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

      {/* ── Bottom Row: Inputs detail + DRE ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense detail */}
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
