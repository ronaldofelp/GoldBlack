import React, { useEffect, useState } from 'react';
import { DollarSign, Eye, Calendar } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { DetailModal } from '../../components/ui/DetailModal';
import { transactionsApi } from '../../services/api';
import type { FinancialTransaction } from '../../types';

export function Custos() {
  const [data, setData] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FinancialTransaction | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transactionsApi.list();
      // Filtrar apenas despesas para a tela de custos
      const despesas = res.data.filter((tx: FinancialTransaction) => tx.type === 'EXPENSE');
      setData(despesas);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar custos');
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
      MAINTENANCE: 'Manutenção'
    };
    return map[category] || category;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return <span className="px-2 py-1 bg-positive/20 text-positive-light rounded text-xs font-medium">Pago</span>;
    return <span className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">A Pagar</span>;
  };

  return (
    <>
    <EntityPageLayout
      title="Despesas Operacionais"
      description="Despesas lançadas — insumos, mão de obra e manutenção"
      icon={<DollarSign size={24} />}
      data={data}
      loading={loading}
      error={error}
      onRefresh={loadData}
      columns={[
        { key: 'date', label: 'Data de Vencimento' },
        { key: 'category', label: 'Categoria' },
        { key: 'amount', label: 'Custo', align: 'right' },
        { key: 'status', label: 'Status Pagamento', align: 'center' },
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
          <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-negative">
            R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            {getStatusBadge(tx.status)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button
              onClick={() => setSelected(tx)}
              title="Ver detalhes"
              className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Eye size={16} />
            </button>
          </td>
        </tr>
      )}
    />

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Detalhes da Despesa"
        items={selected ? [
          { label: 'Data de Vencimento', value: new Date(selected.due_date).toLocaleDateString('pt-BR') },
          { label: 'Categoria', value: getCategoryLabel(selected.category) },
          { label: 'Custo', value: `R$ ${selected.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'Status', value: selected.status === 'PAID' ? 'Pago' : 'A Pagar' },
          { label: 'ID da Transação', value: selected.id },
        ] : []}
      />
    </>
  );
}
