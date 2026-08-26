import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Coffee, Loader2 } from 'lucide-react';

export function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    
    const success = await login(name, password);
    setLoading(false);
    
    if (success) {
      navigate('/');
    } else {
      setError('Credenciais inválidas. Tente "joão" e "0000".');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mb-4 border border-gold/40">
            <Coffee size={32} className="text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary text-center">GoldBlack Coffee</h1>
          <p className="text-text-muted text-center mt-2">Faça login para acessar a plataforma</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-negative/10 border border-negative/20 text-negative-light text-sm rounded text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Nome de Usuário</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base"
              placeholder="Digite seu nome (ex: joão)"
              required
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold hover:bg-gold-light text-background font-semibold rounded-lg transition-colors shadow-gold disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
