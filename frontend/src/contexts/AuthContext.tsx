import { createContext, useContext, useState, type ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (name: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializa o estado de forma SÍNCRONA a partir do localStorage.
  // Assim, num reload / acesso direto a uma rota protegida, o usuário já
  // existe na primeira renderização e o ProtectedRoute não redireciona pro /login.
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('@GoldBlack:user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const login = async (name: string, password: string): Promise<boolean> => {
    // Mock Auth: João / 0000
    if (name.toLowerCase() === 'joão' && password === '0000') {
      const mockUser: User = {
        id: 'user-joao-123',
        name: 'João da Silva',
        email: 'joao@goldblack.coffee',
        role: 'ADMIN',
      };
      setUser(mockUser);
      localStorage.setItem('@GoldBlack:user', JSON.stringify(mockUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('@GoldBlack:user');
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
