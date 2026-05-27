import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiPost } from '../services/api';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<1 | 2>(1);

  // Passo 1
  const [email, setEmail] = useState('');

  // Passo 2
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Atenção', 'Preencha o seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost('/auth/forgot-password', { email });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar o código.');
      Alert.alert('Sucesso', 'Código enviado para o seu e-mail. Verifique a sua caixa de entrada.');
      setStep(2);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível enviar o código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword) {
      Alert.alert('Atenção', 'Preencha o código e a nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost('/auth/reset-password', {
        email,
        code,
        newPassword
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao redefinir a senha.');
      Alert.alert('Sucesso', data.message || 'Senha redefinida com sucesso.');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GYM SMARTH</Text>
      <Text style={styles.subtitle}>Recuperação de Senha</Text>

      {step === 1 ? (
        <View style={styles.inputContainer}>
          <Text style={styles.instructions}>
            Digite o e-mail cadastrado na sua conta. Nós enviaremos um código de 6 dígitos para você redefinir sua senha.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>ENVIAR CÓDIGO</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={styles.instructions}>
            Digite o código de 6 dígitos que você recebeu no e-mail <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{email}</Text> e a sua nova senha.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Código de 6 dígitos"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
          <TextInput
            style={styles.input}
            placeholder="Nova Senha"
            placeholderTextColor="#666"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>REDEFINIR SENHA</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(1)}
            disabled={loading}
          >
            <Text style={styles.backText}>Reenviar código</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.forgotText}>Voltar para o Login</Text>
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
    marginBottom: 20,
    fontSize: 16
  },
  instructions: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20
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
  backButton: {
    marginTop: 15,
    alignItems: 'center'
  },
  backText: {
    color: '#FF8C00',
    fontSize: 14,
    textDecorationLine: 'underline'
  },
  forgotPassword: {
    marginTop: 30
  },
  forgotText: {
    color: '#888',
    fontSize: 14
  }
});
