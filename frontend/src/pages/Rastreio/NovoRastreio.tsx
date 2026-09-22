import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, QrCode, Download, CheckCircle2 } from 'lucide-react';
import { trackingsApi, batchesApi } from '../../services/api';
import type { CoffeeTracking, TraceabilityBatch } from '../../types';
import { clsx } from 'clsx';

export function NovoRastreio() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<TraceabilityBatch[]>([]);
  const [formData, setFormData] = useState({ batch_id: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [createdTracking, setCreatedTracking] = useState<CoffeeTracking | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await batchesApi.list();
        setBatches(res.data);
      } catch (err) {
        console.error("Erro ao carregar lotes:", err);
      }
    };
    loadBatches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await trackingsApi.create(formData);
      setCreatedTracking(res.data);
      setQrCodeUrl(trackingsApi.getQRCodeUrl(res.data.id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar rastreio');
    } finally {
      setLoading(false);
    }
  };

  const downloadPNG = () => {
    if (!qrCodeUrl || !createdTracking) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `qrcode-${createdTracking.tracking_code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadPDF = async () => {
    if (!qrCodeUrl || !createdTracking) return;
    
    try {
      // Fetch the image as blob to convert to base64 for jsPDF
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        doc.setFontSize(22);
        doc.text('GoldBlack Coffee Tracking', 105, 30, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text(`Rastreio: ${createdTracking.tracking_code}`, 105, 45, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(createdTracking.description, 105, 55, { align: 'center' });
        
        // Add QR Code
        doc.addImage(base64data, 'PNG', 55, 70, 100, 100);
        
        doc.setFontSize(10);
        doc.text('Escaneie este QR Code para atualizar as etapas do processo.', 105, 185, { align: 'center' });
        
        doc.save(`qrcode-${createdTracking.tracking_code}.pdf`);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/rastreio')}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:text-gold hover:border-gold transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Novo Rastreio</h1>
          <p className="text-text-muted text-sm mt-1">Crie um novo rastreio e gere o QR Code</p>
        </div>
      </div>

      {!createdTracking ? (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-card">
          {error && (
            <div className="mb-6 p-4 rounded bg-negative/10 border border-negative/20 text-negative text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Descrição do Café / Lote <span className="text-negative">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Café Especial Bourbon Amarelo Secagem Suspensa..."
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-gold focus:ring-1 focus:ring-gold/50 min-h-[100px] resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Vincular a Lote de Rastreabilidade Base <span className="text-negative">*</span>
              </label>
              <select
                required
                value={formData.batch_id}
                onChange={(e) => setFormData(prev => ({ ...prev, batch_id: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text-primary focus:border-gold focus:ring-1 focus:ring-gold/50"
              >
                <option value="">Selecione um lote base...</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batch_code} — {b.coffee_type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-light text-background font-semibold rounded-lg transition-colors shadow-gold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <QrCode size={20} />
              <span>{loading ? 'Gerando...' : 'Gerar Rastreio e QR Code'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 shadow-card text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-positive/20 text-positive flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-text-primary mb-2">Rastreio Criado com Sucesso!</h2>
          <p className="text-text-muted mb-8">
            Código: <strong className="text-gold font-mono text-lg">{createdTracking.tracking_code}</strong>
          </p>

          <div className="bg-background rounded-xl p-6 border border-border inline-block mb-8">
            <img 
              src={qrCodeUrl} 
              alt="QR Code do Rastreio" 
              className="w-48 h-48 sm:w-64 sm:h-64 mx-auto rounded"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={downloadPNG}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border hover:border-gold hover:text-gold text-text-primary font-medium rounded-lg transition-colors"
            >
              <Download size={18} />
              <span>Baixar PNG</span>
            </button>
            <button
              onClick={downloadPDF}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gold hover:bg-gold-light text-background font-semibold rounded-lg transition-colors shadow-gold"
            >
              <Download size={18} />
              <span>Baixar PDF para Impressão</span>
            </button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border">
            <button
              onClick={() => navigate(`/rastreio/${createdTracking.id}`)}
              className="text-gold hover:underline font-medium"
            >
              Ver detalhes do rastreio &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
