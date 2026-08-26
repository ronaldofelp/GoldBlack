import React, { useState, useMemo } from 'react';
import { Plus, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface EntityPageLayoutProps<T> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  columns: Column[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onAdd?: () => void;
  renderRow: (item: T, index: number) => React.ReactNode;
  actionButtonLabel?: string;
}

export function EntityPageLayout<T>({
  title,
  description,
  icon,
  columns,
  data,
  loading = false,
  error = null,
  onRefresh,
  onAdd,
  renderRow,
  actionButtonLabel = 'Novo Cadastro',
}: EntityPageLayoutProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (!item) return false;
      return Object.values(item).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
      );
    });
  }, [data, searchTerm]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-gold shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
            <p className="text-text-muted text-sm mt-0.5">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button 
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded bg-card border border-border text-text-muted hover:text-text-primary hover:border-gold transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={clsx(loading && "animate-spin")} />
            </button>
          )}
          {onAdd && (
            <button 
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-background font-semibold rounded transition-colors shadow-gold"
            >
              <Plus size={18} />
              <span>{actionButtonLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar / Filters (Placeholder for future) */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-card border border-border rounded pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-card border border-border rounded-xl flex-1 flex flex-col min-h-0 overflow-hidden shadow-card">
        {error && (
          <div className="m-4 p-4 rounded bg-negative/10 border border-negative/20 flex items-start gap-3">
            <AlertCircle className="text-negative mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-negative font-medium text-sm">Erro ao carregar dados</p>
              <p className="text-text-muted text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-10 shadow-sm">
              <tr>
                {columns.map((col) => (
                  <th 
                    key={col.key} 
                    className={clsx(
                      "px-6 py-4 font-semibold tracking-wider whitespace-nowrap",
                      col.align === 'center' && "text-center",
                      col.align === 'right' && "text-right"
                    )}
                  >
                    {col.label}
                  </th>
                ))}
                {/* Actions column */}
                <th className="px-6 py-4 font-semibold tracking-wider text-right sticky right-0 bg-card/80 backdrop-blur-sm">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-text-muted">
                    <RefreshCw className="animate-spin mx-auto mb-3" size={24} />
                    <p>Carregando dados...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 && !error ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-text-muted">
                    <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mx-auto mb-3 opacity-50">
                      {icon || <Search size={24} />}
                    </div>
                    <p className="font-medium text-text-primary mb-1">
                      {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum registro encontrado'}
                    </p>
                    <p>
                      {searchTerm 
                        ? `Não encontramos registros para "${searchTerm}".` 
                        : `Você ainda não cadastrou nenhum ${title.toLowerCase()}.`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => renderRow(item, index))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
