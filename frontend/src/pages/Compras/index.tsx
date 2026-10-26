import React, { useEffect, useState } from 'react';
import { ShoppingCart, Eye, Calendar, Receipt, CheckCircle } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { Modal } from '../../components/ui/Modal';
import { DetailModal } from '../../components/ui/DetailModal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';
import { purchasesApi, farmsApi } from '../../services/api';
import type { Purchase } from '../../types';

export function Compras() {
  const [data, setData] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Purchase | null>(null);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [delivering, setDelivering] = useState<string | null>(null);

  const formFields: FieldDef[] = [
    { name: 'supplier', label: 'Fornecedor', type: 'text', required: true },
    { name: 'invoice_number', label: 'Nota Fiscal', type: 'text', required: false },
    { name: 'purchase_date', label: 'Data do Pedido', type: 'date', required: true },
    { name: 'total_value', label: 'Valor Total (R$)', type: 'number', required: true },
    { name: 'notes', label: 'Observações', type: 'text', required: false },
  ];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let fid = farmId;
      if (!fid) {
        const farmsRes = await farmsApi.list();
        fid = farmsRes.data[0]?.id ?? null;
        setFarmId(fid);
      }
      const res = await purchasesApi.list(fid ?? undefined);
      setData(res.data);
    } catch {
      setError('Não foi possível carregar as compras. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (newData: any) => {
    if (!farmId) return;
    await purchasesApi.create({
      farm_id: farmId,
      supplier: newData.supplier,
      invoice_number: newData.invoice_number || undefined,
      purchase_date: newData.purchase_date,
      total_value: Number(newData.total_value),
      notes: newData.notes || undefined,
      items: [],
    });
    setIsModalOpen(false);
    loadData();
  };

  const handleDeliver = async (purchase: Purchase) => {
    if (purchase.status === 'DELIVERED') return;
    setDelivering(purchase.id);
    try {
      await purchasesApi.update(purchase.id, { status: 'DELIVERED' });
      await loadData();
      if (selected?.id === purchase.id) {
        setSelected(prev => prev ? { ...prev, status: 'DELIVERED' } : null);
      }
    } finally {
      setDelivering(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'DELIVERED')
      return <span className="px-2 py-1 bg-positive/20 text-positive-light rounded text-xs font-medium">Entregue</span>;
    if (status === 'CANCELLED')
      return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">Cancelada</span>;
    return <span className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">Pendente</span>;
  };

  return (
    <>
      <EntityPageLayout
        title="Compras"
        description="Gerencie aquisições de insumos e maquinários"
        icon={<ShoppingCart size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
        columns={[
          { key: 'supplier', label: 'Fornecedor' },
          { key: 'invoice_number', label: 'Nota Fiscal' },
          { key: 'purchase_date', label: 'Data do Pedido' },
          { key: 'total_value', label: 'Valor Total', align: 'right' },
          { key: 'status', label: 'Status do Pedido' },
          { key: 'actions', label: '' },
        ]}
        renderRow={(purchase) => (
          <tr key={purchase.id} className="hover:bg-card-hover group transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
              {purchase.supplier}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              {purchase.invoice_number ? (
                <div className="flex items-center gap-1.5">
                  <Receipt size={14} className="text-text-muted/70" />
                  <span className="font-mono text-sm">{purchase.invoice_number}</span>
                </div>
              ) : (
                <span className="text-text-muted/50 italic text-sm">—</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-text-muted/70" />
                <span>{new Date(purchase.purchase_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-text-primary font-medium">
              R$ {Number(purchase.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {getStatusBadge(purchase.status)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
              <div className="flex items-center justify-end gap-1">
                {purchase.status === 'PENDING' && (
                  <button
                    onClick={() => handleDeliver(purchase)}
                    disabled={delivering === purchase.id}
                    title="Marcar como Entregue"
                    className="p-1.5 rounded text-text-muted hover:text-positive-light hover:bg-positive/10 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                <button
                  onClick={() => setSelected(purchase)}
                  title="Ver detalhes"
                  className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
                >
                  <Eye size={16} />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Compra">
        <EntityForm
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Detalhes da Compra"
        items={selected ? [
          { label: 'Fornecedor', value: selected.supplier },
          { label: 'Nota Fiscal', value: selected.invoice_number ?? '—' },
          { label: 'Data do Pedido', value: new Date(selected.purchase_date + 'T12:00:00').toLocaleDateString('pt-BR') },
          { label: 'Valor Total', value: `R$ ${Number(selected.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'Status', value: selected.status === 'DELIVERED' ? 'Entregue' : selected.status === 'CANCELLED' ? 'Cancelada' : 'Pendente' },
          { label: 'Observações', value: selected.notes ?? '—' },
          { label: 'Itens', value: selected.items.length > 0 ? `${selected.items.length} item(s)` : 'Nenhum item' },
        ] : []}
      />
    </>
  );
}
