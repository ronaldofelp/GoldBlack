import React, { useEffect, useState } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { settingsApi, seasonsApi } from '../services/api';
import type { SystemSettings, Season } from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function Configuracoes() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // campos do formulário
  const [farmName, setFarmName] = useState('');
  const [farmArea, setFarmArea] = useState('');
  const [activeSeasonId, setActiveSeasonId] = useState<string>('');

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [settingsRes, seasonsRes] = await Promise.all([
          settingsApi.get(),
          seasonsApi.list(),
        ]);
        const s = settingsRes.data;
        setSettings(s);
        setFarmName(s.farm_name);
        setFarmArea(String(s.farm_total_area_ha));
        setActiveSeasonId(s.active_season_id ?? '');
        setSeasons(seasonsRes.data);
      } catch {
        setError('Não foi possível carregar as configurações. Verifique a conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const res = await settingsApi.update({
        farm_name: farmName.trim() || undefined,
        farm_total_area_ha: farmArea ? Number(farmArea) : undefined,
        active_season_id: activeSeasonId || null,
      });
      setSettings(res.data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <Loader2 size={24} className="animate-spin mr-2" />
        Carregando configurações...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={24} className="text-gold" />
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Configurações do Sistema</h1>
          <p className="text-sm text-text-muted mt-0.5">Preferências básicas da fazenda e da plataforma</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Dados da Fazenda */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
            Dados da Fazenda
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5" htmlFor="farmName">
                Nome da fazenda
              </label>
              <input
                id="farmName"
                type="text"
                value={farmName}
                onChange={e => setFarmName(e.target.value)}
                minLength={2}
                maxLength={255}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5" htmlFor="farmArea">
                Área total (ha)
              </label>
              <input
                id="farmArea"
                type="number"
                min="0.01"
                step="0.01"
                value={farmArea}
                onChange={e => setFarmArea(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Preferências de Gestão */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
            Preferências de Gestão
          </h2>
          <div>
            <label className="block text-sm text-text-muted mb-1.5" htmlFor="activeSeason">
              Safra ativa
            </label>
            <select
              id="activeSeason"
              value={activeSeasonId}
              onChange={e => setActiveSeasonId(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold transition-colors"
            >
              <option value="">— Nenhuma safra selecionada —</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1.5">
              Define qual safra é usada por padrão no Painel de Custo e nos relatórios.
            </p>
          </div>
        </section>

        {/* Botão salvar */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {saveStatus === 'saved' && (
              <span className="text-positive-light">Configurações salvas com sucesso.</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400">Erro ao salvar. Tente novamente.</span>
            )}
          </div>
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 bg-gold text-background font-semibold px-5 py-2 rounded-lg text-sm hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saveStatus === 'saving' ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </form>

      {/* Info somente-leitura */}
      {settings && (
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
            Estado atual
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Fazenda</dt>
              <dd className="text-text-primary font-medium">{settings.farm_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Área total</dt>
              <dd className="text-text-primary font-medium">
                {Number(settings.farm_total_area_ha).toLocaleString('pt-BR')} ha
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Safra ativa</dt>
              <dd className="text-text-primary font-medium">
                {settings.active_season_name ?? <span className="text-text-muted italic">não definida</span>}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
