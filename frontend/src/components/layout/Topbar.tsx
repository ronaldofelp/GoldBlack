import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Sun, User, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  apiOnline: boolean;
}

export function Topbar({ apiOnline }: TopbarProps) {
  const [showUser, setShowUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUser(false);
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
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-border transition-colors">
          <Bell size={18} className="text-text-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold pulse-dot" />
        </button>

        {/* Alternador de tema (reservado) */}
        <button className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-border transition-colors">
          <Sun size={18} className="text-text-muted" />
        </button>

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
