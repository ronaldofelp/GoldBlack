import { AlertTriangle, CloudRain, Cpu, CheckCircle2, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { AlertType } from '../../types';

interface AlertCardProps {
  id: string;
  type: AlertType;
  message: string;
  createdAt: string;
  isRead: boolean;
  onDismiss?: (id: string) => void;
}

const ALERT_CONFIG: Record<AlertType, { icon: React.ReactNode; color: string; label: string }> = {
  WEATHER:   { icon: <CloudRain size={15} />,      color: 'text-info bg-info/10 border-info/30',           label: 'Clima' },
  AGRONOMIC: { icon: <AlertTriangle size={15} />,  color: 'text-warning bg-warning/10 border-warning/30',  label: 'Agronômico' },
  SYSTEM:    { icon: <Cpu size={15} />,             color: 'text-text-muted bg-border border-border',       label: 'Sistema' },
};

export function AlertCard({ id, type, message, createdAt, isRead, onDismiss }: AlertCardProps) {
  const cfg = ALERT_CONFIG[type];
  const date = new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-3 rounded-lg border text-sm',
        cfg.color,
        !isRead && 'ring-1 ring-current ring-opacity-20',
      )}
    >
      <span className="flex-shrink-0 mt-0.5">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{cfg.label}</span>
          {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 flex-shrink-0" />}
          <span className="ml-auto text-xs opacity-60 flex-shrink-0">{date}</span>
        </div>
        <p className="text-xs leading-relaxed opacity-90">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

interface EmptyAlertsProps { message?: string }
export function EmptyAlerts({ message = 'Nenhum alerta ativo' }: EmptyAlertsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-text-muted">
      <CheckCircle2 size={28} className="text-positive-light opacity-60" />
      <p className="text-xs">{message}</p>
    </div>
  );
}
