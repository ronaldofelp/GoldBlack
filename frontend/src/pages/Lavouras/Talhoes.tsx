import React, { useEffect, useState } from 'react';
import { MapPin, Eye } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { plotsApi } from '../../services/api';
import type { Plot } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { DetailModal } from '../../components/ui/DetailModal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';

const STATUS_LABELS: Record<string, string> = {
  IN_PRODUCTION: 'Em Produção',
  DEVELOPMENT: 'Formação',
  RENOVATION: 'Renovação',
};

export function Talhoes() {
  const [data, setData] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Plot | null>(null);

  const formFields: FieldDef[] = [
    { name: 'code', label: 'Código do Talhão', type: 'text', required: true },
    { name: 'area_ha', label: 'Área (ha)', type: 'number', required: true },
    { name: 'variety', label: 'Variedade', type: 'text' },
    { name: 'planting_year', label: 'Ano de Plantio', type: 'number' },
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select', 
      required: true,
      options: [
        { value: 'IN_PRODUCTION', label: 'Em Produção' },
        { value: 'DEVELOPMENT', label: 'Formação' },
        { value: 'RENOVATION', label: 'Renovação' }
      ]
    },
    { name: 'farm_id', label: 'ID da Propriedade (Opcional)', type: 'text' },
  ];

  const handleCreate = async (data: any) => {
    if (!data.farm_id) data.farm_id = 'farm-default';
    await plotsApi.create(data);
    setIsModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await plotsApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar talhões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PRODUCTION':
        return <span className="px-2 py-1 bg-positive/20 text-positive-light rounded text-xs font-medium">Em Produção</span>;
      case 'DEVELOPMENT':
        return <span className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">Formação</span>;
      case 'RENOVATION':
        return <span className="px-2 py-1 bg-info/20 text-info rounded text-xs font-medium">Renovação</span>;
      default:
        return <span className="px-2 py-1 bg-border text-text-muted rounded text-xs font-medium">{status}</span>;
    }
  };

  return (
    <>
      <EntityPageLayout
      title="Talhões"
      description="Gerencie os talhões e áreas de plantio"
      icon={<MapPin size={24} />}
      data={data}
      loading={loading}
      error={error}
      onRefresh={loadData}
      onAdd={() => setIsModalOpen(true)}
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'variety', label: 'Variedade' },
        { key: 'area', label: 'Área (ha)', align: 'right' },
        { key: 'year', label: 'Ano de Plantio', align: 'center' },
        { key: 'status', label: 'Status' },
      ]}
      renderRow={(plot) => (
        <tr key={plot.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {plot.code}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            {plot.variety || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-text-primary">
            {Number(plot.area_ha).toFixed(2)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center text-text-muted">
            {plot.planting_year || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {getStatusBadge(plot.status)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button
              onClick={() => setSelected(plot)}
              title="Ver detalhes"
              className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Eye size={16} />
            </button>
          </td>
        </tr>
      )}
    />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Talhão">
        <EntityForm
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Talhão ${selected.code}` : ''}
        items={selected ? [
          { label: 'Código', value: selected.code },
          { label: 'Variedade', value: selected.variety },
          { label: 'Área', value: `${Number(selected.area_ha).toFixed(2)} ha` },
          { label: 'Ano de Plantio', value: selected.planting_year },
          { label: 'Status', value: STATUS_LABELS[selected.status] ?? selected.status },
          { label: 'ID da Propriedade', value: selected.farm_id },
          { label: 'ID do Talhão', value: selected.id },
        ] : []}
      />
    </>
  );
}
