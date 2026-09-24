import { useEffect, useState } from 'react';
import { CalendarRange, Trash2 } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { Modal } from '../../components/ui/Modal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';
import { seasonsApi } from '../../services/api';
import type { Season } from '../../types';

export function Safras() {
  const [data, setData] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formFields: FieldDef[] = [
    { name: 'name', label: 'Safra (ex.: 2025/2026)', type: 'text', required: true },
    { name: 'start_date', label: 'Início', type: 'date' },
    { name: 'end_date', label: 'Fim', type: 'date' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await seasonsApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar safras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (form: any) => {
    const payload = {
      name: form.name,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    };
    await seasonsApi.create(payload as any);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (season: Season) => {
    if (!confirm(`Excluir a safra "${season.name}"?`)) return;
    try {
      await seasonsApi.delete(season.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir safra');
    }
  };

  return (
    <>
      <EntityPageLayout
        title="Safras"
        description="Ciclos produtivos — a base do custo por talhão × safra"
        icon={<CalendarRange size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
        actionButtonLabel="Nova Safra"
        columns={[
          { key: 'name', label: 'Safra' },
          { key: 'start', label: 'Início' },
          { key: 'end', label: 'Fim' },
        ]}
        renderRow={(s) => (
          <tr key={s.id} className="hover:bg-card-hover group transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{s.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              {s.start_date ? new Date(s.start_date).toLocaleDateString() : '—'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              {s.end_date ? new Date(s.end_date).toLocaleDateString() : '—'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
              <button onClick={() => handleDelete(s)} className="p-1 rounded text-text-muted hover:text-negative transition-colors" title="Excluir">
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Safra">
        <EntityForm fields={formFields} onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}
