import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import FormModal from '../../components/FormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SelectPicker from '../../components/SelectPicker';
import { createStudent, updateStudent, deleteStudent, renewStudent } from '../../services/api';

const O = '#FF8C00';

interface Props {
  students: any[];
  plans: any[];
  token: string | null;
  onRefresh: () => void;
}

export default function StudentsTab({ students, plans, token, onRefresh }: Props) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', plano_id: '' });

  const openCreate = () => { setEditing(null); setForm({ nome: '', email: '', senha: '', plano_id: '' }); setModal(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ nome: s.nome, email: s.email, senha: '', plano_id: '' }); setModal(true); };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editing) {
        const data: any = {};
        if (form.nome) data.nome = form.nome;
        if (form.email) data.email = form.email;
        if (form.senha) data.senha = form.senha;
        await updateStudent(editing.id, data, token);
        Alert.alert('Sucesso', 'Aluno atualizado!');
      } else {
        if (!form.nome || !form.email || !form.senha || !form.plano_id) {
          Alert.alert('Atenção', 'Preencha todos os campos'); setLoading(false); return;
        }
        await createStudent(form, token);
        Alert.alert('Sucesso', 'Aluno cadastrado!');
      }
      setModal(false); onRefresh();
    } catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try { setLoading(true); await deleteStudent(confirm, token); setConfirm(null); onRefresh(); Alert.alert('Sucesso', 'Aluno excluído'); }
    catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  const handleRenew = async (id: string, nome: string) => {
    Alert.alert('Renovar Plano', `Renovar plano de ${nome}?`, [
      { text: 'Cancelar' },
      { text: 'Renovar', onPress: async () => {
        try { await renewStudent(id, token); onRefresh(); Alert.alert('Sucesso', 'Plano renovado!'); }
        catch (e: any) { Alert.alert('Erro', e.message); }
      }}
    ]);
  };

  const planOptions = plans.map((p: any) => ({ id: p.id, label: `${p.nome} - R$${p.valor}` }));

  return (
    <View style={s.section}>
      <View style={s.row}>
        <Text style={s.title}>Alunos ({students.length})</Text>
        <TouchableOpacity style={s.addBtn} onPress={openCreate}><Text style={s.addText}>+ NOVO</Text></TouchableOpacity>
      </View>

      {students.length === 0 ? <Text style={s.empty}>Nenhum aluno cadastrado.</Text> : students.map((st: any) => (
        <View key={st.id} style={s.card}>
          <View style={s.avatar}><Text style={s.avatarT}>{st.nome?.charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{st.nome}</Text>
            <Text style={s.sub}>{st.email}</Text>
          </View>
          <View style={s.actions}>
            <TouchableOpacity onPress={() => handleRenew(st.id, st.nome)} style={s.actBtn}><Feather name="refresh-cw" size={16} color="#3B82F6" /></TouchableOpacity>
            <TouchableOpacity onPress={() => openEdit(st)} style={s.actBtn}><Feather name="edit-2" size={16} color="#3B82F6" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirm(st.id)} style={s.actBtn}><Feather name="trash-2" size={16} color="#EF4444" /></TouchableOpacity>
          </View>
        </View>
      ))}

      <FormModal
        visible={modal} title={editing ? 'Editar Aluno' : 'Novo Aluno'} loading={loading}
        onClose={() => setModal(false)} onSubmit={handleSubmit}
        fields={[
          { key: 'nome', label: 'Nome', value: form.nome, placeholder: 'Nome completo' },
          { key: 'email', label: 'E-mail', value: form.email, keyboardType: 'email-address', placeholder: 'email@exemplo.com' },
          { key: 'senha', label: editing ? 'Nova Senha (opcional)' : 'Senha', value: form.senha, secureTextEntry: true, placeholder: '••••••' },
        ]}
        onChangeField={(k, v) => setForm(prev => ({ ...prev, [k]: v }))}
        extraContent={!editing ? <SelectPicker label="Plano" options={planOptions} selectedId={form.plano_id} onSelect={id => setForm(p => ({ ...p, plano_id: id }))} /> : undefined}
      />

      <ConfirmDialog visible={!!confirm} title="Excluir Aluno" message="Tem certeza? Esta ação não pode ser desfeita."
        loading={loading} onCancel={() => setConfirm(null)} onConfirm={handleDelete} />
    </View>
  );
}

const s = StyleSheet.create({
  section: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  addBtn: { backgroundColor: 'rgba(255,140,0,0.15)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,140,0,0.3)' },
  addText: { color: O, fontSize: 12, fontWeight: '900' },
  empty: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#333', marginBottom: 8, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  avatarT: { color: O, fontSize: 16, fontWeight: '900' },
  name: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  sub: { color: '#666', fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 4 },
  actBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
});
