import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: number;       // % change
  icon?: ReactNode;
  accent?: boolean;     // golden border
  variant?: 'default' | 'positive' | 'negative' | 'gold';
}

export function KPICard({
  title, value, unit, subtitle, trend, icon, accent, variant = 'default',
}: KPICardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <div
      className={clsx(
        'card p-5 flex flex-col gap-3 relative overflow-hidden',
        accent && 'border-gold/40 shadow-gold',
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <p className="label">{title}</p>
        {icon && (
          <div
            className={clsx(
              'flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0',
              variant === 'gold'     && 'bg-gold/15 text-gold',
              variant === 'positive' && 'bg-positive/15 text-positive-light',
              variant === 'negative' && 'bg-negative/15 text-negative-light',
              variant === 'default'  && 'bg-border text-text-muted',
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className={clsx(
            'text-2xl font-bold leading-none',
            variant === 'gold'     && 'text-gold',
            variant === 'positive' && 'text-positive-light',
            variant === 'negative' && 'text-negative-light',
            variant === 'default'  && 'text-text-primary',
          )}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-text-muted font-medium">{unit}</span>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1 border-t border-border">
        {subtitle && <p className="text-xs text-text-muted truncate">{subtitle}</p>}
        {trend !== undefined && (
          <div
            className={clsx(
              'flex items-center gap-0.5 text-xs font-semibold flex-shrink-0',
              trendPositive && 'text-positive-light',
              trendNegative && 'text-negative-light',
              !trendPositive && !trendNegative && 'text-text-muted',
            )}
          >
            {trendPositive && <TrendingUp size={12} />}
            {trendNegative && <TrendingDown size={12} />}
            {!trendPositive && !trendNegative && <Minus size={12} />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Decorative gradient */}
      {accent && (
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gold/5 blur-xl pointer-events-none" />
      )}
    </div>
  );
}
