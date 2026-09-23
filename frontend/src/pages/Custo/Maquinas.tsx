import { useEffect, useState } from 'react';
import { Tractor, Trash2 } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { Modal } from '../../components/ui/Modal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';
import { machinesApi, farmsApi } from '../../services/api';
import type { Machine, Farm } from '../../types';

export function Maquinas() {
  const [data, setData] = useState<Machine[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const farmName = (id: string) => farms.find((f) => f.id === id)?.name ?? id;

  const formFields: FieldDef[] = [
    { name: 'farm_id', label: 'Fazenda', type: 'select', required: true,
      options: farms.map((f) => ({ value: f.id, label: f.name })) },
    { name: 'name', label: 'Máquina (ex.: Trator John Deere)', type: 'text', required: true },
    { name: 'hourly_cost', label: 'Custo por hora (R$)', type: 'number', required: true },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [machinesRes, farmsRes] = await Promise.all([machinesApi.list(), farmsApi.list()]);
      setData(machinesRes.data);
      setFarms(farmsRes.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar máquinas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (form: any) => {
    await machinesApi.create(form);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (m: Machine) => {
    if (!confirm(`Excluir a máquina "${m.name}"?`)) return;
    try {
      await machinesApi.delete(m.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir máquina');
    }
  };

  return (
    <>
      <EntityPageLayout
        title="Máquinas"
        description="Equipamentos e seu custo hora-máquina"
        icon={<Tractor size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
        actionButtonLabel="Nova Máquina"
        columns={[
          { key: 'name', label: 'Máquina' },
          { key: 'farm', label: 'Fazenda' },
          { key: 'hourly_cost', label: 'Custo/hora', align: 'right' },
        ]}
        renderRow={(m) => (
          <tr key={m.id} className="hover:bg-card-hover group transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{m.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">{farmName(m.farm_id)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-text-primary">
              R$ {Number(m.hourly_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
              <button onClick={() => handleDelete(m)} className="p-1 rounded text-text-muted hover:text-negative transition-colors" title="Excluir">
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Máquina">
        <EntityForm fields={formFields} onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}
