import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, QrCode, Clock, CheckCircle2 } from 'lucide-react';
import { trackingsApi } from '../../services/api';
import type { CoffeeTracking } from '../../types';
import { STAGE_LABELS } from '../../types';
import { EntityPageLayout } from '../../components/layout/EntityPageLayout';
import { clsx } from 'clsx';

export function Rastreio() {
  const navigate = useNavigate();
  const [data, setData] = useState<CoffeeTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await trackingsApi.list(activeTab);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar rastreios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const intervalId = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeTab]);

  const columns = [
    { key: 'tracking_code', label: 'Código' },
    { key: 'description', label: 'Descrição' },
    { key: 'current_stage', label: 'Etapa Atual' },
    { key: 'date', label: 'Última Atualização' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Abas */}
      <div className="px-6 pt-6 bg-card border-b border-border flex gap-6">
        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={clsx(
            "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'IN_PROGRESS' 
              ? "border-gold text-gold" 
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          <Clock size={16} />
          Em Andamento
        </button>
        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={clsx(
            "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'COMPLETED' 
              ? "border-gold text-gold" 
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          <CheckCircle2 size={16} />
          Finalizados
        </button>
      </div>

      <div className="flex-1 -mt-6">
        <EntityPageLayout
          title="Rastreio do Café"
          description="Acompanhe o ciclo do café em tempo real via QR Code."
          icon={<ScanLine />}
          columns={columns}
          data={data}
          loading={loading}
          error={error}
          onRefresh={loadData}
          onAdd={() => navigate('/rastreio/novo')}
          actionButtonLabel="Novo Rastreio"
          renderRow={(item) => (
            <tr 
              key={item.id} 
              className="hover:bg-card/50 transition-colors cursor-pointer group"
              onClick={() => navigate(`/rastreio/${item.id}`)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <QrCode size={16} className="text-gold" />
                  <span className="font-mono font-medium text-text-primary">{item.tracking_code}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-text-primary font-medium">{item.description}</span>
                {item.batch_id && (
                  <p className="text-xs text-text-muted mt-0.5">Vinc. a Lote</p>
                )}
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                  {STAGE_LABELS[item.current_stage]}
                </span>
              </td>
              <td className="px-6 py-4 text-text-muted text-sm whitespace-nowrap">
                {new Date(item.updated_at).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-6 py-4 text-right">
                <button 
                  className="text-sm text-gold font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/rastreio/${item.id}`);
                  }}
                >
                  Ver Detalhes &rarr;
                </button>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
