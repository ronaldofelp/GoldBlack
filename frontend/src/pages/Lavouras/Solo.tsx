import React, { useEffect, useState } from 'react';
import { TestTube, Eye, Calendar, ExternalLink } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { soilAnalysesApi } from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { DetailModal } from '../../components/ui/DetailModal';
import { EntityForm, type FieldDef } from '../../components/ui/EntityForm';

// Tipos mock locais até a API estar totalmente ligada para este endpoint específico
interface SoilAnalysis {
  id: string;
  plot_id: string;
  collection_date: string;
  ph: number;
  organic_matter: number;
  report_url?: string;
}

export function Solo() {
  const [data, setData] = useState<SoilAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<SoilAnalysis | null>(null);

  const formFields: FieldDef[] = [
    { name: 'plot_id', label: 'ID do Talhão', type: 'text', required: true },
    { name: 'collection_date', label: 'Data da Coleta', type: 'date', required: true },
    { name: 'ph', label: 'pH do Solo', type: 'number', required: true },
    { name: 'organic_matter', label: 'Matéria Orgânica (%)', type: 'number' },
    { name: 'report_url', label: 'URL do Laudo PDF', type: 'text' },
  ];

  const handleCreate = async (data: any) => {
    if (data.collection_date) data.collection_date = new Date(data.collection_date).toISOString();
    await soilAnalysesApi.create(data);
    setIsModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await soilAnalysesApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar análises de solo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPhBadge = (ph: number) => {
    if (ph >= 6.0 && ph <= 6.5) {
      return <span className="px-2 py-1 bg-positive/20 text-positive-light rounded text-xs font-medium">Ideal ({ph})</span>;
    }
    if (ph < 6.0) {
      return <span className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">Ácido ({ph})</span>;
    }
    return <span className="px-2 py-1 bg-negative/20 text-negative-light rounded text-xs font-medium">Alcalino ({ph})</span>;
  };

  return (
    <>
      <EntityPageLayout
        title="Análises de Solo"
        description="Gerencie laudos e indicadores de fertilidade"
        icon={<TestTube size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
      columns={[
        { key: 'plot', label: 'Talhão' },
        { key: 'date', label: 'Data da Coleta' },
        { key: 'ph', label: 'Nível de pH', align: 'center' },
        { key: 'mo', label: 'Matéria Orgânica (%)', align: 'right' },
        { key: 'report', label: 'Laudo', align: 'center' },
      ]}
      renderRow={(soil) => (
        <tr key={soil.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {soil.plot_id}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-text-muted/70" />
              <span>{new Date(soil.collection_date).toLocaleDateString()}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            {getPhBadge(soil.ph)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-text-muted">
            {soil.organic_matter != null ? `${Number(soil.organic_matter).toFixed(1)}%` : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            {soil.report_url ? (
              <a href={soil.report_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold hover:text-gold-light transition-colors text-sm">
                <ExternalLink size={14} />
                <span>Ver PDF</span>
              </a>
            ) : (
              <span className="text-text-muted text-sm">—</span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button
              onClick={() => setSelected(soil)}
              title="Ver detalhes"
              className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Eye size={16} />
            </button>
          </td>
        </tr>
      )}
    />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Análise de Solo">
        <EntityForm
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Detalhes da Análise de Solo"
        items={selected ? [
          { label: 'ID do Talhão', value: selected.plot_id },
          { label: 'Data da Coleta', value: new Date(selected.collection_date).toLocaleDateString('pt-BR') },
          { label: 'pH', value: selected.ph },
          { label: 'Matéria Orgânica', value: selected.organic_matter != null ? `${Number(selected.organic_matter).toFixed(1)}%` : null },
          { label: 'Laudo (PDF)', value: selected.report_url
              ? <a href={selected.report_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold hover:text-gold-light">
                  <ExternalLink size={14} /> Abrir laudo
                </a>
              : null, full: true },
          { label: 'ID da Análise', value: selected.id },
        ] : []}
      />
    </>
  );
}
