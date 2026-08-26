import { Droplets, CloudRain, Wind } from 'lucide-react';
import { clsx } from 'clsx';

interface WeatherWidgetProps {
  temperature: number;
  humidity: number;
  precipitation: number;
  description?: string;
  location?: string;
  date?: string;
}

export function WeatherWidget({
  temperature, humidity, precipitation, description = 'Parcialmente nublado',
  location = 'Fazenda Ouro Preto', date,
}: WeatherWidgetProps) {
  const today = date ?? new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  const getTemp = (t: number) => {
    if (t > 30) return 'text-negative-light';
    if (t > 25) return 'text-warning';
    return 'text-positive-light';
  };

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="label">Condição Atual</p>
          <p className="text-text-primary font-medium text-sm mt-0.5">{location}</p>
        </div>
        <p className="text-xs text-text-muted text-right capitalize">{today}</p>
      </div>

      {/* Main temp */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {/* Sun/cloud icon drawn with CSS */}
          <div className="w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center">
            <span className="text-2xl">☀️</span>
          </div>
        </div>
        <div>
          <p className={clsx('text-4xl font-black leading-none', getTemp(temperature))}>
            {temperature}°
          </p>
          <p className="text-text-muted text-sm mt-0.5">{description}</p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
        {[
          { icon: <Droplets size={14} />, label: 'Umidade', value: `${humidity}%`, color: 'text-info' },
          { icon: <CloudRain size={14} />, label: 'Precip.', value: `${precipitation} mm`, color: 'text-info' },
          { icon: <Wind size={14} />, label: 'Vento', value: '12 km/h', color: 'text-text-muted' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className={clsx('flex items-center gap-0.5', color)}>
              {icon}
            </span>
            <p className="text-text-primary font-semibold text-sm leading-none">{value}</p>
            <p className="text-text-muted text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Forecast mini */}
      <div className="flex gap-1 pt-2 border-t border-border">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((day, i) => (
          <div key={day} className={clsx(
            'flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded',
            i === 0 ? 'bg-gold/10' : 'hover:bg-border',
          )}>
            <span className="text-text-muted text-xs">{day}</span>
            <span className="text-sm">{['☀️','🌤️','🌦️','☀️','☁️'][i]}</span>
            <span className={clsx('text-xs font-semibold', i === 0 ? 'text-gold' : 'text-text-primary')}>
              {[temperature, temperature - 2, temperature - 1, temperature + 1, temperature - 3][i]}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
