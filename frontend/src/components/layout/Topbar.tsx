import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, ChevronDown, CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { alertsApi } from '../../services/api';
import type { SystemAlert, AlertType } from '../../types';

interface TopbarProps {
  apiOnline: boolean;
}

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  WEATHER: 'Clima',
  AGRONOMIC: 'Agronômico',
  SYSTEM: 'Sistema',
};

export function Topbar({ apiOnline }: TopbarProps) {
  const [showUser, setShowUser] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.length;

  // Carrega os alertas não lidos para alimentar o sino (badge + dropdown).
  const loadAlerts = async () => {
    try {
      const res = await alertsApi.list(undefined, true);
      setAlerts(res.data);
    } catch {
      setAlerts([]);
    }
  };

  useEffect(() => {
    if (apiOnline) loadAlerts();
  }, [apiOnline]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUser(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setShowAlerts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (action: string) => {
    setShowUser(false);
    if (action === 'Sair') {
      logout();
      navigate('/login');
    } else if (action === 'Meu Perfil') {
      navigate('/perfil');
    } else if (action === 'Configurações') {
      navigate('/configuracoes');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(alerts.map((a) => alertsApi.markRead(a.id)));
    } finally {
      loadAlerts();
    }
  };

  const goToMonitoring = () => {
    setShowAlerts(false);
    navigate('/lavouras/monitoramento');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
      {/* Trilha de navegação / Busca */}
      <div className="flex-1 flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center">
          <Search size={15} className="absolute left-3 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar talhão, lote, atividade..."
            className="input-base pl-9 w-72"
          />
        </form>
      </div>

      {/* Área à direita */}
      <div className="flex items-center gap-3">

        {/* Selo da safra */}
        <div className="badge badge-gold">
          Safra 2025/2026
        </div>

        {/* Notificações */}
        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setShowAlerts((v) => !v)}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-border transition-colors"
            title="Alertas"
          >
            <Bell size={18} className="text-text-muted" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-gold text-background text-[10px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-card-hover z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">
                  Alertas {unreadCount > 0 && <span className="text-text-muted font-normal">({unreadCount} novos)</span>}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-gold transition-colors"
                    title="Marcar todos como lidos"
                  >
                    <CheckCheck size={14} /> Marcar lidos
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {unreadCount === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-muted">
                    Nenhum alerta novo.
                  </div>
                ) : (
                  alerts.slice(0, 6).map((a) => (
                    <button
                      key={a.id}
                      onClick={goToMonitoring}
                      className="w-full text-left px-4 py-3 border-b border-border/50 hover:bg-border transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-gold/15 text-gold text-[10px] font-medium uppercase">
                          {ALERT_TYPE_LABELS[a.alert_type] ?? a.alert_type}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {new Date(a.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs text-text-primary line-clamp-2">{a.message}</p>
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={goToMonitoring}
                className="w-full px-4 py-2.5 text-center text-xs font-medium text-gold hover:bg-border transition-colors border-t border-border"
              >
                Ver monitoramento
              </button>
            </div>
          )}
        </div>

        {/* Usuário */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUser((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-border transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gold/20 border border-gold/40">
              <User size={14} className="text-gold" />
            </div>
            <span className="text-sm font-medium text-text-primary hidden sm:inline">{user?.name || 'Usuário'}</span>
            <ChevronDown size={14} className="text-text-muted" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-card-hover z-50 py-1">
              {['Meu Perfil', 'Configurações', 'Sair'].map((item) => (
                <button
                  key={item}
                  onClick={() => handleMenuAction(item)}
                  className="w-full text-left px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-border transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
