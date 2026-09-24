import React, { useEffect, useState } from 'react';
import { ShoppingCart, Eye, Calendar, Receipt } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { Modal } from '../../components/ui/Modal';
import { DetailModal } from '../../components/ui/DetailModal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';

// Tipo mock para compras
interface Purchase {
  id: string;
  supplier: string;
  invoice: string;
  date: string;
  total_value: number;
  status: 'DELIVERED' | 'PENDING';
}

export function Compras() {
  const [data, setData] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Purchase | null>(null);

  const formFields: FieldDef[] = [
    { name: 'supplier', label: 'Fornecedor', type: 'text', required: true },
    { name: 'invoice', label: 'Nota Fiscal', type: 'text', required: true },
    { name: 'date', label: 'Data do Pedido', type: 'date', required: true },
    { name: 'total_value', label: 'Valor Total (R$)', type: 'number', required: true },
    { 
      name: 'status', 
      label: 'Status do Pedido', 
      type: 'select', 
      required: true,
      options: [
        { value: 'DELIVERED', label: 'Entregue' },
        { value: 'PENDING', label: 'Pendente' }
      ]
    },
  ];

  const handleCreate = async (newData: any) => {
    // Simulando adição no banco, já que não temos endpoint de compras
    const newPurchase: Purchase = {
      id: Math.random().toString(),
      ...newData
    };
    setData(prev => [newPurchase, ...prev]);
    setIsModalOpen(false);
  };

  const loadData = async () => {
    setLoading(true);
    // Simula latência de rede e então carrega os dados mock
    setTimeout(() => {
      setData([
        {
          id: '1',
          supplier: 'AgroInsumos Nacional',
          invoice: 'NF-10492',
          date: '2025-04-05',
          total_value: 4800.00,
          status: 'DELIVERED'
        },
        {
          id: '2',
          supplier: 'Defensivos Silva & Cia',
          invoice: 'NF-2231',
          date: '2025-08-10',
          total_value: 13700.00,
          status: 'PENDING'
        }
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'DELIVERED') return <span className="px-2 py-1 bg-positive/20 text-positive-light rounded text-xs font-medium">Entregue</span>;
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
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
      columns={[
        { key: 'supplier', label: 'Fornecedor' },
        { key: 'invoice', label: 'Nota Fiscal' },
        { key: 'date', label: 'Data do Pedido' },
        { key: 'value', label: 'Valor Total', align: 'right' },
        { key: 'status', label: 'Status do Pedido' },
      ]}
      renderRow={(purchase) => (
        <tr key={purchase.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {purchase.supplier}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            <div className="flex items-center gap-1.5">
              <Receipt size={14} className="text-text-muted/70" />
              <span className="font-mono text-sm">{purchase.invoice}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-text-muted/70" />
              <span>{new Date(purchase.date).toLocaleDateString()}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-text-primary font-medium">
            R$ {purchase.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {getStatusBadge(purchase.status)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button
              onClick={() => setSelected(purchase)}
              title="Ver detalhes"
              className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Eye size={16} />
            </button>
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
          { label: 'Nota Fiscal', value: selected.invoice },
          { label: 'Data do Pedido', value: new Date(selected.date).toLocaleDateString('pt-BR') },
          { label: 'Valor Total', value: `R$ ${selected.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'Status', value: selected.status === 'DELIVERED' ? 'Entregue' : 'Pendente' },
        ] : []}
      />
    </>
  );
}
