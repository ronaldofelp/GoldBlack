import React, { useEffect, useState } from 'react';
import { Settings, Eye } from 'lucide-react';
import { EntityPageLayout } from '../components/layout/EntityPageLayout';
import { DetailModal } from '../components/ui/DetailModal';

interface ConfigItem {
  id: string;
  module: string;
  parameter: string;
  value: string;
  lastUpdated: string;
}

export function Configuracoes() {
  const [data, setData] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ConfigItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setData([
        {
          id: '1',
          module: 'Sistema',
          parameter: 'Moeda Padrão',
          value: 'BRL (R$)',
          lastUpdated: '2025-01-10',
        },
        {
          id: '2',
          module: 'Notificações',
          parameter: 'Alertas por Email',
          value: 'Ativado',
          lastUpdated: '2025-06-22',
        },
        {
          id: '3',
          module: 'Acessos',
          parameter: 'Autenticação em Dois Fatores (2FA)',
          value: 'Desativado',
          lastUpdated: '2025-07-05',
        }
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
    <EntityPageLayout
      title="Configurações do Sistema"
      description="Gerencie parâmetros gerais, usuários e preferências"
      icon={<Settings size={24} />}
      data={data}
      loading={loading}
      onRefresh={loadData}
      columns={[
        { key: 'module', label: 'Módulo' },
        { key: 'parameter', label: 'Parâmetro' },
        { key: 'value', label: 'Valor Atual' },
        { key: 'updated', label: 'Última Atualização' },
      ]}
      renderRow={(config) => (
        <tr key={config.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            {config.module}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-primary">
            {config.parameter}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            {config.value === 'Ativado' ? (
              <span className="text-positive-light bg-positive/10 px-2 py-1 rounded text-xs">Ativado</span>
            ) : config.value === 'Desativado' ? (
              <span className="text-text-muted bg-background border border-border px-2 py-1 rounded text-xs">Desativado</span>
            ) : (
              <span className="font-mono text-sm">{config.value}</span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            {new Date(config.lastUpdated).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button
              onClick={() => setSelected(config)}
              title="Ver detalhes"
              className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Eye size={16} />
            </button>
          </td>
        </tr>
      )}
    />

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Detalhes do Parâmetro"
        items={selected ? [
          { label: 'Módulo', value: selected.module },
          { label: 'Parâmetro', value: selected.parameter },
          { label: 'Valor Atual', value: selected.value },
          { label: 'Última Atualização', value: new Date(selected.lastUpdated).toLocaleDateString('pt-BR') },
        ] : []}
      />
    </>
  );
}
