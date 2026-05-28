import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_TOKEN = 'gymsmarth_token';
const STORAGE_KEY_USER = 'gymsmarth_user';

/**
 * URL base da API lida das variáveis de ambiente (.env).
 * Se a variável não estiver definida, usa um fallback inteligente.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || Platform.select({
  android: 'http://10.0.2.2:3000', // Emulador Android
  ios: 'http://localhost:3000',    // Emulador iOS
  default: 'http://localhost:3000',
});

export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'ALUNO';
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega sessão persistida ao iniciar o app
  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Erro ao carregar dados do storage:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, []);

  const signIn = useCallback(async (email: string, senha: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas');
      }

      setToken(data.token);
      setUser(data.user);

      await AsyncStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout: servidor não respondeu. Verifique se o servidor está rodando.');
      }
      if (error.message?.includes('Network request failed')) {
        throw new Error(`Sem conexão com o servidor (${API_BASE_URL}). Verifique se o servidor está rodando e se o IP está correto.`);
      }
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context || !Object.keys(context).length) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
