import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Tela de Login - Estilo Dark Mode
 */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }
    
    setLoading(true);
    try {
      await signIn(email, senha);
    } catch (error: any) {
      Alert.alert('Erro no Login', error.message || 'Não foi possível fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GYM SMARTH</Text>
      <Text style={styles.subtitle}>Sua força, inteligente.</Text>

      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="E-mail" 
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Senha" 
          placeholderTextColor="#666"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>ENTRAR</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotText}>Esqueci minha senha</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark Mode
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8C00', // Laranja Destaque
    letterSpacing: 2
  },
  subtitle: {
    color: '#888',
    marginBottom: 40,
    fontSize: 14
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16
  },
  button: {
    backgroundColor: '#FF8C00', // Laranja Neon/Vibrante
    width: '100%',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 18
  },
  forgotPassword: {
    marginTop: 20
  },
  forgotText: {
    color: '#888',
    fontSize: 14
  }
});
