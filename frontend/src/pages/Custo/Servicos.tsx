import { useEffect, useState } from 'react';
import { Handshake, Trash2 } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { Modal } from '../../components/ui/Modal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';
import { serviceDefinitionsApi, farmsApi } from '../../services/api';
import type { ServiceDefinition, Farm } from '../../types';

export function Servicos() {
  const [data, setData] = useState<ServiceDefinition[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const farmName = (id: string) => farms.find((f) => f.id === id)?.name ?? id;

  const formFields: FieldDef[] = [
    { name: 'farm_id', label: 'Fazenda', type: 'select', required: true,
      options: farms.map((f) => ({ value: f.id, label: f.name })) },
    { name: 'name', label: 'Serviço (ex.: Desbrota, Roçada)', type: 'text', required: true },
    { name: 'unit_description', label: 'Unidade (ex.: 1 serviço = 15 ruas)', type: 'text' },
    { name: 'unit_value', label: 'Valor por unidade (R$)', type: 'number', required: true },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [svcRes, farmsRes] = await Promise.all([serviceDefinitionsApi.list(), farmsApi.list()]);
      setData(svcRes.data);
      setFarms(farmsRes.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (form: any) => {
    await serviceDefinitionsApi.create(form);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (s: ServiceDefinition) => {
    if (!confirm(`Excluir o serviço "${s.name}"?`)) return;
    try {
      await serviceDefinitionsApi.delete(s.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir serviço');
    }
  };

  return (
    <>
      <EntityPageLayout
        title="Serviços / Empreitas"
        description="Trabalho terceirizado por unidade (ex.: 1 serviço = 15 ruas)"
        icon={<Handshake size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
        actionButtonLabel="Novo Serviço"
        columns={[
          { key: 'name', label: 'Serviço' },
          { key: 'farm', label: 'Fazenda' },
          { key: 'unit', label: 'Unidade' },
          { key: 'unit_value', label: 'Valor/unidade', align: 'right' },
        ]}
        renderRow={(s) => (
          <tr key={s.id} className="hover:bg-card-hover group transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{s.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">{farmName(s.farm_id)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">{s.unit_description || '—'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-text-primary">
              R$ {Number(s.unit_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
              <button onClick={() => handleDelete(s)} className="p-1 rounded text-text-muted hover:text-negative transition-colors" title="Excluir">
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Serviço / Empreita">
        <EntityForm fields={formFields} onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}
