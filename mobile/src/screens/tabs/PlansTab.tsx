import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import FormModal from '../../components/FormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { createPlan, updatePlan, deletePlan } from '../../services/api';

const O = '#FF8C00';

interface Props { plans: any[]; token: string | null; onRefresh: () => void; }

export default function PlansTab({ plans, token, onRefresh }: Props) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: '', duracao_dias: '', valor: '', descricao: '' });

  const openCreate = () => { setEditing(null); setForm({ nome: '', duracao_dias: '', valor: '', descricao: '' }); setModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ nome: p.nome, duracao_dias: String(p.duracao_dias), valor: String(p.valor), descricao: p.descricao || '' }); setModal(true); };

  const handleSubmit = async () => {
    if (!form.nome || !form.duracao_dias || !form.valor) { Alert.alert('Atenção', 'Preencha nome, duração e valor'); return; }
    const body = { nome: form.nome, duracao_dias: parseInt(form.duracao_dias), valor: parseFloat(form.valor), descricao: form.descricao || null };
    try {
      setLoading(true);
      if (editing) { await updatePlan(editing.id, body, token); Alert.alert('Sucesso', 'Plano atualizado!'); }
      else { await createPlan(body, token); Alert.alert('Sucesso', 'Plano criado!'); }
      setModal(false); onRefresh();
    } catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try { setLoading(true); await deletePlan(confirm, token); setConfirm(null); onRefresh(); Alert.alert('Sucesso', 'Plano excluído'); }
    catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.section}>
      <View style={s.row}>
        <Text style={s.title}>Planos ({plans.length})</Text>
        <TouchableOpacity style={s.addBtn} onPress={openCreate}><Text style={s.addText}>+ NOVO</Text></TouchableOpacity>
      </View>
      {plans.length === 0 ? <Text style={s.empty}>Nenhum plano cadastrado.</Text> : plans.map((p: any) => (
        <View key={p.id} style={s.card}>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{p.nome}</Text>
            <Text style={s.sub}>{p.duracao_dias} dias · {p._count?.matriculas || 0} alunos</Text>
          </View>
          <Text style={s.price}>R$ {p.valor}</Text>
          <TouchableOpacity onPress={() => openEdit(p)} style={s.actBtn}><Feather name="edit-2" size={16} color="#3B82F6" /></TouchableOpacity>
          <TouchableOpacity onPress={() => setConfirm(p.id)} style={s.actBtn}><Feather name="trash-2" size={16} color="#EF4444" /></TouchableOpacity>
        </View>
      ))}
      <FormModal visible={modal} title={editing ? 'Editar Plano' : 'Novo Plano'} loading={loading}
        onClose={() => setModal(false)} onSubmit={handleSubmit}
        fields={[
          { key: 'nome', label: 'Nome', value: form.nome, placeholder: 'Ex: Mensal' },
          { key: 'duracao_dias', label: 'Duração (dias)', value: form.duracao_dias, keyboardType: 'numeric', placeholder: '30' },
          { key: 'valor', label: 'Valor (R$)', value: form.valor, keyboardType: 'decimal-pad', placeholder: '99.90' },
          { key: 'descricao', label: 'Descrição', value: form.descricao, multiline: true, placeholder: 'Opcional' },
        ]}
        onChangeField={(k, v) => setForm(prev => ({ ...prev, [k]: v }))}
      />
      <ConfirmDialog visible={!!confirm} title="Excluir Plano" message="Tem certeza? Planos com alunos ativos não podem ser excluídos."
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#333', marginBottom: 8, gap: 10 },
  name: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  sub: { color: '#666', fontSize: 11, marginTop: 2 },
  price: { color: O, fontSize: 16, fontWeight: '900' },
  actBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
});
