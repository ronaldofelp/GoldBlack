import React, { useEffect, useState } from 'react';
import { BarChart3, Eye, FileText } from 'lucide-react';
import { EntityPageLayout } from '../components/layout/EntityPageLayout';
import { DetailModal } from '../components/ui/DetailModal';

interface Report {
  id: string;
  name: string;
  category: string;
  date: string;
  format: string;
}

export function Relatorios() {
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setData([
        {
          id: '1',
          name: 'Relatório Financeiro DRE Mensal',
          category: 'Financeiro',
          date: '2025-08-01',
          format: 'PDF',
        },
        {
          id: '2',
          name: 'Balanço de Produtividade por Talhão',
          category: 'Agrícola',
          date: '2025-08-15',
          format: 'Excel',
        },
        {
          id: '3',
          name: 'Extrato de Vendas Consolidado',
          category: 'Comercial',
          date: '2025-08-20',
          format: 'PDF',
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
      title="Relatórios e Exportações"
      description="Gere e exporte relatórios consolidados do sistema"
      icon={<BarChart3 size={24} />}
      data={data}
      loading={loading}
      onRefresh={loadData}
      columns={[
        { key: 'name', label: 'Nome do Relatório' },
        { key: 'category', label: 'Categoria' },
        { key: 'date', label: 'Data de Geração' },
        { key: 'format', label: 'Formato', align: 'center' },
      ]}
      renderRow={(report) => (
        <tr key={report.id} className="hover:bg-card-hover group transition-colors">
          <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gold" />
              <span>{report.name}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            {report.category}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-text-muted">
            {new Date(report.date).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className="px-2 py-1 bg-background border border-border text-text-muted rounded text-xs font-medium uppercase">
              {report.format}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
            <button
              onClick={() => setSelected(report)}
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
        title="Detalhes do Relatório"
        items={selected ? [
          { label: 'Nome', value: selected.name, full: true },
          { label: 'Categoria', value: selected.category },
          { label: 'Data de Geração', value: new Date(selected.date).toLocaleDateString('pt-BR') },
          { label: 'Formato', value: selected.format },
        ] : []}
      />
    </>
  );
}
