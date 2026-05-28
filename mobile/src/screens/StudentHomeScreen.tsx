import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, Alert, Modal, TextInput, RefreshControl
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import {
  fetchTrainingSessions, saveCarga, getHistoricoCarga, logSession, analyzeExam, updateProfile
} from '../services/api';

const { width } = Dimensions.get('window');
const ORANGE = '#FF8C00';

export default function StudentHomeScreen() {
  const { user, token, signOut } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [treinoAtivo, setTreinoAtivo] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [cargas, setCargas] = useState<Record<string, string>>({});
  
  // Modals
  const [historicoModal, setHistoricoModal] = useState<string | null>(null);
  const [historicoData, setHistoricoData] = useState<any[]>([]);
  
  const [examModal, setExamModal] = useState(false);
  const [examText, setExamText] = useState('');
  const [examFile, setExamFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [examFileData, setExamFileData] = useState<string | undefined>(undefined);
  
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  
  const [settingsModal, setSettingsModal] = useState(false);
  const [formData, setFormData] = useState({ nome: user?.nome || '', email: user?.email || '', senha: '' });
  
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchTrainingSessions(token);
      setTreinoAtivo(data);
    } catch (e: any) {
      if (e.message && e.message.includes('Matrícula inativa')) {
         setTreinoAtivo({ isPaywall: true });
      } else {
         setTreinoAtivo(null);
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleSaveCarga = async (exercicio: string, idx: number) => {
    const carga = cargas[`${idx}`];
    if (!carga) return;
    try {
      await saveCarga(exercicio, carga, token);
      Alert.alert('Sucesso', 'Carga salva!');
    } catch(e) { Alert.alert('Erro', 'Erro ao salvar carga'); }
  };

  const openHistorico = async (exercicio: string) => {
    setHistoricoModal(exercicio);
    setHistoricoData([]);
    try {
      const data = await getHistoricoCarga(exercicio, token);
      setHistoricoData(data);
    } catch(e) {}
  };

  const fileToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setExamFile(asset);
        try {
          const b64 = await fileToBase64(asset.uri);
          setExamFileData(b64);
        } catch(e) {
           console.log('Erro ao ler base64 do arquivo', e);
        }
      }
    } catch (err) {
      console.log('Error picking file', err);
    }
  };

  const renderExercises = () => {
    if (!selectedSession) return null;
    let exercises: any[] = [];
    const raw = selectedSession.lista_exercicios;
    if (Array.isArray(raw)) exercises = raw;
    else if (typeof raw === 'string') { try { exercises = JSON.parse(raw); } catch(e) { exercises = []; } }
    
    if (exercises.length === 0) return <Text style={{color:'#666'}}>Nenhum exercício cadastrado nesta sessão.</Text>;

    return exercises.map((ex: any, i: number) => {
      const isCompleted = completedExercises.includes(i);
      const exName = ex.nome || ex;
      return (
        <View key={i} style={[st.exCard, isCompleted && st.exCardCompleted]}>
          <TouchableOpacity 
            style={st.exHeaderRow}
            onPress={() => {
              if (isCompleted) setCompletedExercises(completedExercises.filter(id => id !== i));
              else setCompletedExercises([...completedExercises, i]);
            }}
          >
            <View style={[st.checkbox, isCompleted && st.checkboxChecked]}>
              {isCompleted && <Feather name="check" size={12} color="#000" />}
            </View>
            <View style={{flex: 1}}>
              <Text style={[st.exName, isCompleted && st.exNameCompleted]}>{exName}</Text>
              <View style={st.exDetailsRow}>
                {ex.series && ex.reps && <View style={st.badge}><Text style={st.badgeText}>{ex.series} x {ex.reps}</Text></View>}
                {ex.descanso && <Text style={st.descansoText}>⏱ Descanso: {ex.descanso}</Text>}
              </View>
            </View>
          </TouchableOpacity>
          
          <View style={st.exActionsRow}>
            <TextInput 
              style={st.cargaInput}
              placeholder="Carga (ex: 20kg)"
              placeholderTextColor="#666"
              value={cargas[`${i}`] || ''}
              onChangeText={t => setCargas({...cargas, [`${i}`]: t})}
            />
            <TouchableOpacity style={st.btnSmall} onPress={() => handleSaveCarga(exName, i)}>
              <Text style={st.btnSmallText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.btnSmallDark} onPress={() => openHistorico(exName)}>
              <Text style={st.btnSmallDarkText}>Histórico</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    });
  };

  const getExercisesCount = () => {
    if(!selectedSession) return 0;
    let exercises: any[] = [];
    const raw = selectedSession.lista_exercicios;
    if (Array.isArray(raw)) exercises = raw;
    else if (typeof raw === 'string') { try { exercises = JSON.parse(raw); } catch(e) { exercises = []; } }
    return exercises.length;
  };

  const totalExCount = selectedSession ? getExercisesCount() : 0;
  const canFinishSession = selectedSession && totalExCount > 0 && completedExercises.length === totalExCount;

  if (loading) {
    return (
      <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.headerWelcome}>BEM-VINDO DE VOLTA,</Text>
          <Text style={st.headerName}>{user?.nome?.split(' ')[0].toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={st.profileBtn} onPress={() => { setFormData({ nome: user?.nome || '', email: user?.email || '', senha: '' }); setSettingsModal(true); }}>
           <Feather name="user" size={18} color={ORANGE} />
        </TouchableOpacity>
      </View>

      {/* Top Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.topCardsScroll} contentContainerStyle={st.topCardsContent}>
        <View style={st.cardStatus}>
           <Feather name="zap" size={20} color={treinoAtivo?.isPaywall ? "#EF4444" : "#22C55E"} />
           <Text style={st.cardLabel}>Status Plano</Text>
           <Text style={treinoAtivo?.isPaywall ? st.cardValueRed : st.cardValueGreen}>
             {treinoAtivo?.isPaywall ? 'INATIVO' : 'ATIVO'}
           </Text>
        </View>
        <TouchableOpacity style={st.cardIA} onPress={() => setExamModal(true)}>
           <Feather name="cpu" size={20} color={ORANGE} />
           <Text style={st.cardLabel}>IA Médica</Text>
           <Text style={st.cardValueOrange}>Enviar Exame →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <ScrollView style={st.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}>
        {!selectedSession ? (
          <View style={st.section}>
             <View style={st.sectionHeader}>
               <Text style={st.sectionTitle}>MEUS TREINOS</Text>
               <View style={st.statusBadge}>
                 <Text style={st.statusBadgeText}>{treinoAtivo && !treinoAtivo.isPaywall ? (treinoAtivo.nome || 'Sessões') : 'Pausado'}</Text>
               </View>
             </View>

             {treinoAtivo?.isPaywall ? (
               <View style={st.emptyState}>
                 <Text style={st.emptyText}>Assinatura inativa ou expirada.</Text>
                 <Text style={st.emptySubText}>Procure a recepção para renovar o seu plano.</Text>
               </View>
             ) : treinoAtivo && treinoAtivo.sessoes?.length > 0 ? (
               <View style={st.sessoesList}>
                 {treinoAtivo.sessoes.map((s: any) => {
                   const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                   const dia = s.dia_preferencial != null ? weekDays[s.dia_preferencial] : '';
                   return (
                     <TouchableOpacity 
                       key={s.id} 
                       style={st.sessaoCard}
                       onPress={() => { setSelectedSession(s); setCompletedExercises([]); setCargas({}); }}
                     >
                       <View>
                         <Text style={st.sessaoTitle}>{s.nome || `Sessão ${s.ordem_sequencial}`}</Text>
                         {dia !== '' && <Text style={st.sessaoDia}>{dia}</Text>}
                       </View>
                       <View style={st.sessaoArrow}><Feather name="chevron-right" size={20} color={ORANGE} /></View>
                     </TouchableOpacity>
                   );
                 })}
               </View>
             ) : (
               <View style={st.emptyState}>
                 <Text style={st.emptyText}>Treino indisponível no momento.</Text>
                 <Text style={st.emptySubText}>Seu plano está ativo, mas o professor ainda não montou seu treino.</Text>
               </View>
             )}
          </View>
        ) : (
          <View style={st.section}>
             <TouchableOpacity style={st.backBtn} onPress={() => setSelectedSession(null)}>
               <Text style={st.backBtnText}>← VOLTAR AOS TREINOS</Text>
             </TouchableOpacity>

             <Text style={st.selectedSessionTitle}>{selectedSession.nome || `Sessão ${selectedSession.ordem_sequencial}`}</Text>

             <View style={st.exercisesContainer}>
               {renderExercises()}
               
               <TouchableOpacity 
                 style={[st.btnFinalizar, !canFinishSession && st.btnFinalizarDisabled]}
                 disabled={!canFinishSession}
                 onPress={() => setFeedbackModal(true)}
               >
                 <Text style={st.btnFinalizarText}>FINALIZAR SESSÃO</Text>
               </TouchableOpacity>
             </View>
          </View>
        )}

        <TouchableOpacity onPress={signOut} style={st.logoutBtn}>
          <Text style={st.logoutBtnText}>SAIR DA CONTA</Text>
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>

      {/* --- Modals --- */}
      
      {/* Historico Modal */}
      <Modal visible={!!historicoModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHistoricoModal(null)}>
        <View style={st.modalContainer}>
          <View style={st.modalHeader}>
            <Text style={st.modalTitle} numberOfLines={1}>{historicoModal}</Text>
            <TouchableOpacity onPress={() => setHistoricoModal(null)}><Text style={st.modalCloseText}>FECHAR</Text></TouchableOpacity>
          </View>
          <Text style={st.modalSub}>Histórico e Progressão de Carga</Text>
          
          <ScrollView style={{flex: 1}}>
            {historicoData.length === 0 ? (
               <Text style={{color: '#666', textAlign: 'center', marginTop: 40}}>Nenhum registro encontrado para este exercício.</Text>
            ) : (
               historicoData.map((h, idx) => (
                 <View key={idx} style={st.historicoItem}>
                   <View style={st.historicoItemLeft}>
                     <View style={st.historicoIcon}><Feather name="zap" size={12} color="#FF8C00" /></View>
                     <Text style={st.historicoCarga}>{h.carga}</Text>
                   </View>
                   <Text style={st.historicoData}>{new Date(h.created_at).toLocaleDateString('pt-BR')}</Text>
                 </View>
               ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Exam Modal */}
      <Modal visible={examModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setExamModal(false)}>
        <View style={st.modalContainer}>
          <View style={st.modalHeader}>
            <Text style={st.modalTitle}>ENVIAR EXAME</Text>
            <TouchableOpacity onPress={() => setExamModal(false)}><Text style={st.modalCloseText}>FECHAR</Text></TouchableOpacity>
          </View>
          <Text style={st.modalText}>Descreva suas restrições médicas, lesões ou anexe o laudo do seu exame. A nossa IA processará as informações e adaptará os exercícios automaticamente.</Text>

          <TextInput 
            style={st.textArea}
            multiline
            placeholder="Ex: Tenho condromalácia patelar grau 2..."
            placeholderTextColor="#666"
            value={examText}
            onChangeText={setExamText}
          />

          <Text style={st.inputLabel}>Anexar Laudo/Imagem (Opcional)</Text>
          <TouchableOpacity style={st.fileBtn} onPress={pickFile}>
            <Text style={st.fileBtnText}>{examFile ? examFile.name : 'Selecionar Arquivo...'}</Text>
          </TouchableOpacity>

          <View style={{flex:1}} />

          <TouchableOpacity 
            style={[st.btnPrimary, submitting && {opacity: 0.5}]}
            disabled={submitting}
            onPress={async () => {
              if(!examText.trim()) { Alert.alert('Aviso', 'Descreva seu exame.'); return; }
              setSubmitting(true);
              try {
                await analyzeExam(examText, examFileData, examFile?.mimeType, token);
                Alert.alert('Sucesso', 'Exame enviado e analisado!');
                setExamModal(false); setExamText(''); setExamFile(null); setExamFileData(undefined);
              } catch(e: any) { Alert.alert('Erro', e.message); }
              setSubmitting(false);
            }}
          >
            <Text style={st.btnPrimaryText}>{submitting ? 'ANALISANDO...' : 'ANALISAR RESTRIÇÕES'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal visible={feedbackModal} animationType="fade" transparent onRequestClose={() => setFeedbackModal(false)}>
        <View style={st.overlayContainer}>
          <View style={st.overlayContent}>
             <View style={st.checkCircle}><Feather name="check" size={30} color="#22C55E" /></View>
             <Text style={st.overlayTitle}>SESSÃO CONCLUÍDA</Text>
             <Text style={st.overlaySub}>Como foi o treino? Deixe um comentário para o professor (opcional).</Text>

             <TextInput 
               style={st.textAreaSmall}
               multiline
               placeholder="Ex: Muito bom..."
               placeholderTextColor="#666"
               value={feedbackText}
               onChangeText={setFeedbackText}
             />

             <View style={st.overlayActionsRow}>
               <TouchableOpacity style={st.btnCancel} onPress={() => setFeedbackModal(false)}>
                 <Text style={st.btnCancelText}>CANCELAR</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[st.btnSave, submitting && {opacity: 0.5}]}
                 disabled={submitting}
                 onPress={async () => {
                   setSubmitting(true);
                   try {
                     await logSession(selectedSession?.id, feedbackText, token);
                     Alert.alert('Sucesso', 'Treino registrado!');
                     setFeedbackModal(false);
                     setFeedbackText('');
                     setSelectedSession(null);
                     loadData();
                   } catch(e) { Alert.alert('Erro', 'Erro ao registrar'); }
                   setSubmitting(false);
                 }}
               >
                 <Text style={st.btnSaveText}>SALVAR</Text>
               </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={settingsModal} animationType="fade" transparent onRequestClose={() => setSettingsModal(false)}>
        <View style={st.overlayContainer}>
          <View style={st.overlayContent}>
             <View style={st.modalHeader}>
               <Text style={st.modalTitle}>CONFIGURAÇÕES</Text>
               <TouchableOpacity onPress={() => setSettingsModal(false)}><Text style={st.modalCloseText}>VOLTAR</Text></TouchableOpacity>
             </View>

             <Text style={st.inputLabel}>Seu Nome</Text>
             <TextInput style={st.input} value={formData.nome} onChangeText={t => setFormData({...formData, nome: t})} />

             <Text style={st.inputLabel}>E-mail</Text>
             <TextInput style={st.input} value={formData.email} onChangeText={t => setFormData({...formData, email: t})} keyboardType="email-address" autoCapitalize="none" />

             <Text style={st.inputLabel}>Nova Senha</Text>
             <TextInput style={st.input} placeholder="Digite para alterar" placeholderTextColor="#666" secureTextEntry value={formData.senha} onChangeText={t => setFormData({...formData, senha: t})} />

             <TouchableOpacity 
               style={[st.btnPrimary, {marginTop: 20}, submitting && {opacity: 0.5}]}
               disabled={submitting}
               onPress={async () => {
                 setSubmitting(true);
                 try {
                   const payload: any = {...formData};
                   if (!payload.senha) delete payload.senha;
                   await updateProfile(payload, token);
                   Alert.alert('Sucesso', 'Perfil atualizado! Faça login novamente para ver as alterações.');
                   setSettingsModal(false);
                   signOut();
                 } catch(e: any) { Alert.alert('Erro', e.message); }
                 setSubmitting(false);
               }}
             >
               <Text style={st.btnPrimaryText}>{submitting ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#121212', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerWelcome: { fontSize: 10, color: '#666', fontWeight: '900', letterSpacing: 2 },
  headerName: { fontSize: 24, fontWeight: '900', color: '#FFF', fontStyle: 'italic', marginTop: 2, maxWidth: 200 },
  profileBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A1A1A', borderWidth: 2, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  profileBtnIcon: { fontSize: 20 },
  topCardsScroll: { maxHeight: 100, marginTop: 10, flexGrow: 0 },
  topCardsContent: { paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  cardStatus: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#222', width: 140 },
  cardIA: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,140,0,0.3)', width: 140 },
  cardIcon: { fontSize: 18, marginBottom: 8 },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#666', marginBottom: 4 },
  cardValueGreen: { fontSize: 14, fontWeight: '900', color: '#22C55E' },
  cardValueRed: { fontSize: 14, fontWeight: '900', color: '#EF4444' },
  cardValueOrange: { fontSize: 12, fontWeight: '900', color: ORANGE },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  statusBadge: { backgroundColor: 'rgba(255,140,0,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { color: ORANGE, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  emptySubText: { color: '#555', fontSize: 12, marginTop: 4, textAlign: 'center' },
  sessoesList: { gap: 10 },
  sessaoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  sessaoTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  sessaoDia: { fontSize: 11, fontWeight: '800', color: ORANGE, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  sessaoArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginBottom: 12 },
  backBtnText: { color: ORANGE, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  selectedSessionTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', fontStyle: 'italic', marginBottom: 16 },
  exercisesContainer: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#333' },
  exCard: { backgroundColor: '#222', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 12, marginBottom: 12 },
  exCardCompleted: { backgroundColor: 'rgba(255,140,0,0.05)', borderColor: 'rgba(255,140,0,0.4)' },
  exHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#666', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { borderColor: ORANGE, backgroundColor: ORANGE },
  exName: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  exNameCompleted: { color: ORANGE, textDecorationLine: 'line-through', opacity: 0.8 },
  exDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  descansoText: { color: '#666', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  exActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' },
  cargaInput: { flex: 1, height: 36, backgroundColor: '#121212', borderWidth: 1, borderColor: '#444', borderRadius: 8, color: '#FFF', paddingHorizontal: 10, fontSize: 12 },
  btnSmall: { backgroundColor: 'rgba(255,140,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,140,0,0.3)', height: 36, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
  btnSmallText: { color: ORANGE, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  btnSmallDark: { backgroundColor: '#1A1A1A', height: 36, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
  btnSmallDarkText: { color: '#888', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  btnFinalizar: { borderWidth: 2, borderColor: ORANGE, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnFinalizarDisabled: { opacity: 0.3, borderColor: '#666' },
  btnFinalizarText: { color: ORANGE, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  logoutBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  logoutBtnText: { color: '#666', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  
  modalContainer: { flex: 1, backgroundColor: '#121212', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: ORANGE, fontStyle: 'italic', flex: 1 },
  modalCloseText: { fontSize: 11, fontWeight: '800', color: '#666' },
  modalSub: { fontSize: 11, color: '#666', backgroundColor: '#1A1A1A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 20, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  historicoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginBottom: 10 },
  historicoItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historicoIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,140,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  historicoCarga: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  historicoData: { fontSize: 11, fontWeight: '700', color: '#666' },
  
  modalText: { fontSize: 13, color: '#999', lineHeight: 20, marginBottom: 20 },
  textArea: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', borderRadius: 16, padding: 16, color: '#FFF', minHeight: 140, textAlignVertical: 'top', fontSize: 14, marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, paddingLeft: 4 },
  fileBtn: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 14 },
  fileBtnText: { color: '#999', fontSize: 13, fontWeight: 'bold' },
  btnPrimary: { backgroundColor: ORANGE, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  btnPrimaryText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  
  overlayContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  overlayContent: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#333', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400 },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  overlayTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', fontStyle: 'italic', textAlign: 'center', marginBottom: 8 },
  overlaySub: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
  textAreaSmall: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', borderRadius: 16, padding: 16, color: '#FFF', minHeight: 100, textAlignVertical: 'top', fontSize: 13, marginBottom: 20 },
  overlayActionsRow: { flexDirection: 'row', gap: 12 },
  btnCancel: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  btnCancelText: { color: '#666', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  btnSave: { flex: 1, backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnSaveText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  
  input: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 14, marginBottom: 16 },
});
