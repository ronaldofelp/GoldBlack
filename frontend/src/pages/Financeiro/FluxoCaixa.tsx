import React, { useEffect, useState } from 'react';
import { LineChart, MoreHorizontal, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { transactionsApi } from '../../services/api';
import type { FinancialTransaction } from '../../types';

export function FluxoCaixa() {
  const [data, setData] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transactionsApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fluxo de caixa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      SUPPLY: 'Insumos e Estoque',
      LABOR: 'Mão de Obra',
      COFFEE_SALE: 'Venda de Café',
      MAINTENANCE: 'Manutenção'
    };
    return map[category] || category;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return <span className="px-2 py-1 bg-positive/20 text-positive-light rounded text-xs font-medium">Liquidado</span>;
    return <span className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">Pendente</span>;
  };

  return (
    <EntityPageLayout
      title="Fluxo de Caixa"
      description="Gerencie todas as entradas e saídas financeiras da propriedade"
      icon={<LineChart size={24} />}
      data={data}
      loading={loading}
      error={error}
      onRefresh={loadData}
      columns={[
        { key: 'date', label: 'Data de Vencimento' },
        { key: 'category', label: 'Categoria' },
        { key: 'type', label: 'Tipo' },
        { key: 'amount', label: 'Valor', align: 'right' },
        { key: 'status', label: 'Status', align: 'center' },
      ]}
      renderRow={(tx) => (
        <tr key={tx.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-text-muted/70" />
              <span>{new Date(tx.due_date).toLocaleDateString()}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {getCategoryLabel(tx.category)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {tx.type === 'INCOME' ? (
              <span className="flex items-center gap-1 text-positive-light text-xs font-semibold">
                <ArrowUpRight size={14} /> Receita
              </span>
            ) : (
              <span className="flex items-center gap-1 text-negative-light text-xs font-semibold">
                <ArrowDownRight size={14} /> Despesa
              </span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
            <span className={tx.type === 'INCOME' ? 'text-positive' : 'text-negative'}>
              {tx.type === 'INCOME' ? '+ ' : '- '}
              R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            {getStatusBadge(tx.status)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button className="p-1 rounded text-text-muted hover:text-gold transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </td>
        </tr>
      )}
    />
  );
}
