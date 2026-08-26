import React, { useEffect, useState } from 'react';
import { Warehouse, MoreHorizontal, Package } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { suppliesApi } from '../../services/api';
import type { AgriculturalSupply } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';

export function Estoque() {
  const [data, setData] = useState<AgriculturalSupply[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formFields: FieldDef[] = [
    { name: 'name', label: 'Nome do Insumo', type: 'text', required: true },
    { 
      name: 'category', 
      label: 'Categoria', 
      type: 'select', 
      required: true,
      options: [
        { value: 'FERTILIZER', label: 'Fertilizante' },
        { value: 'PESTICIDE', label: 'Defensivo' }
      ]
    },
    { name: 'unit_of_measure', label: 'Unidade de Medida (ex: kg, L)', type: 'text', required: true },
    { name: 'unit_cost', label: 'Custo Unitário (R$)', type: 'number', required: true },
    { name: 'stock_quantity', label: 'Quantidade em Estoque', type: 'number', required: true },
  ];

  const handleCreate = async (data: any) => {
    await suppliesApi.create(data);
    setIsModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await suppliesApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar insumos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'FERTILIZER':
        return <span className="px-2 py-1 bg-info/20 text-info rounded text-xs font-medium">Fertilizante</span>;
      case 'PESTICIDE':
        return <span className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">Defensivo</span>;
      default:
        return <span className="px-2 py-1 bg-border text-text-muted rounded text-xs font-medium">{category}</span>;
    }
  };

  return (
    <>
      <EntityPageLayout
        title="Estoque e Insumos"
        description="Gerencie o estoque de fertilizantes, defensivos e materiais"
        icon={<Warehouse size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
      columns={[
        { key: 'name', label: 'Insumo' },
        { key: 'category', label: 'Categoria' },
        { key: 'quantity', label: 'Em Estoque', align: 'right' },
        { key: 'cost', label: 'Custo Unitário', align: 'right' },
        { key: 'total', label: 'Valor Total', align: 'right' },
      ]}
      renderRow={(supply) => (
        <tr key={supply.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {supply.name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            {getCategoryBadge(supply.category)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-text-primary font-medium">
            <div className="flex items-center justify-end gap-1.5">
              <span>{supply.stock_quantity.toLocaleString('pt-BR')}</span>
              <span className="text-text-muted text-xs">{supply.unit_of_measure}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-text-muted">
            R$ {supply.unit_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-text-primary font-medium">
            R$ {(supply.stock_quantity * supply.unit_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button className="p-1 rounded text-text-muted hover:text-gold transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </td>
        </tr>
      )}
    />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Insumo">
        <EntityForm
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}
