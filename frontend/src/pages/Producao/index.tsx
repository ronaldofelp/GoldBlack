import React, { useEffect, useState } from 'react';
import { Sprout, MoreHorizontal, Calendar } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { batchesApi } from '../../services/api';
import type { TraceabilityBatch } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';

export function Producao() {
  const [data, setData] = useState<TraceabilityBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formFields: FieldDef[] = [
    { name: 'batch_code', label: 'Código do Lote', type: 'text', required: true },
    { name: 'plot_id', label: 'ID do Talhão', type: 'text', required: true },
    { name: 'harvest_season', label: 'Safra', type: 'text', required: true },
    { 
      name: 'coffee_type', 
      label: 'Tipo de Café', 
      type: 'select', 
      required: true,
      options: [
        { value: 'NATURAL', label: 'Natural' },
        { value: 'PULPED_NATURAL', label: 'Cereja Descascado' }
      ]
    },
    { name: 'harvest_date', label: 'Data da Colheita', type: 'date', required: true },
    { name: 'total_volume_measures', label: 'Volume Total (medidas)', type: 'number', required: true },
  ];

  const handleCreate = async (data: any) => {
    if (data.harvest_date) data.harvest_date = new Date(data.harvest_date).toISOString();
    await batchesApi.create(data);
    setIsModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await batchesApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lotes de produção');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCoffeeTypeBadge = (type: string) => {
    switch (type) {
      case 'NATURAL':
        return <span className="px-2 py-1 bg-gold/10 text-gold-light border border-gold/20 rounded text-xs font-medium">Natural</span>;
      case 'PULPED_NATURAL':
        return <span className="px-2 py-1 bg-positive/10 text-positive-light border border-positive/20 rounded text-xs font-medium">Cereja Descascado</span>;
      default:
        return <span className="px-2 py-1 bg-border text-text-muted rounded text-xs font-medium">{type}</span>;
    }
  };

  return (
    <>
      <EntityPageLayout
      title="Produção e Lotes"
      description="Rastreabilidade e volumes processados"
      icon={<Sprout size={24} />}
      data={data}
      loading={loading}
      error={error}
      onRefresh={loadData}
      onAdd={() => setIsModalOpen(true)}
      columns={[
        { key: 'code', label: 'Código do Lote' },
        { key: 'season', label: 'Safra', align: 'center' },
        { key: 'type', label: 'Tipo de Café' },
        { key: 'volume', label: 'Volume (medidas)', align: 'right' },
        { key: 'date', label: 'Data Colheita' },
      ]}
      renderRow={(batch) => (
        <tr key={batch.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {batch.batch_code}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center text-text-muted">
            {batch.harvest_season}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {getCoffeeTypeBadge(batch.coffee_type)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-text-primary">
            {Number(batch.total_volume_measures).toFixed(1)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-text-muted/70" />
              <span>{new Date(batch.harvest_date).toLocaleDateString()}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button className="p-1 rounded text-text-muted hover:text-gold transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </td>
        </tr>
      )}
    />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Lote de Produção">
        <EntityForm
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}
