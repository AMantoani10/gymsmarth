import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchStudents, fetchPlans, fetchWorkouts, fetchNotifications, fetchLogs,
} from '../services/api';
import StudentsTab from './tabs/StudentsTab';
import PlansTab from './tabs/PlansTab';
import WorkoutsTab from './tabs/WorkoutsTab';
import NotificationsTab from './tabs/NotificationsTab';

const { width } = Dimensions.get('window');
const ORANGE = '#FF8C00';

type TabKey = 'home' | 'students' | 'plans' | 'workouts' | 'notifications';

export default function AdminHomeScreen() {
  const { user, token, signOut } = useAuth();
  const [tab, setTab] = useState<TabKey>('home');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [logDays, setLogDays] = useState(7);
  const [actionData, setActionData] = useState<{type: 'edit'|'create'|'adapt', id?: string, alunoId?: string} | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [s, p, w, n, l] = await Promise.allSettled([
        fetchStudents(token), fetchPlans(token),
        fetchWorkouts(token), fetchNotifications(token),
        fetchLogs(logDays, token),
      ]);
      if (s.status === 'fulfilled') setStudents(s.value);
      if (p.status === 'fulfilled') setPlans(p.value);
      if (w.status === 'fulfilled') setWorkouts(w.value);
      if (n.status === 'fulfilled') setNotifications(n.value);
      if (l.status === 'fulfilled') setLogs(l.value);
    } catch (e) { console.error('fetchAll error:', e); }
    setLoading(false);
  }, [token, logDays]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const onRefresh = async () => { setRefreshing(true); await fetchAllData(); setRefreshing(false); };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  // Monthly growth
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const count = students.filter((s: any) => {
      const c = new Date(s.created_at);
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
    }).length;
    return { month: monthNames[d.getMonth()], count };
  });
  const maxCount = Math.max(...monthlyData.map(m => m.count), 1);
  const thisMonthNew = monthlyData[5]?.count || 0;

  if (loading) {
    return (
      <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={{ color: '#666', marginTop: 12, fontSize: 13 }}>Conectando ao servidor...</Text>
      </View>
    );
  }

  const tabs: { key: TabKey; icon: string; label: string }[] = [
    { key: 'home', icon: 'bar-chart-2', label: 'Home' },
    { key: 'students', icon: 'users', label: 'Alunos' },
    { key: 'plans', icon: 'credit-card', label: 'Planos' },
    { key: 'workouts', icon: 'activity', label: 'Treinos' },
    { key: 'notifications', icon: 'bell', label: 'Alertas' },
  ];

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.headerWelcome}>BEM-VINDO</Text>
          <Text style={st.headerName}>{user?.nome?.split(' ')[0].toUpperCase()}</Text>
          <View style={st.adminBadge}><Text style={st.adminBadgeText}>ADMIN</Text></View>
        </View>
        <TouchableOpacity onPress={signOut} style={st.logoutBtn}>
          <Text style={st.logoutText}>SAIR</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.tabBar} contentContainerStyle={st.tabBarContent}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[st.tabItem, tab === t.key && st.tabItemActive]}>
            <Feather name={t.icon as any} size={14} color={tab === t.key ? ORANGE : '#666'} />
            <Text style={[st.tabLabel, tab === t.key && st.tabLabelActive]}>{t.label}</Text>
            {t.key === 'notifications' && notifications.length > 0 && (
              <View style={st.badge}><Text style={st.badgeText}>{notifications.length > 9 ? '9+' : notifications.length}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={st.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}>
        
        {tab === 'home' && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>Visão Geral</Text>
            <Text style={st.sectionSub}>Acompanhe o desempenho da sua academia</Text>

            <View style={st.statsGrid}>
              <TouchableOpacity style={[st.statCard, { borderColor: '#333' }]} onPress={() => setTab('students')}>
                <View style={[st.statIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}><Feather name="users" size={18} color="#3B82F6" /></View>
                {thisMonthNew > 0 && <View style={st.statBadge}><Text style={st.statBadgeText}>+{thisMonthNew}</Text></View>}
                <Text style={st.statLabel}>Alunos Ativos</Text>
                <Text style={st.statValue}>{students.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.statCard, { borderColor: '#333' }]} onPress={() => setTab('plans')}>
                <View style={[st.statIcon, { backgroundColor: 'rgba(168,85,247,0.15)' }]}><Feather name="credit-card" size={18} color="#A855F7" /></View>
                <Text style={st.statLabel}>Planos</Text>
                <Text style={st.statValue}>{plans.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.statCard, { borderColor: '#333' }]} onPress={() => setTab('workouts')}>
                <View style={[st.statIcon, { backgroundColor: 'rgba(255,140,0,0.15)' }]}><Feather name="activity" size={18} color={ORANGE} /></View>
                <Text style={st.statLabel}>Treinos</Text>
                <Text style={st.statValue}>{workouts.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.statCard, { borderColor: 'rgba(239,68,68,0.3)' }]} onPress={() => setTab('notifications')}>
                <View style={[st.statIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}><Feather name="bell" size={18} color="#EF4444" /></View>
                <Text style={st.statLabel}>Notificações</Text>
                <Text style={[st.statValue, { color: '#EF4444' }]}>{notifications.length}</Text>
              </TouchableOpacity>
            </View>

            {/* Chart */}
            <View style={st.chartCard}>
              <Text style={st.chartTitle}>Crescimento de Alunos</Text>
              <Text style={st.chartSub}>Últimos 6 meses · Total: {students.length}</Text>
              <View style={st.chartBars}>
                {monthlyData.map((m, i) => {
                  const pct = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
                  const h = m.count > 0 ? Math.max(pct, 10) : 2;
                  const isCurrent = i === 5;
                  return (
                    <View key={i} style={st.chartBarCol}>
                      <Text style={st.chartBarCount}>{m.count > 0 ? m.count : ''}</Text>
                      <View style={st.chartBarBg}>
                        <View style={[st.chartBarFill, { height: `${h}%`, backgroundColor: isCurrent ? ORANGE : 'rgba(255,140,0,0.4)' }]} />
                      </View>
                      <Text style={[st.chartBarLabel, isCurrent && { color: ORANGE }]}>{m.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Logs */}
            <View style={st.chartCard}>
              <View style={st.logHeader}>
                <Text style={st.chartTitle}>Atividade Recente</Text>
                <View style={st.logFilter}>
                  {[7, 14, 30].map(d => (
                    <TouchableOpacity key={d} onPress={() => setLogDays(d)}
                      style={[st.logFilterBtn, logDays === d && st.logFilterBtnActive]}>
                      <Text style={[st.logFilterText, logDays === d && st.logFilterTextActive]}>{d}d</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {logs.length === 0 ? (
                <Text style={st.emptyText}>Nenhuma atividade nos últimos {logDays} dias</Text>
              ) : logs.slice(0, 15).map((log: any) => {
                const colors: Record<string, string> = { 'CRIAR': '#22C55E', 'EDITAR': '#3B82F6', 'EXCLUIR': '#EF4444' };
                return (
                  <View key={log.id} style={st.logItem}>
                    <View style={[st.logDot, { backgroundColor: colors[log.tipo] || '#6B7280' }]} />
                    <View style={st.logContent}>
                      <Text style={st.logDesc} numberOfLines={1}>{log.descricao}</Text>
                      <Text style={st.logMeta}>{log.admin?.nome || 'Admin'} · {timeAgo(log.created_at)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {tab === 'students' && <StudentsTab students={students} plans={plans} token={token} onRefresh={onRefresh} />}
        {tab === 'plans' && <PlansTab plans={plans} token={token} onRefresh={onRefresh} />}
        {tab === 'workouts' && <WorkoutsTab workouts={workouts} students={students} token={token} onRefresh={onRefresh} actionData={actionData} onActionConsumed={() => setActionData(null)} />}
        {tab === 'notifications' && <NotificationsTab notifications={notifications} token={token} onRefresh={onRefresh} onOpenWorkout={(type, id, alunoId) => { setTab('workouts'); setActionData({ type, id, alunoId }); }} />}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#121212', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerWelcome: { fontSize: 10, color: '#666', fontWeight: '900', letterSpacing: 2 },
  headerName: { fontSize: 24, fontWeight: '900', color: ORANGE, fontStyle: 'italic', marginTop: 2 },
  adminBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6, alignSelf: 'flex-start' },
  adminBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  logoutBtn: { backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  logoutText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
  tabBar: { maxHeight: 52, backgroundColor: '#121212' },
  tabBarContent: { paddingHorizontal: 14, gap: 6, alignItems: 'center', paddingVertical: 6 },
  tabItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#1A1A1A' },
  tabItemActive: { backgroundColor: 'rgba(255,140,0,0.12)' },
  tabIcon: { fontSize: 14 },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#666' },
  tabLabelActive: { color: ORANGE },
  badge: { backgroundColor: '#EF4444', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  sectionSub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  emptyText: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16, marginBottom: 16 },
  statCard: { width: (width - 42) / 2, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statBadgeText: { color: '#22C55E', fontSize: 10, fontWeight: '800' },
  statLabel: { color: '#999', fontSize: 12, fontWeight: '700', marginTop: 12 },
  statValue: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 2 },
  chartCard: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#333', marginBottom: 14 },
  chartTitle: { fontSize: 17, fontWeight: '900', color: '#FFF' },
  chartSub: { fontSize: 12, color: '#666', marginTop: 2, marginBottom: 16 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 6 },
  chartBarCol: { flex: 1, alignItems: 'center', height: '100%' },
  chartBarCount: { fontSize: 10, fontWeight: '900', color: '#666', height: 16, textAlign: 'center' },
  chartBarBg: { flex: 1, width: '100%', backgroundColor: '#222', borderTopLeftRadius: 6, borderTopRightRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBarFill: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  chartBarLabel: { fontSize: 10, fontWeight: '700', color: '#666', marginTop: 4 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  logFilter: { flexDirection: 'row', gap: 4 },
  logFilterBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#222' },
  logFilterBtnActive: { backgroundColor: 'rgba(255,140,0,0.15)' },
  logFilterText: { fontSize: 11, fontWeight: '700', color: '#666' },
  logFilterTextActive: { color: ORANGE },
  logItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  logDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  logContent: { flex: 1 },
  logDesc: { fontSize: 12, fontWeight: '700', color: '#DDD' },
  logMeta: { fontSize: 10, color: '#555', marginTop: 2 },
});
