import React, { useEffect, useState } from 'react';
import { PackageSearch, Eye, Calendar, Receipt } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { salesApi } from '../../services/api';
import type { Sale } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { DetailModal } from '../../components/ui/DetailModal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';

export function Vendas() {
  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Sale | null>(null);

  const formFields: FieldDef[] = [
    { name: 'batch_id', label: 'ID do Lote', type: 'text', required: true },
    { name: 'customer', label: 'Cliente', type: 'text', required: true },
    { name: 'sale_invoice', label: 'Nota Fiscal', type: 'text' },
    { name: 'sale_date', label: 'Data da Venda', type: 'date', required: true },
    { name: 'total_value', label: 'Valor Total (R$)', type: 'number', required: true },
    { name: 'shipment_invoice', label: 'Nota de Remessa', type: 'text' },
    { name: 'destination_warehouse', label: 'Armazém de Destino', type: 'text' },
  ];

  const handleCreate = async (data: any) => {
    if (data.sale_date) data.sale_date = new Date(data.sale_date).toISOString();
    await salesApi.create(data);
    setIsModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salesApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <EntityPageLayout
      title="Vendas"
      description="Gerencie a comercialização e as notas fiscais"
      icon={<PackageSearch size={24} />}
      data={data}
      loading={loading}
      error={error}
      onRefresh={loadData}
      onAdd={() => setIsModalOpen(true)}
      columns={[
        { key: 'customer', label: 'Cliente' },
        { key: 'invoice', label: 'Nota Fiscal' },
        { key: 'date', label: 'Data da Venda' },
        { key: 'value', label: 'Valor Total', align: 'right' },
      ]}
      renderRow={(sale) => (
        <tr key={sale.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {sale.customer}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            <div className="flex items-center gap-1.5">
              <Receipt size={14} className="text-text-muted/70" />
              <span className="font-mono text-sm">{sale.sale_invoice || '-'}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-text-muted/70" />
              <span>{new Date(sale.sale_date).toLocaleDateString()}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-text-primary font-medium">
            R$ {sale.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button
              onClick={() => setSelected(sale)}
              title="Ver detalhes"
              className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Eye size={16} />
            </button>
          </td>
        </tr>
      )}
    />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Venda">
        <EntityForm
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Detalhes da Venda"
        items={selected ? [
          { label: 'Cliente', value: selected.customer },
          { label: 'Data da Venda', value: new Date(selected.sale_date).toLocaleDateString('pt-BR') },
          { label: 'Valor Total', value: `R$ ${selected.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'Nota Fiscal', value: selected.sale_invoice },
          { label: 'Nota de Remessa', value: selected.shipment_invoice },
          { label: 'Armazém de Destino', value: selected.destination_warehouse },
          { label: 'ID do Lote', value: selected.batch_id },
          { label: 'ID da Venda', value: selected.id },
        ] : []}
      />
    </>
  );
}
