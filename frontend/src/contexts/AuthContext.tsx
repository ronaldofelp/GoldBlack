import { createContext, useContext, useState, type ReactNode } from 'react';
import { authApi, TOKEN_KEY, USER_KEY } from '../services/api';
import type { AuthUser, UserRole } from '../types';

// Rótulos em pt-BR para os papéis (o valor cru fica em inglês no banco/token)
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
};

export type User = AuthUser;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializa o estado de forma SÍNCRONA a partir do localStorage.
  // Assim, num reload / acesso direto a uma rota protegida, o usuário já
  // existe na primeira renderização e o ProtectedRoute não redireciona pro /login.
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      const storedToken = localStorage.getItem(TOKEN_KEY);
      // Só considera autenticado se tiver token E usuário salvos.
      return storedUser && storedToken ? (JSON.parse(storedUser) as User) : null;
    } catch {
      return null;
    }
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data } = await authApi.login(email.trim(), password);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch {
      // Credenciais inválidas ou API indisponível
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
