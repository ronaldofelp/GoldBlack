import React, { useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Building2, Leaf, ChevronRight, ChevronDown, ChevronLeft,
  FlaskConical, ShoppingCart, Warehouse, DollarSign, BarChart3,
  Settings, TrendingUp, Activity, Tractor, Droplets, LineChart,
  Shovel, MapPin, TestTube, Sprout, Eye, PackageSearch, ScanLine,
  Calculator, CalendarRange, Wheat, Users, Handshake,
} from 'lucide-react';
import { clsx } from 'clsx';

// ─────────────────────────────────────────────────────────────────────────────
// Definição da árvore de navegação
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
  expanded?: boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Painel Geral',  icon: <LayoutDashboard size={18} />, path: '/' },
  { id: 'farms',     label: 'Propriedades',  icon: <Building2 size={18} />,       path: '/propriedades' },
  {
    id: 'lavouras', label: 'Lavouras', icon: <Leaf size={18} />, expanded: true,
    children: [
      { id: 'lav-overview',  label: 'Visão Geral',         icon: <Eye size={16} />,          path: '/lavouras' },
      { id: 'lav-plots',     label: 'Talhões',              icon: <MapPin size={16} />,        path: '/lavouras/talhoes' },
      { id: 'lav-activities',label: 'Atividades',           icon: <Activity size={16} />,      path: '/lavouras/atividades' },
      { id: 'lav-cultural',  label: 'Tratos Culturais',    icon: <Shovel size={16} />,        path: '/lavouras/tratos' },
      { id: 'lav-fertiliz',  label: 'Adubações',           icon: <FlaskConical size={16} />, path: '/lavouras/adubacoes' },
      { id: 'lav-irrig',     label: 'Irrigações',           icon: <Droplets size={16} />,      path: '/lavouras/irrigacoes' },
      { id: 'lav-monitor',   label: 'Monitoramento',       icon: <LineChart size={16} />,     path: '/lavouras/monitoramento' },
      { id: 'lav-harvest',   label: 'Colheita',            icon: <Tractor size={16} />,       path: '/lavouras/colheita' },
      { id: 'lav-estimate',  label: 'Estimativa de Safra', icon: <TrendingUp size={16} />,    path: '/lavouras/estimativas' },
      { id: 'lav-soil',      label: 'Análises de Solo',    icon: <TestTube size={16} />,      path: '/lavouras/solo' },
    ],
  },
  { id: 'producao',   label: 'Produção',     icon: <Sprout size={18} />,          path: '/producao' },
  {
    id: 'rastreio', label: 'Rastreio', icon: <ScanLine size={18} />, expanded: false,
    children: [
      { id: 'track-list', label: 'Rastreios', icon: <Eye size={16} />, path: '/rastreio' },
      { id: 'track-new',  label: 'Novo Rastreio', icon: <ScanLine size={16} />, path: '/rastreio/novo' },
    ]
  },
  { id: 'estoque',    label: 'Estoque',      icon: <Warehouse size={18} />,       path: '/estoque' },
  { id: 'compras',    label: 'Compras',      icon: <ShoppingCart size={18} />,    path: '/compras' },
  {
    id: 'financeiro', label: 'Financeiro', icon: <DollarSign size={18} />, expanded: false,
    children: [
      { id: 'fin-dashboard', label: 'Dashboard',   icon: <BarChart3 size={16} />,   path: '/financeiro' },
      { id: 'fin-cashflow',  label: 'Fluxo de Caixa', icon: <LineChart size={16} />, path: '/financeiro/caixa' },
      { id: 'fin-cost',      label: 'Despesas',    icon: <DollarSign size={16} />,  path: '/financeiro/custos' },
    ],
  },
  {
    id: 'custo', label: 'Custo', icon: <Calculator size={18} />, expanded: false,
    children: [
      { id: 'custo-painel',    label: 'Painel de Custo', icon: <Calculator size={16} />,   path: '/custo' },
      { id: 'custo-safras',    label: 'Safras',           icon: <CalendarRange size={16} />, path: '/custo/safras' },
      { id: 'custo-producao',  label: 'Produção (sacas)', icon: <Wheat size={16} />,         path: '/custo/producao' },
      { id: 'custo-maquinas',  label: 'Máquinas',         icon: <Tractor size={16} />,       path: '/custo/maquinas' },
      { id: 'custo-workers',   label: 'Trabalhadores',    icon: <Users size={16} />,         path: '/custo/trabalhadores' },
      { id: 'custo-servicos',  label: 'Serviços',         icon: <Handshake size={16} />,     path: '/custo/servicos' },
    ],
  },
  { id: 'vendas',     label: 'Vendas',       icon: <PackageSearch size={18} />,   path: '/vendas' },
  { id: 'relatorios', label: 'Relatórios',   icon: <BarChart3 size={18} />,       path: '/relatorios' },
  { id: 'usuarios',   label: 'Usuários',     icon: <Users size={18} />,           path: '/usuarios', adminOnly: true },
  { id: 'config',     label: 'Configurações',icon: <Settings size={18} />,        path: '/configuracoes' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    lavouras: true,
    financeiro: false,
  });

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isActive = (path?: string) => path === location.pathname;
  const isGroupActive = (item: NavItem) =>
    item.children?.some((c) => c.path === location.pathname) ?? false;

  return (
    <aside
      className={clsx(
        'sidebar-transition flex flex-col h-full bg-card border-r border-border flex-shrink-0 relative',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logomarca */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 bg-gold rounded-lg flex-shrink-0">
          <span className="text-background font-black text-sm">GB</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-gold font-bold text-sm leading-none">GoldBlack</p>
            <p className="text-text-muted text-xs leading-none mt-0.5">Gestão Cafeeira</p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const hasChildren = !!item.children?.length;
          const isOpen = expanded[item.id];
          const groupActive = isGroupActive(item);

          if (hasChildren) {
            return (
              <div key={item.id}>
                <button
                  onClick={() => !collapsed && toggle(item.id)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-sm font-medium',
                    'transition-colors duration-150',
                    groupActive
                      ? 'bg-gold/15 text-gold'
                      : 'text-text-muted hover:bg-border hover:text-text-primary',
                    collapsed && 'justify-center',
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </>
                  )}
                </button>

                {!collapsed && isOpen && (
                  <div className="ml-3 mt-0.5 border-l border-border pl-2 space-y-0.5">
                    {item.children!.map((child) => (
                      <NavLink
                        key={child.id}
                        to={child.path!}
                        className={clsx(
                          'flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium',
                          'transition-colors duration-150',
                          isActive(child.path)
                            ? 'bg-gold/20 text-gold font-semibold'
                            : 'text-text-muted hover:bg-border hover:text-text-primary',
                        )}
                      >
                        <span className="flex-shrink-0">{child.icon}</span>
                        <span className="truncate">{child.label}</span>
                        {isActive(child.path) && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path!}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-2 rounded text-sm font-medium',
                'transition-colors duration-150',
                isActive(item.path)
                  ? 'bg-gold/20 text-gold'
                  : 'text-text-muted hover:bg-border hover:text-text-primary',
                collapsed && 'justify-center',
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Botão de recolher */}
      <button
        onClick={onToggle}
        className={clsx(
          'absolute -right-3 top-[72px] z-10',
          'flex items-center justify-center w-6 h-6 rounded-full',
          'bg-card border border-border text-text-muted',
          'hover:border-gold hover:text-gold transition-colors duration-150',
        )}
        title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Versão */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-text-muted text-xs">v1.0.0 — MVP</p>
        </div>
      )}
    </aside>
  );
}
