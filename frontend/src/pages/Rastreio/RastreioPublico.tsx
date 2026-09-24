import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QrCode, CheckCircle2, ChevronRight, Save } from 'lucide-react';
import { publicTrackingsApi } from '../../services/api';
import type { CoffeeTracking, TrackingStage } from '../../types';
import { STAGE_LABELS, STAGE_ORDER } from '../../types';
import { clsx } from 'clsx';

export function RastreioPublico() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<CoffeeTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [selectedStage, setSelectedStage] = useState<TrackingStage | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadTracking = async () => {
      if (!code) return;
      try {
        setLoading(true);
        const res = await publicTrackingsApi.getByCode(code);
        setData(res.data);
      } catch (err: any) {
        setError('Rastreio não encontrado ou código inválido.');
      } finally {
        setLoading(false);
      }
    };
    loadTracking();
  }, [code]);

  const getAvailableNextStages = (current: TrackingStage) => {
    const currentIndex = STAGE_ORDER.indexOf(current);
    if (currentIndex === -1 || current === 'FINALIZADO') return [];
    // Etapas seguintes, exceto FINALIZADO: a finalização só é permitida a um
    // usuário autenticado (feita pelo painel admin), não pela página pública do QR.
    return STAGE_ORDER.slice(currentIndex + 1).filter((s) => s !== 'FINALIZADO');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !selectedStage) return;
    
    try {
      setSubmitting(true);
      await publicTrackingsApi.addEvent(data.id, {
        stage: selectedStage,
        notes: notes || undefined,
      });
      setSuccess(true);
    } catch (err) {
      alert("Ocorreu um erro ao registrar a etapa. Tente novamente.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center text-text-muted">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4" />
        <p>Buscando informações do rastreio...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-negative/20 text-negative rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Ops!</h2>
        <p className="text-text-muted max-w-sm">{error || 'Código inválido.'}</p>
      </div>
    );
  }

  const isCompleted = data.status === 'COMPLETED';
  const availableStages = getAvailableNextStages(data.current_stage);

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-positive/20 text-positive rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Etapa Registrada!</h2>
        <p className="text-text-muted mb-8 max-w-sm">
          A etapa <strong>{selectedStage && STAGE_LABELS[selectedStage]}</strong> foi gravada com sucesso no sistema.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gold hover:bg-gold-light text-background font-semibold rounded-lg shadow-gold transition-colors"
        >
          Atualizar outra etapa
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Cabeçalho público */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-background font-black text-sm shadow-md">GB</div>
          <span className="font-bold text-lg text-gold">GoldBlack</span>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <QrCode size={16} />
          <span className="text-xs font-mono">{data.tracking_code}</span>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
        {/* Informações do rastreio */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card text-center">
          <p className="text-sm text-text-muted mb-1">Rastreando lote</p>
          <h1 className="text-lg font-bold text-text-primary leading-tight mb-4">{data.description}</h1>
          
          <div className="inline-flex flex-col items-center bg-background border border-border rounded-lg px-6 py-3 w-full sm:w-auto">
            <span className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">Etapa Atual</span>
            <span className={clsx(
              "text-lg font-bold",
              isCompleted ? "text-positive" : "text-gold"
            )}>
              {STAGE_LABELS[data.current_stage]}
            </span>
          </div>
        </div>

        {isCompleted ? (
          <div className="bg-positive/10 border border-positive/30 rounded-xl p-6 text-center text-positive">
            <CheckCircle2 size={32} className="mx-auto mb-3" />
            <h2 className="font-bold text-lg mb-1">Processo Finalizado</h2>
            <p className="text-sm opacity-90">Este lote de café já concluiu todas as etapas do rastreio.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <ChevronRight className="text-gold" /> Registrar Próxima Etapa
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Selecione a nova etapa <span className="text-negative">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableStages.map(stage => (
                    <label 
                      key={stage}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        selectedStage === stage 
                          ? "bg-gold/10 border-gold text-gold ring-1 ring-gold" 
                          : "bg-background border-border text-text-muted hover:border-text-muted"
                      )}
                    >
                      <input 
                        type="radio" 
                        name="stage" 
                        value={stage}
                        checked={selectedStage === stage}
                        onChange={(e) => setSelectedStage(e.target.value as TrackingStage)}
                        className="sr-only"
                      />
                      <div className={clsx(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        selectedStage === stage ? "border-gold" : "border-text-muted"
                      )}>
                        {selectedStage === stage && <div className="w-2 h-2 bg-gold rounded-full" />}
                      </div>
                      <span className="font-medium text-sm">{STAGE_LABELS[stage]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Observações da Etapa (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Secagem estendida devido à chuva..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text-primary focus:border-gold focus:ring-1 focus:ring-gold/50 min-h-[80px] resize-y text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedStage}
              className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-4 bg-gold hover:bg-gold-light text-background font-bold text-lg rounded-xl transition-all shadow-[0_4px_20px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Save size={20} />
              <span>{submitting ? 'Salvando...' : 'Confirmar e Salvar'}</span>
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
