import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, Printer } from 'lucide-react';
import { trackingsApi } from '../../services/api';
import type { CoffeeTracking } from '../../types';
import { TrackingTimeline } from './components/TrackingTimeline';
import { clsx } from 'clsx';
import jsPDF from 'jspdf';

export function DetalheRastreio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CoffeeTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingFinal, setMarkingFinal] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await trackingsApi.getById(id);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar detalhes do rastreio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleMarkAsCompleted = async () => {
    if (!id) return;
    try {
      setMarkingFinal(true);
      await trackingsApi.addEvent(id, {
        stage: 'FINALIZADO',
        notes: 'Processo finalizado manualmente pelo painel admin.',
        recorded_by: 'Administrador'
      });
      await loadData();
    } catch (err) {
      alert("Erro ao finalizar rastreio.");
    } finally {
      setMarkingFinal(false);
    }
  };

  const downloadPDF = async () => {
    if (!data) return;
    
    try {
      const qrCodeUrl = trackingsApi.getQRCodeUrl(data.id);
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        doc.setFontSize(22);
        doc.text('GoldBlack Coffee Tracking', 105, 30, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text(`Rastreio: ${data.tracking_code}`, 105, 45, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(data.description, 105, 55, { align: 'center' });
        
        doc.addImage(base64data, 'PNG', 55, 70, 100, 100);
        
        doc.setFontSize(10);
        doc.text('Escaneie este QR Code para atualizar as etapas do processo.', 105, 185, { align: 'center' });
        
        doc.save(`qrcode-${data.tracking_code}.pdf`);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF.");
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-text-muted">Carregando detalhes do rastreio...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-5xl mx-auto w-full">
        <div className="p-4 rounded bg-negative/10 border border-negative/20 text-negative flex flex-col gap-4">
          <p>{error || 'Rastreio não encontrado.'}</p>
          <button onClick={() => navigate('/rastreio')} className="self-start underline">Voltar para listagem</button>
        </div>
      </div>
    );
  }

  const isCompleted = data.status === 'COMPLETED';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/rastreio')}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:text-gold hover:border-gold transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{data.tracking_code}</h1>
              {isCompleted && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-positive/20 text-positive text-xs font-semibold uppercase tracking-wide">
                  <CheckCircle2 size={14} />
                  Finalizado
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm mt-1">{data.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded text-text-primary hover:text-gold hover:border-gold transition-colors text-sm font-medium shadow-sm"
          >
            <Printer size={16} />
            <span>Imprimir QR Code</span>
          </button>
          {!isCompleted && (
            <button 
              onClick={handleMarkAsCompleted}
              disabled={markingFinal}
              className="flex items-center gap-2 px-4 py-2 bg-positive/10 hover:bg-positive/20 text-positive border border-positive/30 font-medium rounded transition-colors"
            >
              <CheckCircle2 size={16} />
              <span>{markingFinal ? 'Finalizando...' : 'Marcar como Finalizado'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Timeline */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-card relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
          
          <h2 className="text-lg font-bold text-text-primary mb-6">Histórico do Rastreio</h2>
          
          <TrackingTimeline 
            currentStage={data.current_stage} 
            events={data.events || []} 
          />
        </div>

        {/* Right Column: Info & QR Code */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-semibold text-text-primary mb-4">Informações</h3>
            
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-text-muted mb-1">Data de Criação</dt>
                <dd className="font-medium text-text-primary">
                  {new Date(data.created_at).toLocaleString('pt-BR')}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted mb-1">Última Atualização</dt>
                <dd className="font-medium text-text-primary">
                  {new Date(data.updated_at).toLocaleString('pt-BR')}
                </dd>
              </div>
              {data.completed_at && (
                <div>
                  <dt className="text-text-muted mb-1">Concluído em</dt>
                  <dd className="font-medium text-positive">
                    {new Date(data.completed_at).toLocaleString('pt-BR')}
                  </dd>
                </div>
              )}
              {data.batch_id && (
                <div className="pt-4 border-t border-border">
                  <dt className="text-text-muted mb-1">Lote Base Associado</dt>
                  <dd className="font-medium text-gold hover:underline cursor-pointer" onClick={() => navigate('/producao')}>
                    Ver em Produção &rarr;
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card text-center">
            <h3 className="font-semibold text-text-primary mb-4">QR Code Público</h3>
            <div className="bg-background rounded-xl p-4 border border-border inline-block mb-4 w-full">
              <img 
                src={trackingsApi.getQRCodeUrl(data.id)} 
                alt="QR Code" 
                className="w-full h-auto max-w-[200px] mx-auto rounded"
              />
            </div>
            <p className="text-xs text-text-muted">
              Qualquer pessoa com o link pode registrar a próxima etapa do processo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
