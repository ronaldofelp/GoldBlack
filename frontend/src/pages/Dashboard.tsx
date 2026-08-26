import { Link } from 'react-router-dom';
import { Leaf, LayoutDashboard, Coffee } from 'lucide-react';

export function DashboardHome() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 text-center">
      <div className="flex items-center justify-center w-20 h-20 bg-gold/10 rounded-2xl border border-gold/30">
        <Coffee size={36} className="text-gold" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gold-shimmer">GoldBlack Coffee</h1>
        <p className="text-text-muted mt-2">Plataforma de Gestão e Rastreabilidade</p>
      </div>
      <div className="flex items-center gap-6 mt-4">
        <Link to="/lavouras" className="btn-primary">
          <Leaf size={16} /> Visão das Lavouras
        </Link>
        <Link to="/financeiro" className="btn-secondary">
          <LayoutDashboard size={16} /> Financeiro
        </Link>
      </div>
      <p className="text-text-muted text-xs mt-8">Selecione um módulo na barra lateral para começar</p>
    </div>
  );
}
