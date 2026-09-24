import { useState } from 'react';
import { BarChart3, Download, FileText, Loader2 } from 'lucide-react';
import { EntityPageLayout } from '../components/layout/EntityPageLayout';
import {
  plotsApi, transactionsApi, suppliesApi, salesApi, productionsApi, seasonsApi,
} from '../services/api';

// ── Utilidades de CSV ──────────────────────────────────────────────────────────
// Gera um CSV compatível com Excel pt-BR: separador ';' e BOM UTF-8 (acentos ok).
function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const content = [headers, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const brDate = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('pt-BR') : '');
const brNum = (v: number | null | undefined) =>
  v == null ? '' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PLOT_STATUS: Record<string, string> = {
  IN_PRODUCTION: 'Em produção', RENOVATION: 'Renovação', DEVELOPMENT: 'Formação',
};
const TX_TYPE: Record<string, string> = { INCOME: 'Receita', EXPENSE: 'Despesa' };
const TX_CAT: Record<string, string> = {
  SUPPLY: 'Insumo', LABOR: 'Mão de obra', COFFEE_SALE: 'Venda de café', MAINTENANCE: 'Manutenção',
};
const TX_STATUS: Record<string, string> = { PAID: 'Liquidado', PENDING: 'Pendente' };
const SUPPLY_CAT: Record<string, string> = {
  FERTILIZER: 'Fertilizante', PESTICIDE: 'Defensivo', CORRECTIVE: 'Corretivo', FUEL: 'Combustível',
};

// ── Descritores de relatório (cada um busca dados vivos e monta o CSV) ──────────
interface ReportDef {
  id: string;
  name: string;
  category: string;
  build: () => Promise<void>;
}

const REPORTS: ReportDef[] = [
  {
    id: 'plots',
    name: 'Talhões cadastrados',
    category: 'Agrícola',
    build: async () => {
      const { data } = await plotsApi.list();
      downloadCsv(
        'talhoes.csv',
        ['Código', 'Variedade', 'Área (ha)', 'Ano de plantio', 'Status'],
        data.map((p) => [p.code, p.variety ?? '', brNum(p.area_ha), p.planting_year ?? '', PLOT_STATUS[p.status] ?? p.status]),
      );
    },
  },
  {
    id: 'transactions',
    name: 'Transações financeiras',
    category: 'Financeiro',
    build: async () => {
      const { data } = await transactionsApi.list();
      downloadCsv(
        'transacoes-financeiras.csv',
        ['Tipo', 'Categoria', 'Valor (R$)', 'Vencimento', 'Pagamento', 'Status'],
        data.map((t) => [
          TX_TYPE[t.type] ?? t.type, TX_CAT[t.category] ?? t.category, brNum(t.amount),
          brDate(t.due_date), brDate(t.payment_date), TX_STATUS[t.status] ?? t.status,
        ]),
      );
    },
  },
  {
    id: 'supplies',
    name: 'Estoque de insumos',
    category: 'Estoque',
    build: async () => {
      const { data } = await suppliesApi.list();
      downloadCsv(
        'estoque-insumos.csv',
        ['Insumo', 'Categoria', 'Unidade', 'Custo unitário (R$)', 'Em estoque', 'Valor total (R$)'],
        data.map((s) => [
          s.name, SUPPLY_CAT[s.category] ?? s.category, s.unit_of_measure,
          brNum(s.unit_cost), brNum(s.stock_quantity), brNum(Number(s.unit_cost) * Number(s.stock_quantity)),
        ]),
      );
    },
  },
  {
    id: 'sales',
    name: 'Vendas realizadas',
    category: 'Comercial',
    build: async () => {
      const { data } = await salesApi.list();
      downloadCsv(
        'vendas.csv',
        ['Cliente', 'Data', 'Valor total (R$)', 'Nota fiscal', 'Nota de remessa', 'Armazém de destino'],
        data.map((s) => [
          s.customer, brDate(s.sale_date), brNum(s.total_value),
          s.sale_invoice ?? '', s.shipment_invoice ?? '', s.destination_warehouse ?? '',
        ]),
      );
    },
  },
  {
    id: 'productions',
    name: 'Produção por talhão × safra (sacas)',
    category: 'Custo',
    build: async () => {
      const [prodRes, plotsRes, seasonsRes] = await Promise.all([
        productionsApi.list(), plotsApi.list(), seasonsApi.list(),
      ]);
      const plotCode = (id: string) => plotsRes.data.find((p) => p.id === id)?.code ?? id;
      const seasonName = (id: string) => seasonsRes.data.find((s) => s.id === id)?.name ?? id;
      downloadCsv(
        'producao-sacas.csv',
        ['Talhão', 'Safra', 'Sacas produzidas', 'Data da colheita'],
        prodRes.data.map((p) => [plotCode(p.plot_id), seasonName(p.season_id), brNum(p.sacks_produced), brDate(p.harvest_date)]),
      );
    },
  },
];

export function Relatorios() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (report: ReportDef) => {
    try {
      setError(null);
      setBusy(report.id);
      await report.build();
    } catch (err: any) {
      setError(err.message || `Erro ao gerar o relatório "${report.name}"`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <EntityPageLayout
      title="Relatórios e Exportações"
      description="Exporte dados reais do sistema em CSV (compatível com Excel)"
      icon={<BarChart3 size={24} />}
      data={REPORTS}
      loading={false}
      error={error}
      columns={[
        { key: 'name', label: 'Relatório' },
        { key: 'category', label: 'Categoria' },
        { key: 'format', label: 'Formato', align: 'center' },
      ]}
      renderRow={(report) => (
        <tr key={report.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gold" />
              <span>{report.name}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">{report.category}</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className="px-2 py-1 bg-background border border-border text-text-muted rounded text-xs font-medium uppercase">
              CSV
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right">
            <button
              onClick={() => handleDownload(report)}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-background bg-gold hover:bg-gold-light transition-colors disabled:opacity-50"
              title="Baixar CSV"
            >
              {busy === report.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Baixar</span>
            </button>
          </td>
        </tr>
      )}
    />
  );
}
