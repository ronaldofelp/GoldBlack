import React, { useEffect, useState } from 'react';
import { Building2, Eye } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { farmsApi } from '../../services/api';
import type { Farm } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { DetailModal } from '../../components/ui/DetailModal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';

export function Propriedades() {
  const [data, setData] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Farm | null>(null);

  const formFields: FieldDef[] = [
    { name: 'name', label: 'Nome da Propriedade', type: 'text', required: true },
    { name: 'total_area_ha', label: 'Área Total (ha)', type: 'number', required: true },
    { name: 'producer_id', label: 'ID do Produtor (Opcional)', type: 'text' },
  ];

  const handleCreate = async (data: any) => {
    // Default producer_id se estiver vazio, pois o DB pode exigir ou não. No mock atual colocamos um fixo
    if (!data.producer_id) data.producer_id = 'prod-default';
    
    await farmsApi.create(data);
    setIsModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await farmsApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar propriedades');
      // Fallback para mock caso api falhe
      setData([{
        id: '1',
        producer_id: 'prod-1',
        name: 'Fazenda Mockada (Fallback)',
        total_area_ha: 150
      }]);
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
      title="Propriedades"
      description="Gerencie suas fazendas e áreas produtivas"
      icon={<Building2 size={24} />}
      data={data}
      loading={loading}
      error={error}
      onRefresh={loadData}
      onAdd={() => setIsModalOpen(true)}
      columns={[
        { key: 'name', label: 'Nome da Propriedade' },
        { key: 'area', label: 'Área Total (ha)', align: 'right' },
      ]}
      renderRow={(farm) => (
        <tr key={farm.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {farm.name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            {Number(farm.total_area_ha).toFixed(2)} ha
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button
              onClick={() => setSelected(farm)}
              title="Ver detalhes"
              className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Eye size={16} />
            </button>
          </td>
        </tr>
      )}
    />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Propriedade">
        <EntityForm
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? selected.name : ''}
        items={selected ? [
          { label: 'Nome da Propriedade', value: selected.name },
          { label: 'Área Total', value: `${Number(selected.total_area_ha).toFixed(2)} ha` },
          { label: 'ID do Produtor', value: selected.producer_id },
          { label: 'ID da Propriedade', value: selected.id },
        ] : []}
      />
    </>
  );
}
