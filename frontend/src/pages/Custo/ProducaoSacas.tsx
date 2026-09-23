import { useEffect, useState } from 'react';
import { Wheat, Trash2, Calendar } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { Modal } from '../../components/ui/Modal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';
import { productionsApi, plotsApi, seasonsApi } from '../../services/api';
import type { Production, Plot, Season } from '../../types';

export function ProducaoSacas() {
  const [data, setData] = useState<Production[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plotCode = (id: string) => plots.find((p) => p.id === id)?.code ?? id;
  const seasonName = (id: string) => seasons.find((s) => s.id === id)?.name ?? id;

  const formFields: FieldDef[] = [
    { name: 'plot_id', label: 'Talhão', type: 'select', required: true,
      options: plots.map((p) => ({ value: p.id, label: p.code })) },
    { name: 'season_id', label: 'Safra', type: 'select', required: true,
      options: seasons.map((s) => ({ value: s.id, label: s.name })) },
    { name: 'sacks_produced', label: 'Sacas produzidas', type: 'number', required: true },
    { name: 'harvest_date', label: 'Data da colheita', type: 'date' },
    { name: 'notes', label: 'Observações', type: 'text' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, plotsRes, seasonsRes] = await Promise.all([
        productionsApi.list(), plotsApi.list(), seasonsApi.list(),
      ]);
      setData(prodRes.data);
      setPlots(plotsRes.data);
      setSeasons(seasonsRes.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar produção');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (form: any) => {
    const payload = {
      plot_id: form.plot_id,
      season_id: form.season_id,
      sacks_produced: form.sacks_produced,
      harvest_date: form.harvest_date ? new Date(form.harvest_date).toISOString() : null,
      notes: form.notes || null,
    };
    await productionsApi.create(payload as any);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (p: Production) => {
    if (!confirm('Excluir este lançamento de produção?')) return;
    try {
      await productionsApi.delete(p.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir produção');
    }
  };

  return (
    <>
      <EntityPageLayout
        title="Produção (sacas)"
        description="Sacas colhidas por talhão × safra — o denominador do custo por saca"
        icon={<Wheat size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
        actionButtonLabel="Nova Produção"
        columns={[
          { key: 'plot', label: 'Talhão' },
          { key: 'season', label: 'Safra', align: 'center' },
          { key: 'sacks', label: 'Sacas', align: 'right' },
          { key: 'date', label: 'Colheita' },
        ]}
        renderRow={(p) => (
          <tr key={p.id} className="hover:bg-card-hover group transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{plotCode(p.plot_id)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-text-muted">{seasonName(p.season_id)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-text-primary">
              {Number(p.sacks_produced).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              {p.harvest_date ? (
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-text-muted/70" />
                  <span>{new Date(p.harvest_date).toLocaleDateString()}</span>
                </div>
              ) : '—'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
              <button onClick={() => handleDelete(p)} className="p-1 rounded text-text-muted hover:text-negative transition-colors" title="Excluir">
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Produção (sacas)">
        <EntityForm fields={formFields} onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}
