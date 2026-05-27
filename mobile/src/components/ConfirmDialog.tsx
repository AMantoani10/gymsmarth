import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ visible, title, message, loading, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.box}>
          <Feather name="alert-triangle" size={36} color="#EF4444" style={{ marginBottom: 12 }} />
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={s.cancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.confirmBtn, loading && { opacity: 0.6 }]} onPress={onConfirm} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.confirmText}>CONFIRMAR</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  box: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  icon: { fontSize: 36, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '900', color: '#FFF', marginBottom: 8 },
  message: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#222', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  cancelText: { color: '#999', fontSize: 13, fontWeight: '800' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' },
  confirmText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
