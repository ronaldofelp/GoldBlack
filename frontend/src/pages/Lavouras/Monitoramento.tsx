import React, { useEffect, useState } from 'react';
import { LineChart, Eye, Check, AlertTriangle, Calendar } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { DetailModal } from '../../components/ui/DetailModal';
import { alertsApi } from '../../services/api';
import type { SystemAlert } from '../../types';

const TYPE_LABELS: Record<string, string> = {
  WEATHER: 'Climático',
  AGRONOMIC: 'Agronômico',
  SYSTEM: 'Sistema',
};

export function Monitoramento() {
  const [data, setData] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SystemAlert | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await alertsApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar alertas e monitoramento');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (alert: SystemAlert) => {
    try {
      await alertsApi.markRead(alert.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao marcar alerta como lido');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'WEATHER':
        return <span className="px-2 py-1 bg-info/20 text-info rounded text-xs font-medium">Climático</span>;
      case 'AGRONOMIC':
        return <span className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">Agronômico</span>;
      case 'SYSTEM':
        return <span className="px-2 py-1 bg-border text-text-muted rounded text-xs font-medium">Sistema</span>;
      default:
        return <span className="px-2 py-1 bg-border text-text-muted rounded text-xs font-medium">{type}</span>;
    }
  };

  return (
    <>
    <EntityPageLayout
      title="Monitoramento e Alertas"
      description="Acompanhamento climático, alertas agronômicos e notificações"
      icon={<LineChart size={24} />}
      data={data}
      loading={loading}
      error={error}
      onRefresh={loadData}
      columns={[
        { key: 'date', label: 'Data do Alerta' },
        { key: 'type', label: 'Tipo' },
        { key: 'message', label: 'Mensagem' },
        { key: 'status', label: 'Status' },
      ]}
      renderRow={(alert) => (
        <tr key={alert.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-text-muted/70" />
              <span>{new Date(alert.created_at).toLocaleDateString()}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {getTypeBadge(alert.alert_type)}
          </td>
          <td className="px-6 py-4 text-sm text-text-primary">
            {alert.message}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {alert.is_read ? (
              <span className="text-text-muted">Lido</span>
            ) : (
              <span className="flex items-center gap-1 text-warning font-medium">
                <AlertTriangle size={14} /> Novo
              </span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <div className="flex items-center justify-end gap-1">
              {!alert.is_read && (
                <button
                  onClick={() => handleMarkRead(alert)}
                  title="Marcar como lida"
                  className="p-1.5 rounded text-text-muted hover:text-positive-light hover:bg-positive/10 transition-colors"
                >
                  <Check size={16} />
                </button>
              )}
              <button
                onClick={() => setSelected(alert)}
                title="Ver detalhes"
                className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
              >
                <Eye size={16} />
              </button>
            </div>
          </td>
        </tr>
      )}
    />

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Detalhes do Alerta"
        items={selected ? [
          { label: 'Data', value: new Date(selected.created_at).toLocaleString('pt-BR') },
          { label: 'Tipo', value: TYPE_LABELS[selected.alert_type] ?? selected.alert_type },
          { label: 'Status', value: selected.is_read ? 'Lido' : 'Novo' },
          { label: 'Mensagem', value: selected.message, full: true },
          { label: 'ID', value: selected.id },
        ] : []}
      />
    </>
  );
}
