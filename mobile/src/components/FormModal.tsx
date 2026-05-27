import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';

const ORANGE = '#FF8C00';

interface Field {
  key: string;
  label: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
  value: string;
}

interface FormModalProps {
  visible: boolean;
  title: string;
  fields: Field[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChangeField: (key: string, value: string) => void;
  submitLabel?: string;
  /** Optional picker rendered below fields */
  extraContent?: React.ReactNode;
}

export default function FormModal({
  visible, title, fields, loading, onClose, onSubmit, onChangeField,
  submitLabel = 'SALVAR', extraContent,
}: FormModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {fields.map(f => (
              <View key={f.key} style={styles.fieldWrap}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={[styles.input, f.multiline && { height: 80, textAlignVertical: 'top' }]}
                  placeholder={f.placeholder || f.label}
                  placeholderTextColor="#555"
                  value={f.value}
                  onChangeText={v => onChangeField(f.key, v)}
                  keyboardType={f.keyboardType || 'default'}
                  secureTextEntry={f.secureTextEntry}
                  multiline={f.multiline}
                  autoCapitalize={f.keyboardType === 'email-address' ? 'none' : 'sentences'}
                />
              </View>
            ))}
            {extraContent}
            <View style={{ height: 20 }} />
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitText}>{submitLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  title: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#999', fontSize: 16, fontWeight: '700' },
  body: { padding: 20 },
  fieldWrap: { marginBottom: 14 },
  label: { color: '#AAA', fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#222', color: '#FFF', padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: '#333' },
  submitBtn: { backgroundColor: ORANGE, margin: 20, padding: 16, borderRadius: 14, alignItems: 'center' },
  submitText: { color: '#000', fontSize: 16, fontWeight: '900' },
});
