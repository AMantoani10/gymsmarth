import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import StudentHomeScreen from '../screens/StudentHomeScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Usuário não logado
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === 'ADMIN' ? (
        // Se for admin, poderia ter uma stack própria, mas geralmente admin usa web.
        // Vamos usar a mesma tela de aluno como placeholder para o mobile por enquanto.
        <Stack.Screen name="AdminHome" component={StudentHomeScreen} />
      ) : (
        // Aluno logado
        <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
      )}
    </Stack.Navigator>
  );
}
