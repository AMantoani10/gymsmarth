import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiPost } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../contexts/AuthContext';

/**
 * Tela de Cadastro de Administrador - Estilo Dark Mode
 */
export default function RegisterAdminScreen() {
  const navigation = useNavigation<any>();
  const { signIn } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar conta de administrador.');
      }

      // Login automático após o cadastro
      await signIn(email, senha);
    } catch (error: any) {
      if (error.message?.includes('Network request failed')) {
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique a sua conexão.');
      } else {
        Alert.alert('Erro', error.message || 'Não foi possível criar a conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>GYM SMARTH</Text>
      <Text style={styles.subtitle}>Nova Conta de Administrador</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor="#666"
          autoCapitalize="words"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.input, { paddingRight: 60 }]}
            placeholder="Senha"
            placeholderTextColor="#666"
            secureTextEntry={!showSenha}
            value={senha}
            onChangeText={setSenha}
          />
          <TouchableOpacity
            style={styles.showPasswordBtn}
            onPress={() => setShowSenha(!showSenha)}
          >
            <Text style={styles.showPasswordText}>{showSenha ? 'OCULTAR' : 'VER'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Confirmar Senha"
          placeholderTextColor="#666"
          secureTextEntry={!showSenha}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>CRIAR CONTA</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.backText}>Voltar para o Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8C00',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#888',
    marginBottom: 40,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  passwordWrapper: {
    position: 'relative',
  },
  showPasswordBtn: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 10,
    justifyContent: 'center',
  },
  showPasswordText: {
    color: '#FF8C00',
    fontSize: 11,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FF8C00',
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
    fontSize: 18,
  },
  backButton: {
    marginTop: 24,
  },
  backText: {
    color: '#888',
    fontSize: 14,
  },
});
