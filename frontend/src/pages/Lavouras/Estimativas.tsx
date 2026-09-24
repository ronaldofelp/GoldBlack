import React, { useEffect, useState } from 'react';
import { TrendingUp, Eye } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { harvestEstimatesApi } from '../../services/api';
import type { HarvestEstimate } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { DetailModal } from '../../components/ui/DetailModal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';

export function Estimativas() {
  const [data, setData] = useState<HarvestEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<HarvestEstimate | null>(null);

  const formFields: FieldDef[] = [
    { name: 'plot_id', label: 'ID do Talhão', type: 'text', required: true },
    { name: 'season', label: 'Safra (ex: 2025/2026)', type: 'text', required: true },
    { name: 'estimated_sacks', label: 'Sacas Estimadas', type: 'number' },
    { name: 'estimated_yield_per_ha', label: 'Produtividade (sc/ha)', type: 'number' },
  ];

  const handleCreate = async (data: any) => {
    await harvestEstimatesApi.create(data);
    setIsModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await harvestEstimatesApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estimativas');
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
      title="Estimativas de Safra"
      description="Previsão de produtividade e volume de colheita"
      icon={<TrendingUp size={24} />}
      data={data}
      loading={loading}
      error={error}
      onRefresh={loadData}
      onAdd={() => setIsModalOpen(true)}
      columns={[
        { key: 'season', label: 'Safra' },
        { key: 'plot', label: 'Talhão' },
        { key: 'sacks', label: 'Sacas Estimadas', align: 'right' },
        { key: 'yield', label: 'Produtividade (sc/ha)', align: 'right' },
      ]}
      renderRow={(estimate) => (
        <tr key={estimate.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {estimate.season}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            <span className="font-mono text-xs border border-border px-1.5 py-0.5 rounded bg-background">ID: {estimate.plot_id.substring(0,6)}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-text-primary">
            <div className="flex items-center justify-end gap-1.5">
              <span>{estimate.estimated_sacks != null ? Number(estimate.estimated_sacks).toFixed(1) : '-'}</span>
              <span className="text-xs text-text-muted font-normal">sc</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-text-muted">
            {estimate.estimated_yield_per_ha != null ? Number(estimate.estimated_yield_per_ha).toFixed(1) : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button
              onClick={() => setSelected(estimate)}
              title="Ver detalhes"
              className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Eye size={16} />
            </button>
          </td>
        </tr>
      )}
    />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Estimativa">
        <EntityForm
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Detalhes da Estimativa"
        items={selected ? [
          { label: 'Safra', value: selected.season },
          { label: 'ID do Talhão', value: selected.plot_id },
          { label: 'Sacas Estimadas', value: selected.estimated_sacks != null ? `${Number(selected.estimated_sacks).toFixed(1)} sc` : null },
          { label: 'Produtividade', value: selected.estimated_yield_per_ha != null ? `${Number(selected.estimated_yield_per_ha).toFixed(1)} sc/ha` : null },
          { label: 'ID da Estimativa', value: selected.id },
        ] : []}
      />
    </>
  );
}
