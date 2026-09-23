import React, { useEffect, useState } from 'react';
import { Activity, MoreHorizontal, Calendar, Clock } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { activitiesApi } from '../../services/api';
import type { AgriculturalActivity } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';

interface AtividadesProps {
  filterType?: string;
  pageTitle?: string;
}

export function Atividades({ filterType, pageTitle = "Atividades e Tratos Culturais" }: AtividadesProps) {
  const [data, setData] = useState<AgriculturalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formFields: FieldDef[] = [
    {
      name: 'type',
      label: 'Tipo de Atividade',
      type: 'select',
      required: true,
      options: [
        { value: 'FERTILIZATION', label: 'Adubação' },
        { value: 'PRUNING', label: 'Poda' },
        { value: 'HARVEST', label: 'Colheita' },
        { value: 'IRRIGATION', label: 'Irrigação' },
        { value: 'PESTICIDE_APPLICATION', label: 'Aplicação de Defensivos' }
      ]
    },
    { name: 'plot_id', label: 'ID do Talhão', type: 'text', required: true },
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
    { name: 'worked_hours', label: 'Horas Trabalhadas', type: 'number' },
    { name: 'labor_cost', label: 'Custo de Mão de Obra', type: 'number' },
  ];

  const handleCreate = async (data: any) => {
    if (data.start_date) data.start_date = new Date(data.start_date).toISOString();
    if (data.end_date) data.end_date = new Date(data.end_date).toISOString();
    await activitiesApi.create(data);
    setIsModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await activitiesApi.list();
      let activities = res.data;
      if (filterType) {
        activities = activities.filter((a: AgriculturalActivity) => a.type === filterType);
      }
      setData(activities);
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

  const getDynamicFields = () => {
    const fields = [...formFields];
    if (filterType) {
      const typeField = fields.find(f => f.name === 'type');
      if (typeField) {
        typeField.defaultValue = filterType;
      }
    }
    return fields;
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
          { key: 'cost', label: 'Custo (M.O.)', align: 'right' },
          { key: 'status', label: 'Status' },
        ]}
        renderRow={(activity) => (
          <tr key={activity.id} className="hover:bg-card-hover group transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
              {getTypeLabel(activity.type)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              <span className="font-mono text-xs border border-border px-1.5 py-0.5 rounded bg-background">ID: {activity.plot_id.substring(0, 6)}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-text-muted/70" />
                <span>{new Date(activity.start_date).toLocaleDateString()}</span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-text-muted">
              {activity.labor_cost != null ? `R$ ${Number(activity.labor_cost).toFixed(2)}` : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {getStatusBadge(activity.status)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
              <button className="p-1 rounded text-text-muted hover:text-gold transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Nova ${filterType ? pageTitle : 'Atividade'}`}>
        <EntityForm
          fields={getDynamicFields()}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}
