import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Perfil } from './pages/Perfil';
import { Layout } from './components/layout/Layout';
import { DashboardHome } from './pages/Dashboard';
import { Busca } from './pages/Busca';
import {
  Rastreio,
  NovoRastreio,
  DetalheRastreio,
  RastreioPublico
} from './pages/Rastreio';
import { VisaoGeral } from './pages/Lavouras/VisaoGeral';
import { FinanceiroDashboard } from './pages/Financeiro/Dashboard';
import { FluxoCaixa } from './pages/Financeiro/FluxoCaixa';
import { Custos } from './pages/Financeiro/Custos';
import { NotFound } from './pages/NotFound';
import { Propriedades } from './pages/Propriedades';
import { Talhoes } from './pages/Lavouras/Talhoes';
import { Atividades } from './pages/Lavouras/Atividades';
import { Estimativas } from './pages/Lavouras/Estimativas';
import { Solo } from './pages/Lavouras/Solo';
import { Producao } from './pages/Producao';
import { Vendas } from './pages/Vendas';
import { Estoque } from './pages/Estoque';
import { Compras } from './pages/Compras';

import { Monitoramento } from './pages/Lavouras/Monitoramento';
import { Relatorios } from './pages/Relatorios';
import { Configuracoes } from './pages/Configuracoes';
import { Usuarios } from './pages/Usuarios';
import {
  PainelCusto, Safras, ProducaoSacas, Maquinas, Trabalhadores, Servicos,
} from './pages/Custo';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/rastreio/atualizar/:code" element={<RastreioPublico />} />
          
          {/* Rotas protegidas */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/"               element={<DashboardHome />} />
            <Route path="/busca"          element={<Busca />} />
            <Route path="/perfil"         element={<Perfil />} />
            <Route path="/propriedades"   element={<Propriedades />} />
          
          <Route path="/lavouras"             element={<VisaoGeral />} />
          <Route path="/lavouras/talhoes"     element={<Talhoes />} />
          <Route path="/lavouras/atividades"  element={<Atividades pageTitle="Todas as Atividades" />} />
          <Route path="/lavouras/tratos"      element={<Atividades filterType="PRUNING" pageTitle="Tratos (Podas)" />} />
          <Route path="/lavouras/adubacoes"   element={<Atividades filterType="FERTILIZATION" pageTitle="Adubações" />} />
          <Route path="/lavouras/irrigacoes"  element={<Atividades filterType="IRRIGATION" pageTitle="Irrigações" />} />
          <Route path="/lavouras/monitoramento" element={<Monitoramento />} />
          <Route path="/lavouras/colheita"    element={<Atividades filterType="HARVEST" pageTitle="Colheita" />} />
          <Route path="/lavouras/estimativas" element={<Estimativas />} />
          <Route path="/lavouras/solo"        element={<Solo />} />

          <Route path="/producao"       element={<Producao />} />
          <Route path="/estoque"        element={<Estoque />} />
          <Route path="/compras"        element={<Compras />} />
          
          {/* Rastreio */}
          <Route path="/rastreio"       element={<Rastreio />} />
          <Route path="/rastreio/novo"  element={<NovoRastreio />} />
          <Route path="/rastreio/:id"   element={<DetalheRastreio />} />

          {/* Financeiro e Vendas */}
          <Route path="/vendas"         element={<Vendas />} />
          
          <Route path="/financeiro"       element={<FinanceiroDashboard />} />
          <Route path="/financeiro/caixa" element={<FluxoCaixa />} />
          <Route path="/financeiro/custos" element={<Custos />} />

          {/* Custo (talhão × safra) */}
          <Route path="/custo"               element={<PainelCusto />} />
          <Route path="/custo/safras"        element={<Safras />} />
          <Route path="/custo/producao"      element={<ProducaoSacas />} />
          <Route path="/custo/maquinas"      element={<Maquinas />} />
          <Route path="/custo/trabalhadores" element={<Trabalhadores />} />
          <Route path="/custo/servicos"      element={<Servicos />} />
          
          <Route path="/relatorios"     element={<Relatorios />} />
          <Route path="/configuracoes"  element={<Configuracoes />} />
          <Route path="/usuarios"       element={<Usuarios />} />

          <Route path="*"               element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
