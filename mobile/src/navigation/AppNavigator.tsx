import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import RegisterAdminScreen from '../screens/RegisterAdminScreen';
import StudentHomeScreen from '../screens/StudentHomeScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';

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
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="RegisterAdmin" component={RegisterAdminScreen} />
        </>
      ) : user.role === 'ADMIN' ? (
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      ) : (
        <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
      )}
    </Stack.Navigator>
  );
}
