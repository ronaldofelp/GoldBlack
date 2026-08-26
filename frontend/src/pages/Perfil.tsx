import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, ShieldCheck } from 'lucide-react';

export function Perfil() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Meu Perfil</h1>
          <p className="text-text-muted mt-1">Gerencie suas informações pessoais e credenciais</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-6 pb-6 border-b border-border">
            <div className="w-24 h-24 bg-gold/20 rounded-full flex items-center justify-center border border-gold/40">
              <User size={40} className="text-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{user.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-gold/10 text-gold-light border border-gold/20 rounded text-xs font-medium">
                  {user.role}
                </span>
                <span className="px-2 py-1 bg-positive/10 text-positive-light border border-positive/20 rounded text-xs font-medium flex items-center gap-1">
                  <ShieldCheck size={12} /> Conta Ativa
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                <User size={16} /> Nome Completo
              </label>
              <p className="text-text-primary font-medium">{user.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                <Mail size={16} /> E-mail
              </label>
              <p className="text-text-primary font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                <Shield size={16} /> Nível de Acesso
              </label>
              <p className="text-text-primary font-medium">Administrador do Sistema</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
