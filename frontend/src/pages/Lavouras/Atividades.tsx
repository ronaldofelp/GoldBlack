import { useEffect, useState } from 'react';
import { Activity, Calendar, Calculator } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { activitiesApi, plotsApi, seasonsApi } from '../../services/api';
import type { AgriculturalActivity, Plot, Season } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';
import { ActivityCostModal } from '../Custo/ActivityCostModal';

interface AtividadesProps {
  filterType?: string;
  pageTitle?: string;
}

export function Atividades({ filterType, pageTitle = "Atividades e Tratos Culturais" }: AtividadesProps) {
  const [data, setData] = useState<AgriculturalActivity[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [costActivityId, setCostActivityId] = useState<string | null>(null);

  const plotCode = (id: string) => plots.find((p) => p.id === id)?.code ?? `ID: ${id.substring(0, 6)}`;

  const formFields: FieldDef[] = [
    {
      name: 'type',
      label: 'Tipo de Atividade',
      type: 'select',
      required: true,
      defaultValue: filterType,
      options: [
        { value: 'FERTILIZATION', label: 'Adubação' },
        { value: 'PRUNING', label: 'Poda' },
        { value: 'HARVEST', label: 'Colheita' },
        { value: 'IRRIGATION', label: 'Irrigação' },
        { value: 'PESTICIDE_APPLICATION', label: 'Aplicação de Defensivos' }
      ]
    },
    { name: 'plot_id', label: 'Talhão', type: 'select', required: true,
      options: plots.map((p) => ({ value: p.id, label: p.code })) },
    { name: 'season_id', label: 'Safra (p/ o custo)', type: 'select',
      options: seasons.map((s) => ({ value: s.id, label: s.name })) },
    { name: 'start_date', label: 'Data de Início', type: 'date', required: true },
    { name: 'end_date', label: 'Data de Término', type: 'date' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'IN_PROGRESS', label: 'Em Andamento' },
        { value: 'COMPLETED', label: 'Concluído' }
      ]
    },
  ];

  const handleCreate = async (form: any) => {
    const payload = { ...form };
    if (payload.start_date) payload.start_date = new Date(payload.start_date).toISOString();
    if (payload.end_date) payload.end_date = new Date(payload.end_date).toISOString();
    if (!payload.season_id) payload.season_id = null;
    await activitiesApi.create(payload);
    setIsModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [actRes, plotsRes, seasonsRes] = await Promise.all([
        activitiesApi.list(), plotsApi.list(), seasonsApi.list(),
      ]);
      let activities = actRes.data;
      if (filterType) {
        activities = activities.filter((a: AgriculturalActivity) => a.type === filterType);
      }
      setData(activities);
      setPlots(plotsRes.data);
      setSeasons(seasonsRes.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 bg-positive/20 text-positive-light rounded text-xs font-medium">Concluído</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-1 bg-info/20 text-info rounded text-xs font-medium">Em Andamento</span>;
      case 'PENDING':
        return <span className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">Pendente</span>;
      default:
        return <span className="px-2 py-1 bg-border text-text-muted rounded text-xs font-medium">{status}</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      FERTILIZATION: 'Adubação',
      PRUNING: 'Poda',
      HARVEST: 'Colheita',
      IRRIGATION: 'Irrigação',
      PESTICIDE_APPLICATION: 'Aplicação de Defensivos'
    };
    return map[type] || type;
  };

  return (
    <>
      <EntityPageLayout
        title={pageTitle}
        description={filterType ? `Gerencie os registros de ${pageTitle.toLowerCase()}` : "Gerencie as atividades operacionais da fazenda"}
        icon={<Activity size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
        columns={[
          { key: 'type', label: 'Tipo de Atividade' },
          { key: 'plot', label: 'Talhão' },
          { key: 'date', label: 'Período' },
          { key: 'status', label: 'Status' },
        ]}
        renderRow={(activity) => (
          <tr key={activity.id} className="hover:bg-card-hover group transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
              {getTypeLabel(activity.type)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              <span className="font-mono text-xs border border-border px-1.5 py-0.5 rounded bg-background">{plotCode(activity.plot_id)}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-text-muted/70" />
                <span>{new Date(activity.start_date).toLocaleDateString()}</span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {getStatusBadge(activity.status)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
              <button
                onClick={() => setCostActivityId(activity.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-text-muted hover:text-gold border border-border hover:border-gold transition-colors"
                title="Apontar custos (insumos, mão de obra, máquina)"
              >
                <Calculator size={14} /> Custos
              </button>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Nova ${filterType ? pageTitle : 'Atividade'}`}>
        <EntityForm
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {costActivityId && (
        <ActivityCostModal activityId={costActivityId} onClose={() => setCostActivityId(null)} />
      )}
    </>
  );
}
