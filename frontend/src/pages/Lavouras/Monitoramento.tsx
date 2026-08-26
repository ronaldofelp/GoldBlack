import React, { useEffect, useState } from 'react';
import { LineChart, MoreHorizontal, AlertTriangle, Calendar } from 'lucide-react';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { alertsApi } from '../../services/api';
import type { SystemAlert } from '../../types';

export function Monitoramento() {
  const [data, setData] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <button className="p-1 rounded text-text-muted hover:text-gold transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </td>
        </tr>
      )}
    />
  );
}
