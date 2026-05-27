import React, { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, StyleSheet } from 'react-native';
import ConfirmDialog from '../../components/ConfirmDialog';
import { deleteWorkout, createWorkout, updateWorkout } from '../../services/api';

const ORANGE = '#FF8C00';

interface Props { 
  workouts: any[]; 
  students: any[]; 
  token: string | null; 
  onRefresh: () => void;
  actionData?: {type: 'edit'|'create'|'adapt', id?: string, alunoId?: string} | null;
  onActionConsumed?: () => void;
}

export default function WorkoutsTab({ workouts, students, token, onRefresh, actionData, onActionConsumed }: Props) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  const handleDelete = async () => {
    if (!confirm) return;
    try { setLoading(true); await deleteWorkout(confirm, token); setConfirm(null); onRefresh(); Alert.alert('Sucesso', 'Treino excluído'); }
    catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  const openCreate = (alunoId: string = '') => {
    setFormData({
      id: null,
      nome: '',
      objetivo: '',
      aluno_id: alunoId,
      data_inicio: '',
      data_fim: '',
      sessoes: [{ nome: 'Treino A', ordem_sequencial: 1, dia_preferencial: '', exercicios: [{ nome: '', series: '', reps: '', descanso: '' }] }]
    });
    setModalVisible(true);
  };

  const openEdit = (t: any) => {
    setFormData({
      id: t.id,
      nome: t.nome || '',
      objetivo: t.objetivo || '',
      aluno_id: t.aluno_id || '',
      data_inicio: t.data_inicio ? t.data_inicio.slice(0, 10) : '',
      data_fim: t.data_fim ? t.data_fim.slice(0, 10) : '',
      sessoes: t.sessoes?.map((s: any) => ({
        ...s,
        dia_preferencial: s.dia_preferencial?.toString() || '',
        exercicios: (() => {
          const raw = s.lista_exercicios;
          if (Array.isArray(raw)) return raw;
          if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return []; } }
          return [];
        })()
      })) || []
    });
    setModalVisible(true);
  };

  useEffect(() => {
    if (actionData) {
      if (actionData.type === 'edit' && actionData.id) {
        const w = workouts.find((w: any) => w.id === actionData.id);
        if (w) openEdit(w);
        else Alert.alert('Aviso', 'Este treino não foi encontrado ou já foi excluído.');
      } else if (actionData.type === 'create') {
        openCreate(actionData.alunoId);
      } else if (actionData.type === 'adapt' && actionData.alunoId) {
        const existingWorkout = workouts.find((w: any) => w.aluno_id === actionData.alunoId);
        if (existingWorkout) {
          openEdit(existingWorkout);
        } else {
          openCreate(actionData.alunoId);
        }
      }
      onActionConsumed?.();
    }
  }, [actionData, workouts]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = { ...formData };
      
      // Formatar dados pro backend
      if (payload.data_inicio) payload.data_inicio = new Date(payload.data_inicio + 'T00:00:00Z').toISOString();
      else delete payload.data_inicio;
      
      if (payload.data_fim) payload.data_fim = new Date(payload.data_fim + 'T00:00:00Z').toISOString();
      else delete payload.data_fim;

      payload.sessoes = (payload.sessoes || []).map((s: any, idx: number) => ({
        id: s.id,
        nome: s.nome,
        ordem_sequencial: idx + 1,
        dia_preferencial: s.dia_preferencial && !isNaN(parseInt(s.dia_preferencial)) ? parseInt(s.dia_preferencial) : null,
        lista_exercicios: JSON.stringify(s.exercicios.filter((ex: any) => ex.nome.trim() !== ''))
      }));

      if (!payload.aluno_id) payload.aluno_id = null; // Backend aceita null se nao associado

      if (payload.id) {
        await updateWorkout(payload.id, payload, token);
        Alert.alert('Sucesso', 'Treino atualizado!');
      } else {
        await createWorkout(payload, token);
        Alert.alert('Sucesso', 'Treino criado!');
      }
      
      setModalVisible(false);
      onRefresh();
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Erro ao salvar treino');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.section}>
      <View style={s.headerRow}>
        <View>
          <Text style={s.title}>Treinos ({workouts.length})</Text>
          <Text style={s.sub}>Gerencie as sessões e exercícios</Text>
        </View>
        <TouchableOpacity style={s.btnNovo} onPress={() => openCreate('')}>
          <Text style={s.btnNovoText}>+ NOVO</Text>
        </TouchableOpacity>
      </View>
      
      {workouts.length === 0 ? <Text style={s.empty}>Nenhum treino criado.</Text> : workouts.map((t: any) => (
        <TouchableOpacity key={t.id} style={s.card} onPress={() => openEdit(t)}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{t.nome}</Text>
              <Text style={s.student}>Aluno: <Text style={{ color: '#FFF' }}>{t.aluno?.nome || 'Nenhum'}</Text></Text>
            </View>
            {t.objetivo && <View style={s.objBadge}><Text style={s.objText}>{t.objetivo}</Text></View>}
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); setConfirm(t.id); }} style={s.actBtn}>
              <Feather name="trash-2" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {t.sessoes?.map((se: any) => {
              const dayLabel = se.dia_preferencial != null && se.dia_preferencial >= 0 && se.dia_preferencial <= 6 ? ` - ${days[se.dia_preferencial]}` : '';
              return (
                <View key={se.id} style={s.chip}>
                  <Text style={s.chipText}>{se.nome || `Sessão ${se.ordem_sequencial}`}{dayLabel}</Text>
                </View>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      ))}
      <ConfirmDialog visible={!!confirm} title="Excluir Treino" message="Tem certeza que deseja excluir este treino?"
        loading={loading} onCancel={() => setConfirm(null)} onConfirm={handleDelete} />

      {/* Modal de Criação / Edição */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={sm.container}>
          <View style={sm.header}>
            <Text style={sm.title}>{formData?.id ? 'EDITAR TREINO' : 'NOVO TREINO'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={sm.closeText}>CANCELAR</Text></TouchableOpacity>
          </View>

          {formData && (
            <ScrollView style={sm.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
              
              {/* Infos Básicas */}
              <View style={sm.block}>
                <Text style={sm.label}>Nome do Treino</Text>
                <TextInput style={sm.input} value={formData.nome} onChangeText={t => setFormData({...formData, nome: t})} placeholder="Ex: Treino Hipertrofia A/B/C" placeholderTextColor="#666" />
                
                <Text style={sm.label}>Objetivo</Text>
                <TextInput style={sm.input} value={formData.objetivo} onChangeText={t => setFormData({...formData, objetivo: t})} placeholder="Ex: Ganho de Massa" placeholderTextColor="#666" />
                
                <Text style={sm.label}>Vincular Aluno (Opcional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <TouchableOpacity 
                    style={[sm.chipSel, formData.aluno_id === '' && sm.chipSelActive]}
                    onPress={() => setFormData({...formData, aluno_id: ''})}
                  >
                    <Text style={[sm.chipSelText, formData.aluno_id === '' && sm.chipSelTextActive]}>Nenhum</Text>
                  </TouchableOpacity>
                  {students.map((st: any) => (
                    <TouchableOpacity 
                      key={st.id}
                      style={[sm.chipSel, formData.aluno_id === st.id && sm.chipSelActive]}
                      onPress={() => setFormData({...formData, aluno_id: st.id})}
                    >
                      <Text style={[sm.chipSelText, formData.aluno_id === st.id && sm.chipSelTextActive]}>{st.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={sm.label}>Data Início (AAAA-MM-DD)</Text>
                    <TextInput style={sm.input} value={formData.data_inicio} onChangeText={t => setFormData({...formData, data_inicio: t})} placeholder="YYYY-MM-DD" placeholderTextColor="#666" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sm.label}>Data Fim (AAAA-MM-DD)</Text>
                    <TextInput style={sm.input} value={formData.data_fim} onChangeText={t => setFormData({...formData, data_fim: t})} placeholder="YYYY-MM-DD" placeholderTextColor="#666" />
                  </View>
                </View>
              </View>

              {/* Sessões */}
              <View style={sm.sessionsHeader}>
                <Text style={sm.sessionsTitle}>SESSÕES ({formData.sessoes.length})</Text>
                <TouchableOpacity 
                  style={sm.btnAddSessao} 
                  onPress={() => setFormData({...formData, sessoes: [...formData.sessoes, { nome: `Sessão ${formData.sessoes.length + 1}`, ordem_sequencial: formData.sessoes.length + 1, dia_preferencial: '', exercicios: [] }]})}
                >
                  <Text style={sm.btnAddSessaoText}>+ SESSÃO</Text>
                </TouchableOpacity>
              </View>

              {formData.sessoes.map((sessao: any, sIdx: number) => (
                <View key={sIdx} style={sm.sessaoCard}>
                  <View style={sm.sessaoCardHeader}>
                    <Text style={sm.sessaoCardTitle}>Sessão {sIdx + 1}</Text>
                    <TouchableOpacity onPress={() => {
                      const ns = [...formData.sessoes];
                      ns.splice(sIdx, 1);
                      setFormData({...formData, sessoes: ns});
                    }}>
                      <Text style={{color: '#EF4444', fontSize: 12, fontWeight: 'bold'}}>REMOVER</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={sm.label}>Nome (Ex: Treino A - Peito)</Text>
                      <TextInput 
                        style={sm.inputSmall} 
                        value={sessao.nome} 
                        onChangeText={t => { const ns=[...formData.sessoes]; ns[sIdx].nome=t; setFormData({...formData, sessoes: ns}); }} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sm.label}>Dia (0-6)</Text>
                      <TextInput 
                        style={sm.inputSmall} 
                        value={sessao.dia_preferencial} 
                        onChangeText={t => { const ns=[...formData.sessoes]; ns[sIdx].dia_preferencial=t; setFormData({...formData, sessoes: ns}); }} 
                        placeholder="Dom=0" placeholderTextColor="#666" keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={sm.exListHeader}>
                    <Text style={sm.label}>Exercícios ({sessao.exercicios.length})</Text>
                    <TouchableOpacity onPress={() => {
                      const ns=[...formData.sessoes];
                      ns[sIdx].exercicios.push({ nome: '', series: '', reps: '', descanso: '' });
                      setFormData({...formData, sessoes: ns});
                    }}>
                      <Text style={{color: ORANGE, fontSize: 10, fontWeight: '900'}}>+ EXERCÍCIO</Text>
                    </TouchableOpacity>
                  </View>

                  {sessao.exercicios.map((ex: any, eIdx: number) => (
                    <View key={eIdx} style={sm.exRow}>
                      <TextInput 
                        style={[sm.inputSmall, { flex: 3 }]} 
                        placeholder="Exercício" placeholderTextColor="#666"
                        value={ex.nome}
                        onChangeText={t => { const ns=[...formData.sessoes]; ns[sIdx].exercicios[eIdx].nome=t; setFormData({...formData, sessoes: ns}); }}
                      />
                      <TextInput 
                        style={[sm.inputSmall, { flex: 1 }]} 
                        placeholder="Séries" placeholderTextColor="#666"
                        value={ex.series}
                        onChangeText={t => { const ns=[...formData.sessoes]; ns[sIdx].exercicios[eIdx].series=t; setFormData({...formData, sessoes: ns}); }}
                      />
                      <TextInput 
                        style={[sm.inputSmall, { flex: 1 }]} 
                        placeholder="Reps" placeholderTextColor="#666"
                        value={ex.reps}
                        onChangeText={t => { const ns=[...formData.sessoes]; ns[sIdx].exercicios[eIdx].reps=t; setFormData({...formData, sessoes: ns}); }}
                      />
                      <TextInput 
                        style={[sm.inputSmall, { flex: 1.5 }]} 
                        placeholder="Descanso" placeholderTextColor="#666"
                        value={ex.descanso}
                        onChangeText={t => { const ns=[...formData.sessoes]; ns[sIdx].exercicios[eIdx].descanso=t; setFormData({...formData, sessoes: ns}); }}
                      />
                      <TouchableOpacity onPress={() => {
                        const ns=[...formData.sessoes];
                        ns[sIdx].exercicios.splice(eIdx, 1);
                        setFormData({...formData, sessoes: ns});
                      }} style={{justifyContent: 'center', padding: 5}}>
                        <Feather name="x" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}

              <TouchableOpacity style={[sm.btnSave, loading && {opacity: 0.5}]} disabled={loading} onPress={handleSave}>
                <Text style={sm.btnSaveText}>{loading ? 'SALVANDO...' : 'SALVAR TREINO'}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  section: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  sub: { fontSize: 12, color: '#666', marginTop: 4 },
  btnNovo: { backgroundColor: ORANGE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnNovoText: { color: '#000', fontWeight: '900', fontSize: 11 },
  empty: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  card: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', borderRadius: 16, padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  student: { color: '#888', fontSize: 13, marginTop: 4 },
  objBadge: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  objText: { color: '#AAA', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  actBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' },
  chip: { backgroundColor: '#222', borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 },
  chipText: { color: '#999', fontSize: 11, fontWeight: '700' },
});

const sm = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 20 },
  title: { fontSize: 20, fontWeight: '900', color: ORANGE, fontStyle: 'italic' },
  closeText: { fontSize: 11, fontWeight: '800', color: '#666' },
  scroll: { flex: 1 },
  block: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', color: '#666', textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: '#222', borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 12, color: '#FFF', fontSize: 14, marginBottom: 16 },
  inputSmall: { backgroundColor: '#222', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 8, color: '#FFF', fontSize: 12, marginBottom: 8 },
  chipSel: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#222', marginRight: 8, borderWidth: 1, borderColor: '#333' },
  chipSelActive: { backgroundColor: 'rgba(255,140,0,0.15)', borderColor: ORANGE },
  chipSelText: { fontSize: 12, fontWeight: '700', color: '#888' },
  chipSelTextActive: { color: ORANGE },
  sessionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sessionsTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  btnAddSessao: { backgroundColor: 'rgba(255,140,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,140,0,0.3)' },
  btnAddSessaoText: { color: ORANGE, fontSize: 10, fontWeight: '900' },
  sessaoCard: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 16 },
  sessaoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sessaoCardTitle: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  exListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 6 },
  exRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  btnSave: { backgroundColor: ORANGE, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnSaveText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});
