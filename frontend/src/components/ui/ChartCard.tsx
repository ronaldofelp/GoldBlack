import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  minHeight?: number;
}

export function ChartCard({ title, subtitle, action, children, className, minHeight = 300 }: ChartCardProps) {
  return (
    <div className={clsx('card p-5 flex flex-col gap-4', className)}>
      <div className="flex items-start justify-between gap-3 flex-shrink-0">
        <div>
          <h3 className="section-title">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className="flex-1" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recharts custom tooltip
// ─────────────────────────────────────────────────────────────────────────────
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; unit?: string }>;
  label?: string;
  formatter?: (value: number, name: string) => [string, string];
}

export function CustomTooltip({ active, payload, label, formatter }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-card-hover text-xs min-w-[140px]">
      {label && <p className="text-text-muted mb-2 font-medium">{label}</p>}
      {payload.map((entry, i) => {
        const [formattedValue, formattedName] = formatter
          ? formatter(entry.value, entry.name)
          : [entry.value.toLocaleString('pt-BR'), entry.name];
        return (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-text-muted">{formattedName}</span>
            </div>
            <span className="font-semibold text-text-primary">{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
}
