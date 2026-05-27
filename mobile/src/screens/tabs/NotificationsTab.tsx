import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, StyleSheet } from 'react-native';
import { dismissNotification } from '../../services/api';

const O = '#FF8C00';

interface Props { 
  notifications: any[]; 
  token: string | null; 
  onRefresh: () => void;
  onOpenWorkout?: (type: 'edit' | 'create' | 'adapt', id?: string, alunoId?: string) => void;
}

export default function NotificationsTab({ notifications, token, onRefresh, onOpenWorkout }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const handleDismiss = async (id: string, type: string) => {
    const label = type === 'exam' ? 'Excluir alerta de exame?' : 'Marcar feedback como lido?';
    Alert.alert('Confirmar', label, [
      { text: 'Cancelar' },
      { text: 'Sim', onPress: async () => {
        try { setLoading(id); await dismissNotification(id, type, token); setSelectedExam(null); onRefresh(); }
        catch (e: any) { Alert.alert('Erro', e.message); }
        finally { setLoading(null); }
      }}
    ]);
  };

  return (
    <View style={s.section}>
      <Text style={s.title}>Notificações</Text>
      <Text style={s.sub}>{notifications.length} notificações</Text>
      {notifications.length === 0 ? <Text style={s.empty}>Nenhuma notificação.</Text> : notifications.map((ex: any) => {
        const isFeedback = ex.type === 'feedback';
        const alertColor = isFeedback ? '#3B82F6' : ex.analise_texto?.nivel_alerta === 'alto' ? '#EF4444' : ex.analise_texto?.nivel_alerta === 'medio' ? '#EAB308' : '#22C55E';
        const label = isFeedback ? (ex.feedback_texto ? 'Feedback' : 'Concluído') : ex.analise_texto?.nivel_alerta || '?';
        return (
          <TouchableOpacity key={ex.id} style={[s.card, { borderLeftColor: alertColor }]} onPress={() => setSelectedExam(ex)}>
            <View style={[s.dot, { backgroundColor: alertColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.notifTitle} numberOfLines={1}>
                {ex.aluno?.nome || 'Aluno'} <Text style={s.notifAction}>{isFeedback ? (ex.feedback_texto ? 'deixou um comentário' : 'concluiu treino') : 'adicionou exame'}</Text>
              </Text>
              {isFeedback && ex.feedback_texto ? <Text style={s.feedbackText} numberOfLines={2}>"{ex.feedback_texto}"</Text> : null}
              <Text style={s.meta}>{timeAgo(ex.created_at)} · {ex.aluno?.email}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[s.badge, { backgroundColor: alertColor + '20' }]}>
                <Text style={[s.badgeText, { color: alertColor }]}>{label.toUpperCase()}</Text>
              </View>
              <TouchableOpacity style={s.dismissBtn} onPress={() => handleDismiss(ex.id, ex.type)} disabled={loading === ex.id}>
                <Text style={s.dismissText}>{loading === ex.id ? '...' : '✕'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Details Modal */}
      <Modal visible={!!selectedExam} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedExam(null)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Detalhes do Alerta</Text>
            <TouchableOpacity onPress={() => setSelectedExam(null)}><Text style={s.modalCloseText}>FECHAR</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }}>
            {selectedExam && (
              <View style={s.detailsCard}>
                {selectedExam.type === 'feedback' ? (
                  <>
                    <View style={s.detailsHeader}>
                      <Text style={s.detailsName}>{selectedExam.aluno?.nome}</Text>
                      <Text style={s.detailsEmail}>{selectedExam.aluno?.email}</Text>
                      <View style={s.tagBlue}><Text style={s.tagBlueText}>{selectedExam.feedback_texto ? 'Feedback de Treino' : 'Treino Concluído'}</Text></View>
                    </View>
                    <View style={s.detailsBody}>
                      {selectedExam.feedback_texto ? (
                        <>
                          <Text style={s.sectionLabel}>Comentário / Relato</Text>
                          <Text style={s.boxText}>{selectedExam.feedback_texto}</Text>
                        </>
                      ) : (
                        <Text style={s.emptyText}>Nenhum comentário deixado.</Text>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={s.detailsHeader}>
                      <Text style={s.detailsName}>{selectedExam.aluno?.nome}</Text>
                      <Text style={s.detailsEmail}>{selectedExam.aluno?.email}</Text>
                      <View style={s.tagRed}><Text style={s.tagRedText}>Risco {selectedExam.analise_texto?.nivel_alerta || 'N/A'}</Text></View>
                    </View>
                    <View style={s.detailsBody}>
                      {selectedExam.analise_texto?.diagnosticos?.length > 0 && (
                        <View style={{marginBottom: 16}}>
                          <Text style={s.sectionLabel}>Diagnósticos</Text>
                          {selectedExam.analise_texto.diagnosticos.map((d: string, i: number) => (
                            <Text key={i} style={s.listItem}>• {d}</Text>
                          ))}
                        </View>
                      )}
                      {selectedExam.restricoes_geradas?.restricoes_movimento?.length > 0 && (
                        <View style={{marginBottom: 16}}>
                          <Text style={s.sectionLabelRed}>⚠ Restrições de Movimento</Text>
                          {selectedExam.restricoes_geradas.restricoes_movimento.map((r: string, i: number) => (
                            <View key={i} style={s.redBox}><Text style={s.redBoxText}>{r}</Text></View>
                          ))}
                        </View>
                      )}
                      {selectedExam.analise_texto?.sugestao && (
                        <View style={{marginBottom: 16}}>
                          <Text style={s.sectionLabel}>Sugestão de Adaptação</Text>
                          <Text style={s.boxText}>{selectedExam.analise_texto.sugestao}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
                
                <View style={s.detailsFooter}>
                  {selectedExam.type === 'feedback' && selectedExam.treino_id && (
                    <TouchableOpacity style={s.btnOpenWorkout} onPress={() => { setSelectedExam(null); onOpenWorkout?.('edit', selectedExam.treino_id); }}>
                      <Text style={s.btnOpenWorkoutText}>ABRIR TREINO</Text>
                    </TouchableOpacity>
                  )}
                  {selectedExam.type === 'exam' && selectedExam.aluno?.id && (
                    <TouchableOpacity style={s.btnOpenWorkoutGreen} onPress={() => { setSelectedExam(null); onOpenWorkout?.('adapt', undefined, selectedExam.aluno?.id); }}>
                      <Text style={s.btnOpenWorkoutGreenText}>ADAPTAR TREINO</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={s.btnDismissFull} onPress={() => handleDismiss(selectedExam.id, selectedExam.type)}>
                    <Text style={s.btnDismissFullText}>MARCAR COMO LIDO</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  section: { padding: 16 },
  title: { fontSize: 22, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  sub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  empty: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#333', borderLeftWidth: 3, marginBottom: 8, gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  notifTitle: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  notifAction: { color: '#888', fontWeight: '400' },
  feedbackText: { color: '#AAA', fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  meta: { color: '#555', fontSize: 10, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  dismissBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  dismissText: { color: '#999', fontSize: 12, fontWeight: '700' },
  
  modalContainer: { flex: 1, backgroundColor: '#121212', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  modalCloseText: { fontSize: 11, fontWeight: '800', color: '#666' },
  
  detailsCard: { backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  detailsHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: '#222' },
  detailsName: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  detailsEmail: { fontSize: 12, color: '#888', marginTop: 2 },
  tagBlue: { alignSelf: 'flex-start', backgroundColor: 'rgba(59,130,246,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 10 },
  tagBlueText: { color: '#3B82F6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  tagRed: { alignSelf: 'flex-start', backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 10 },
  tagRedText: { color: '#EF4444', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  
  detailsBody: { padding: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sectionLabelRed: { fontSize: 10, fontWeight: '800', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  boxText: { backgroundColor: '#222', padding: 16, borderRadius: 12, color: '#DDD', fontSize: 14, borderWidth: 1, borderColor: '#333' },
  emptyText: { color: '#555', fontStyle: 'italic', fontSize: 13 },
  listItem: { color: '#DDD', fontSize: 14, marginBottom: 4 },
  redBox: { backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginBottom: 6 },
  redBoxText: { color: '#FCA5A5', fontSize: 13 },
  
  detailsFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#333', gap: 10 },
  btnDismissFull: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDismissFullText: { color: '#EF4444', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  btnOpenWorkout: { backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnOpenWorkoutText: { color: '#3B82F6', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  btnOpenWorkoutGreen: { backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnOpenWorkoutGreenText: { color: '#22C55E', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});

