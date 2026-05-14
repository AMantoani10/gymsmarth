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
