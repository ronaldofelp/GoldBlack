import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center text-text-muted mb-6 shadow-sm">
        <AlertTriangle size={40} className="text-warning" />
      </div>
      <h1 className="text-3xl font-bold text-text-primary mb-2">Página não encontrada</h1>
      <p className="text-text-muted max-w-md mx-auto mb-8">
        A página que você está tentando acessar não existe ou ainda não foi implementada neste MVP.
      </p>
      <Link 
        to="/" 
        className="px-6 py-2.5 bg-gold hover:bg-gold-light text-background font-semibold rounded transition-colors shadow-gold"
      >
        Voltar para o Início
      </Link>
    </div>
  );
}
