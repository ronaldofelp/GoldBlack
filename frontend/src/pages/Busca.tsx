import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Activity, PackageSearch } from 'lucide-react';
import { plotsApi, activitiesApi, salesApi } from '../services/api';
import type { Plot, AgriculturalActivity, Sale } from '../types';

interface SearchResult {
  id: string;
  type: 'Talhão' | 'Atividade' | 'Venda';
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
}

export function Busca() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const [plotsRes, activitiesRes, salesRes] = await Promise.all([
          plotsApi.list().catch(() => ({ data: [] })),
          activitiesApi.list().catch(() => ({ data: [] })),
          salesApi.list().catch(() => ({ data: [] }))
        ]);

        const qLower = query.toLowerCase();
        const searchResults: SearchResult[] = [];

        // Search Plots
        plotsRes.data.forEach((plot: Plot) => {
          if (plot.code.toLowerCase().includes(qLower) || (plot.variety && plot.variety.toLowerCase().includes(qLower))) {
            searchResults.push({
              id: `plot-${plot.id}`,
              type: 'Talhão',
              title: `Talhão ${plot.code}`,
              description: `Variedade: ${plot.variety || 'N/A'} - Área: ${plot.area_ha}ha`,
              link: '/lavouras/talhoes',
              icon: <MapPin size={20} className="text-gold" />
            });
          }
        });

        // Search Activities
        activitiesRes.data.forEach((act: AgriculturalActivity) => {
          if (act.type.toLowerCase().includes(qLower) || act.status.toLowerCase().includes(qLower)) {
            searchResults.push({
              id: `act-${act.id}`,
              type: 'Atividade',
              title: `Atividade: ${act.type}`,
              description: `Status: ${act.status} - Data: ${new Date(act.start_date).toLocaleDateString()}`,
              link: '/lavouras/atividades',
              icon: <Activity size={20} className="text-info" />
            });
          }
        });

        // Search Sales
        salesRes.data.forEach((sale: Sale) => {
          if (sale.customer.toLowerCase().includes(qLower) || (sale.sale_invoice && sale.sale_invoice.toLowerCase().includes(qLower))) {
            searchResults.push({
              id: `sale-${sale.id}`,
              type: 'Venda',
              title: `Venda para ${sale.customer}`,
              description: `Nota: ${sale.sale_invoice || 'S/N'} - Valor: R$ ${sale.total_value.toFixed(2)}`,
              link: '/vendas',
              icon: <PackageSearch size={20} className="text-positive" />
            });
          }
        });

        setResults(searchResults);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="p-8 max-w-[1000px] mx-auto w-full">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Resultados da Busca</h1>
      <p className="text-text-muted mb-8">
        Mostrando resultados para: <span className="font-semibold text-text-primary">"{query}"</span>
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4" />
          <p>Buscando em todo o sistema...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <div 
              key={result.id} 
              onClick={() => navigate(result.link)}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-gold cursor-pointer transition-colors group shadow-card"
            >
              <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center border border-border group-hover:bg-gold/10 transition-colors">
                {result.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-border text-text-muted">
                    {result.type}
                  </span>
                  <h3 className="font-semibold text-text-primary group-hover:text-gold transition-colors">
                    {result.title}
                  </h3>
                </div>
                <p className="text-sm text-text-muted">{result.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4">
            <Search size={28} className="text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">Nenhum resultado encontrado</h3>
          <p className="text-text-muted">
            Não encontramos nenhum talhão, atividade ou lote que corresponda a "{query}".
          </p>
        </div>
      )}
    </div>
  );
}
