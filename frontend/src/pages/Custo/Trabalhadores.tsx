import { useEffect, useState } from 'react';
import { Users, Trash2 } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { Modal } from '../../components/ui/Modal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';
import { workersApi, farmsApi } from '../../services/api';
import type { Worker, Farm } from '../../types';

const TYPE_LABEL: Record<string, string> = {
  REGISTERED: 'Registrado',
  THIRD_PARTY: 'Terceiro',
};

export function Trabalhadores() {
  const [data, setData] = useState<Worker[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const farmName = (id: string) => farms.find((f) => f.id === id)?.name ?? id;

  const formFields: FieldDef[] = [
    { name: 'farm_id', label: 'Fazenda', type: 'select', required: true,
      options: farms.map((f) => ({ value: f.id, label: f.name })) },
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'type', label: 'Tipo', type: 'select', required: true, defaultValue: 'REGISTERED',
      options: [
        { value: 'REGISTERED', label: 'Registrado' },
        { value: 'THIRD_PARTY', label: 'Terceiro' },
      ] },
    { name: 'daily_rate', label: 'Diária (R$)', type: 'number' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [workersRes, farmsRes] = await Promise.all([workersApi.list(), farmsApi.list()]);
      setData(workersRes.data);
      setFarms(farmsRes.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar trabalhadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (form: any) => {
    await workersApi.create(form);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (w: Worker) => {
    if (!confirm(`Excluir o trabalhador "${w.name}"?`)) return;
    try {
      await workersApi.delete(w.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir trabalhador');
    }
  };

  return (
    <>
      <EntityPageLayout
        title="Trabalhadores"
        description="Mão de obra registrada e terceirizada (base da diária)"
        icon={<Users size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
        actionButtonLabel="Novo Trabalhador"
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'farm', label: 'Fazenda' },
          { key: 'type', label: 'Tipo', align: 'center' },
          { key: 'daily_rate', label: 'Diária', align: 'right' },
        ]}
        renderRow={(w) => (
          <tr key={w.id} className="hover:bg-card-hover group transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{w.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">{farmName(w.farm_id)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <span className="px-2 py-1 bg-border text-text-muted rounded text-xs font-medium">{TYPE_LABEL[w.type] ?? w.type}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-text-primary">
              {w.daily_rate != null ? `R$ ${Number(w.daily_rate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
              <button onClick={() => handleDelete(w)} className="p-1 rounded text-text-muted hover:text-negative transition-colors" title="Excluir">
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Trabalhador">
        <EntityForm fields={formFields} onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}
