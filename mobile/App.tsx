/**
 * App.tsx — Componente raiz do app mobile (React Native + Expo)
 *
 * Configura:
 * - AuthProvider: Estado global de autenticação (AsyncStorage)
 * - NavigationContainer: Gerenciador de rotas (React Navigation)
 * - DarkTheme: Tema escuro personalizado (#121212 + #FF8C00)
 * - StatusBar: Barra de status estilo "light" (texto branco)
 */
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Estendendo o tema escuro do React Navigation para combinar com as cores do app
const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    primary: '#FF8C00',
  },
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={MyDarkTheme}>
        <AppNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </AuthProvider>
  );
}
