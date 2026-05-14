import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, CreditCard, Dumbbell, ChevronRight, Plus, LogOut, Settings, Search, Trash2, BrainCircuit, X, Bell, Clock, Edit, UserPlus, UserMinus } from 'lucide-react';

interface Props {
  onLogout: () => void;
  user: any;
  token?: string;
}

export function AdminDashboard({ onLogout, user, token }: Props) {
  const [view, setView] = useState<'home' | 'students' | 'plans' | 'workouts' | 'exams'>('home');
  const [data, setData] = useState<any>({ students: [], plans: [], workouts: [], exercicios: [], exams: [] });

  const [createType, setCreateType] = useState<'' | 'plan' | 'student' | 'workout' | 'settings'>('');
  const [formData, setFormData] = useState<any>({});
  const [loadingAction, setLoadingAction] = useState(false);
  const [examSearch, setExamSearch] = useState('');
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [hasUnseenExams, setHasUnseenExams] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logDays, setLogDays] = useState(7);

  // Carrega todos os dados no mount para garantir disponibilidade nos formulários
  useEffect(() => {
    fetchStudents();
    fetchPlans();
    fetchWorkouts();
    fetchExercicios();
    fetchNotifications();
    fetchLogs();
  }, []);

  // Recarrega dados específicos ao mudar de aba
  useEffect(() => {
    if (view === 'students') fetchStudents();
    if (view === 'plans') fetchPlans();
    if (view === 'workouts') {
      fetchWorkouts();
      fetchExercicios();
    }
    if (view === 'exams') fetchNotifications();
  }, [view]);

  // Reload logs when filter changes
  useEffect(() => {
    fetchLogs();
  }, [logDays]);

  const fetchNotifications = async () => {
    const res = await fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if(res.ok) {
        const json = await res.json();
        setData((s: any) => ({...s, exams: json}));
        const lastSeen = localStorage.getItem('gymsmarth_notifications_last_seen');
        if (json.length > 0) {
          if (!lastSeen) {
            setHasUnseenExams(true);
            setUnseenCount(json.length);
          } else {
            const lastSeenDate = new Date(lastSeen);
            const unseen = json.filter((ex: any) => new Date(ex.created_at) > lastSeenDate);
            setHasUnseenExams(unseen.length > 0);
            setUnseenCount(unseen.length);
          }
        } else {
          setHasUnseenExams(false);
          setUnseenCount(0);
        }
    }
  };

  const markExamsAsSeen = () => {
    localStorage.setItem('gymsmarth_notifications_last_seen', new Date().toISOString());
    setHasUnseenExams(false);
    setUnseenCount(0);
  };

  const dismissNotification = async (id: string, type: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}/dismiss`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type })
      });
      if (!res.ok) throw new Error();
      fetchNotifications();
      fetchLogs();
      if (selectedExam && selectedExam.id === id) setSelectedExam(null);
    } catch { alert('Erro ao excluir notificação'); }
  };


  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/admin/logs?dias=${logDays}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if(res.ok) {
        const json = await res.json();
        setActivityLogs(json);
      }
    } catch(e) { /* silent */ }
  };

  const fetchExercicios = async () => {
    const res = await fetch('/api/admin/exercicios', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if(res.ok) {
        const json = await res.json();
        setData((s: any) => ({...s, exercicios: json}));
    }
  };

  const fetchStudents = async () => {
    const res = await fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if(res.ok) {
        const json = await res.json();
        setData((s: any) => ({...s, students: json}));
    }
  };

  const fetchPlans = async () => {
    const res = await fetch('/api/admin/plans', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if(res.ok) {
        const json = await res.json();
        setData(s => ({...s, plans: json}));
    }
  };

  const fetchWorkouts = async () => {
    const res = await fetch('/api/admin/treinos', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if(res.ok) {
        const json = await res.json();
        setData(s => ({...s, workouts: json}));
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-[#0D0D0D]">
      {/* Sidebar for Desktop / Top header for mobile */}
      <div className="md:w-64 bg-[#121212] p-6 border-r border-[#1E1E1E] flex flex-col md:h-full shrink-0 rounded-t-[3.5rem] md:rounded-tr-none md:rounded-bl-[3.5rem] md:rounded-tl-[3.5rem]">
        <div className="mb-10 pt-4">
          <h2 className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Bem-vindo</h2>
          <p className="text-2xl font-black italic text-[#FF8C00] truncate">{user.nome.split(' ')[0].toUpperCase()}</p>
          <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold mt-2 inline-block">ADMIN</span>
        </div>

        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
          <MenuBtn icon={Dumbbell} label="Dashboard" active={view === 'home'} onClick={() => setView('home')} />
          <MenuBtn icon={Users} label="Alunos" active={view === 'students'} onClick={() => setView('students')} />
          <MenuBtn icon={CreditCard} label="Planos" active={view === 'plans'} onClick={() => setView('plans')} />
          <MenuBtn icon={Dumbbell} label="Treinos" active={view === 'workouts'} onClick={() => setView('workouts')} />
          <MenuBtn icon={Bell} label="Notificações" active={view === 'exams'} onClick={() => { setView('exams'); setSelectedExam(null); markExamsAsSeen(); }} badge={unseenCount > 0 ? unseenCount : undefined} />
          <MenuBtn icon={Settings} label="Configurações" active={createType === 'settings'} onClick={() => { setFormData({ nome: user.nome, email: user.email }); setCreateType('settings'); }} />
        </div>

        <div className="mt-auto hidden md:block">
           <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold w-full p-2">
             <LogOut size={16} /> Sair da conta
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        <motion.div 
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1400px] w-full mx-auto space-y-6"
        >
          {view === 'home' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black italic">Visão Geral</h1>
                  <p className="text-gray-500 mt-1">Acompanhe o desempenho da sua academia</p>
                </div>
              </div>

              {/* Top Stats Cards */}
              {(() => {
                // Compute monthly growth data from real student created_at dates
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const now = new Date();
                const monthlyData: { month: string; count: number; cumulative: number }[] = [];
                const students = data.students || [];
                
                // Build 6-month window
                for (let i = 5; i >= 0; i--) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
                  const monthLabel = `${monthNames[d.getMonth()]}`;
                  const count = students.filter((s: any) => {
                    const created = new Date(s.created_at);
                    return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
                  }).length;
                  // Cumulative: all students created up to end of this month
                  const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
                  const cumulative = students.filter((s: any) => new Date(s.created_at) <= endOfMonth).length;
                  monthlyData.push({ month: monthLabel, count, cumulative });
                }
                
                const maxCount = Math.max(...monthlyData.map(m => m.count), 1);
                const totalStudents = students.length;
                
                // Growth: show new students this month as a simple intuitive counter
                const thisMonthNew = monthlyData[5]?.count || 0;

                return (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                       <div onClick={() => setView('students')} className="bg-[#1A1A1A] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[#333] hover:border-[#FF8C00] cursor-pointer transition-colors relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                         <div className="flex justify-between items-start relative z-10">
                           <div className="p-2 md:p-3 bg-[#222] rounded-xl"><Users size={20} className="text-blue-500" /></div>
                           {thisMonthNew > 0 && (
                             <span className="text-[10px] md:text-xs font-bold text-green-500 bg-green-500/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg">
                               +{thisMonthNew} este mês
                             </span>
                           )}
                         </div>
                         <div className="mt-3 md:mt-6">
                           <p className="text-gray-400 font-bold text-xs md:text-sm">Alunos Ativos</p>
                           <h2 className="text-2xl md:text-3xl font-black mt-1">{totalStudents}</h2>
                         </div>
                       </div>

                       <div onClick={() => setView('plans')} className="bg-[#1A1A1A] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[#333] hover:border-[#FF8C00] cursor-pointer transition-colors relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                         <div className="flex justify-between items-start relative z-10">
                           <div className="p-2 md:p-3 bg-[#222] rounded-xl"><CreditCard size={20} className="text-purple-500" /></div>
                         </div>
                         <div className="mt-3 md:mt-6">
                           <p className="text-gray-400 font-bold text-xs md:text-sm">Planos Cadastrados</p>
                           <h2 className="text-2xl md:text-3xl font-black mt-1">{data.plans?.length || 0}</h2>
                         </div>
                       </div>

                       <div onClick={() => setView('workouts')} className="bg-[#1A1A1A] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[#333] hover:border-[#FF8C00] cursor-pointer transition-colors relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-[#FF8C00]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                         <div className="flex justify-between items-start relative z-10">
                           <div className="p-2 md:p-3 bg-[#222] rounded-xl"><Dumbbell size={20} className="text-[#FF8C00]" /></div>
                         </div>
                         <div className="mt-3 md:mt-6">
                           <p className="text-gray-400 font-bold text-xs md:text-sm">Treinos Criados</p>
                           <h2 className="text-2xl md:text-3xl font-black mt-1">{data.workouts?.length || 0}</h2>
                         </div>
                       </div>

                       <div onClick={() => { setView('exams'); setSelectedExam(null); markExamsAsSeen(); }} className="bg-[#1A1A1A] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-red-500/30 hover:border-red-500/60 cursor-pointer transition-colors relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                         <div className="flex justify-between items-start relative z-10">
                           <div className="p-2 md:p-3 bg-red-500/10 rounded-xl relative">
                             <Bell size={20} className="text-red-500" />
                             {hasUnseenExams && (
                               <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 items-center justify-center text-[7px] font-black text-white">
                                   {unseenCount > 9 ? '9+' : unseenCount}
                                 </span>
                               </span>
                             )}
                           </div>
                         </div>
                         <div className="mt-3 md:mt-6">
                           <p className="text-gray-400 font-bold text-xs md:text-sm">Notificações</p>
                           <h2 className="text-2xl md:text-3xl font-black mt-1 text-red-500">{data.exams?.length || 0}</h2>
                         </div>
                       </div>
                    </div>

                    {/* Main Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#333] rounded-3xl p-4 md:p-8">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6 md:mb-8">
                          <div>
                            <h3 className="text-lg md:text-xl font-black">Crescimento de Alunos</h3>
                            <p className="text-xs md:text-sm text-gray-500">Novas matrículas nos últimos 6 meses</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-bold">Total: <span className="text-white">{totalStudents}</span></span>
                          </div>
                        </div>
                        
                        {/* Real Data Bar Chart */}
                        <div className="flex items-end gap-2 md:gap-4" style={{ height: '220px' }}>
                          {monthlyData.map((m, i) => {
                            const barPct = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
                            // Minimum visible bar height when count > 0
                            const displayPct = m.count > 0 ? Math.max(barPct, 8) : 0;
                            const isCurrentMonth = i === monthlyData.length - 1;
                            
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative cursor-pointer" style={{ height: '100%' }}>
                                {/* Count label on top */}
                                <div className="text-xs font-black text-gray-400 h-5 flex items-center">
                                  {m.count > 0 ? m.count : ''}
                                </div>
                                
                                {/* Bar container */}
                                <div className="w-full flex-1 bg-[#222] rounded-t-xl overflow-hidden relative">
                                  <div 
                                    className={`absolute bottom-0 w-full rounded-t-xl transition-all duration-1000 ease-out group-hover:brightness-125 ${
                                      isCurrentMonth 
                                        ? 'bg-gradient-to-t from-[#FF8C00] to-yellow-400' 
                                        : 'bg-gradient-to-t from-[#FF8C00]/70 to-[#FF8C00]/30'
                                    }`}
                                    style={{ height: `${displayPct}%` }}
                                  />
                                  {/* Empty state indicator */}
                                  {m.count === 0 && (
                                    <div className="absolute bottom-0 w-full h-1 bg-[#333] rounded-t-xl" />
                                  )}
                                </div>
                                
                                {/* Month label */}
                                <span className={`text-[10px] md:text-xs font-bold ${isCurrentMonth ? 'text-[#FF8C00]' : 'text-gray-500'}`}>
                                  {m.month}
                                </span>
                                
                                {/* Tooltip */}
                                <div className="absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-[#333] text-white text-[10px] md:text-xs py-1.5 px-3 rounded-lg font-bold pointer-events-none whitespace-nowrap z-10 shadow-xl">
                                  <span className="text-[#FF8C00]">{m.count}</span> {m.count === 1 ? 'novo aluno' : 'novos alunos'}
                                  <span className="text-gray-500 ml-1">· Total: {m.cumulative}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Empty state */}
                        {totalStudents === 0 && (
                          <div className="text-center py-4">
                            <p className="text-gray-600 text-sm">Nenhum aluno cadastrado ainda</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#1A1A1A] border border-[#333] rounded-3xl p-4 md:p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg md:text-xl font-black">Atividade Recente</h3>
                          <select 
                            value={logDays} 
                            onChange={e => setLogDays(parseInt(e.target.value))}
                            className="bg-[#222] border border-[#333] rounded-lg px-2 py-1 text-[10px] md:text-xs outline-none text-gray-300 cursor-pointer"
                          >
                            <option value={7}>7 dias</option>
                            <option value={14}>14 dias</option>
                            <option value={30}>30 dias</option>
                          </select>
                        </div>
                        <div className="space-y-1 flex-1 overflow-y-auto max-h-[280px] pr-1 scrollbar-hide">
                          {activityLogs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <Clock size={28} className="text-gray-700 mb-3" />
                              <p className="text-sm font-bold text-gray-500">Nenhuma atividade</p>
                              <p className="text-xs text-gray-600 mt-1">Ações dos últimos {logDays} dias aparecerão aqui</p>
                            </div>
                          )}
                          {activityLogs.map((log: any, idx: number) => {
                            // Icon and color based on action type
                            const iconMap: Record<string, { icon: any; color: string; bg: string }> = {
                              'CRIAR_ALUNO': { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500' },
                              'EDITAR_ALUNO': { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-500' },
                              'EXCLUIR_ALUNO': { icon: UserMinus, color: 'text-red-500', bg: 'bg-red-500' },
                              'CRIAR_TREINO': { icon: Dumbbell, color: 'text-[#FF8C00]', bg: 'bg-[#FF8C00]' },
                              'EDITAR_TREINO': { icon: Edit, color: 'text-[#FF8C00]', bg: 'bg-[#FF8C00]' },
                              'EXCLUIR_TREINO': { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500' },
                              'CRIAR_PLANO': { icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500' },
                              'EDITAR_PLANO': { icon: Edit, color: 'text-purple-500', bg: 'bg-purple-500' },
                              'EXCLUIR_PLANO': { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500' },
                              'EXCLUIR_EXAME': { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500' },
                            };
                            const key = `${log.tipo}_${log.entidade}`;
                            const style = iconMap[key] || { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500' };
                            const LogIcon = style.icon;
                            const isLast = idx === activityLogs.length - 1;

                            const timeAgo = (() => {
                              const diff = Date.now() - new Date(log.created_at).getTime();
                              const mins = Math.floor(diff / 60000);
                              if (mins < 1) return 'agora';
                              if (mins < 60) return `${mins}min`;
                              const hrs = Math.floor(mins / 60);
                              if (hrs < 24) return `${hrs}h`;
                              const days = Math.floor(hrs / 24);
                              return `${days}d`;
                            })();

                            return (
                              <div key={log.id} className="flex gap-3 group">
                                {/* Timeline dot + line */}
                                <div className="flex flex-col items-center pt-1">
                                  <div className={`w-2.5 h-2.5 rounded-full ${style.bg} ring-2 ring-[#1A1A1A] shrink-0`} />
                                  {!isLast && <div className="w-px flex-1 bg-[#333] mt-1" />}
                                </div>
                                {/* Content */}
                                <div className="pb-3 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <LogIcon size={12} className={`${style.color} shrink-0`} />
                                    <p className="text-xs font-bold text-gray-200 truncate">{log.descricao}</p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-gray-600">{log.admin?.nome || 'Admin'}</span>
                                    <span className="text-[9px] text-gray-700">·</span>
                                    <span className="text-[9px] text-gray-600">{timeAgo}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {view === 'students' && (
             <div>
               <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-black italic">Alunos</h1>
                 <button 
                  onClick={() => { setFormData({}); setCreateType('student'); }}
                  className="bg-[#FF8C00] text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-orange-500">
                   <Plus size={16} /> Novo Aluno
                 </button>
               </div>
               {/* List */}
               <div className="space-y-3">
                 {data.students?.length === 0 && <p className="text-gray-500 text-sm">Nenhum aluno encontrado.</p>}
                 {data.students?.map((s: any) => (
                    <div key={s.id} onClick={() => { setFormData(s); setCreateType('student'); }} className="bg-[#1A1A1A] p-4 rounded-xl border border-[#333] flex justify-between items-center cursor-pointer hover:bg-[#222]">
                       <div>
                         <p className="font-bold">{s.nome}</p>
                         <p className="text-xs text-gray-500">{s.email}</p>
                       </div>
                       <ChevronRight size={18} className="text-gray-600" />
                    </div>
                 ))}
               </div>
             </div>
          )}

          {view === 'plans' && (
            <div>
               <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-black italic">Planos</h1>
                 <button 
                  onClick={() => { setFormData({}); setCreateType('plan'); }}
                  className="bg-[#FF8C00] text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-orange-500">
                   <Plus size={16} /> Novo Plano
                 </button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {data.plans?.length === 0 && <p className="text-gray-500 text-sm">Nenhum plano cadastrado.</p>}
                 {data.plans?.map((p: any) => (
                    <div key={p.id} onClick={() => { setFormData(p); setCreateType('plan'); }} className="bg-[#1A1A1A] p-5 rounded-2xl border border-gray-800 cursor-pointer hover:bg-[#222]">
                       <h3 className="font-bold text-lg mb-1">{p.nome}</h3>
                       <p className="text-xs text-gray-500 mb-4">{p.duracao_dias} dias</p>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-[#FF8C00] font-black">R$ {p.valor}</span>
                          <span className="text-gray-500">{p._count?.matriculas || 0} alunos ativos</span>
                       </div>
                    </div>
                 ))}
               </div>
             </div>
          )}

          {view === 'workouts' && (
             <div>
               <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-black italic">Treinos</h1>
                 <button 
                   onClick={() => { 
                      setFormData({ sessoes: [{ nome: 'Treino A', ordem_sequencial: 1, dia_preferencial: '', exercicios: [{ nome: '', series: '', reps: '', descanso: '' }] }] }); 
                      setCreateType('workout'); 
                   }}
                   className="bg-[#FF8C00] text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-orange-500">
                   <Plus size={16} /> Novo Treino
                 </button>
               </div>
               <div className="space-y-4">
                 {data.workouts?.length === 0 && <p className="text-gray-500 text-sm">Nenhum treino criado.</p>}
                 {data.workouts?.map((t: any) => (
                   <div key={t.id} onClick={() => { 
                      const parsedTreino = {
                         ...t,
                         data_inicio: t.data_inicio ? t.data_inicio.slice(0, 16) : '',
                         data_fim: t.data_fim ? t.data_fim.slice(0, 16) : '',
                         sessoes: t.sessoes?.map((s: any) => ({
                           ...s,
                           exercicios: (() => {
                             const raw = s.lista_exercicios;
                             if (Array.isArray(raw)) return raw;
                             if (typeof raw === 'string') { try { return JSON.parse(raw); } catch(e) { return []; } }
                             return [];
                           })()
                         }))
                      };
                      setFormData(parsedTreino); 
                      setCreateType('workout'); 
                   }} className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-5 cursor-pointer hover:bg-[#222]">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-bold text-lg">{t.nome}</h3>
                        <span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-300 uppercase">{t.objetivo}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">Aluno: <span className="text-white">{t.aluno?.nome || 'Nenhum'}</span></p>
                      
                      <div className="flex flex-wrap gap-2">
                        {t.sessoes?.map((s: any) => {
                          const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                          const dayLabel = s.dia_preferencial !== null && s.dia_preferencial !== undefined && s.dia_preferencial >= 0 && s.dia_preferencial <= 6 
                            ? ` - ${weekDays[s.dia_preferencial]}` 
                            : '';
                          return (
                          <div key={s.id} className="h-8 px-3 rounded-lg bg-[#222] flex items-center justify-center text-xs font-bold text-gray-400 border border-[#333]">
                            {s.nome || `Sessão ${s.ordem_sequencial}`}{dayLabel}
                          </div>
                          );
                        })}
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {view === 'exams' && !selectedExam && (
             <div>
               <div className="flex justify-between items-center mb-4">
                 <h1 className="text-2xl font-black italic flex items-center gap-2"><Bell size={22} className="text-red-500" /> Notificações</h1>
                 <span className="text-xs text-gray-500 font-bold">{data.exams?.length || 0} notificações</span>
               </div>

               {/* Barra de pesquisa */}
               <div className="relative mb-5">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input
                   type="text"
                   placeholder="Pesquisar aluno..."
                   value={examSearch}
                   onChange={e => setExamSearch(e.target.value)}
                   className="w-full bg-[#1A1A1A] text-sm text-white pl-11 pr-4 py-3 rounded-xl border border-[#333] focus:border-[#FF8C00] outline-none placeholder-gray-600"
                 />
               </div>

               {/* Lista de notificações compactas */}
               <div className="space-y-2">
                 {data.exams?.length === 0 && <p className="text-gray-500 text-sm text-center py-8">Nenhum alerta de exame registrado.</p>}
                 {data.exams
                   ?.filter((ex: any) => {
                     if (!examSearch.trim()) return true;
                     const term = examSearch.toLowerCase();
                     return (ex.aluno?.nome || '').toLowerCase().includes(term) || (ex.aluno?.email || '').toLowerCase().includes(term);
                   })
                   .map((ex: any) => {
                     if (ex.type === 'feedback') {
    const timeAgo = (() => {
      const diff = Date.now() - new Date(ex.created_at).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}min atrás`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h atrás`;
      return `${Math.floor(hrs / 24)}d atrás`;
    })();
    return (
      <div key={ex.id} onClick={() => setSelectedExam(ex)} className="bg-[#1A1A1A] p-4 rounded-xl border border-blue-500/30 cursor-pointer hover:bg-[#222] transition-all group flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{ex.aluno?.nome || 'Aluno'} <span className="font-normal text-gray-400">{ex.feedback_texto ? 'deixou um comentário' : 'concluiu um treino'}</span></p>
          <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo} · {ex.aluno?.email}</p>
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold shrink-0 ${ex.feedback_texto ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{ex.feedback_texto ? 'Feedback' : 'Treino Concluído'}</span>
        <button onClick={(e) => { e.stopPropagation(); if(confirm('Excluir notificação?')) dismissNotification(ex.id, 'feedback'); }} className="p-1.5 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
          <Trash2 size={14} />
        </button>
        <ChevronRight size={14} className="text-gray-600 shrink-0" />
      </div>
    );
  }
  
  const alertColor = ex.analise_texto?.nivel_alerta === 'alto' ? 'red' : ex.analise_texto?.nivel_alerta === 'medio' ? 'yellow' : 'green';
                     const borderClass = alertColor === 'red' ? 'border-red-500/40' : alertColor === 'yellow' ? 'border-yellow-500/30' : 'border-green-500/20';
                     const dotClass = alertColor === 'red' ? 'bg-red-500' : alertColor === 'yellow' ? 'bg-yellow-500' : 'bg-green-500';
                     const timeAgo = (() => {
                       const diff = Date.now() - new Date(ex.created_at).getTime();
                       const mins = Math.floor(diff / 60000);
                       if (mins < 60) return `${mins}min atrás`;
                       const hrs = Math.floor(mins / 60);
                       if (hrs < 24) return `${hrs}h atrás`;
                       return `${Math.floor(hrs / 24)}d atrás`;
                     })();

                     return (
                       <div
                         key={ex.id}
                         onClick={() => setSelectedExam(ex)}
                         className={`bg-[#1A1A1A] p-4 rounded-xl border ${borderClass} cursor-pointer hover:bg-[#222] transition-all group flex items-center gap-3`}
                       >
                         {/* Dot indicador */}
                         <div className={`w-2.5 h-2.5 rounded-full ${dotClass} shrink-0 animate-pulse`} />

                         {/* Info principal */}
                         <div className="flex-1 min-w-0">
                           <p className="font-bold text-sm truncate">
                             {ex.aluno?.nome || 'Aluno'}
                             <span className="font-normal text-gray-400"> adicionou um exame</span>
                           </p>
                           <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo} · {ex.aluno?.email}</p>
                         </div>

                         {/* Badge de risco */}
                         <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold shrink-0 ${
                           alertColor === 'red' ? 'bg-red-500/20 text-red-400' :
                           alertColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                           'bg-green-500/20 text-green-400'
                         }`}>
                           {ex.analise_texto?.nivel_alerta || '?'}
                         </span>

                         {/* Botão excluir */}
                         <button
                           onClick={async (e) => {
                             e.stopPropagation();
                             if (!confirm(`Excluir alerta de ${ex.aluno?.nome || 'aluno'}?`)) return;
                             try {
                               await dismissNotification(ex.id, 'exam');
                             } catch { alert('Erro ao excluir'); }
                           }}
                           className="p-1.5 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                         >
                           <Trash2 size={14} />
                         </button>

                         <ChevronRight size={14} className="text-gray-600 shrink-0" />
                       </div>
                     );
                   })}
               </div>
             </div>
          )}

          {/* Detalhes do exame selecionado */}
          {view === 'exams' && selectedExam && (
            <div>
              <button onClick={() => setSelectedExam(null)} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm font-bold mb-5 transition-colors">
                <ChevronRight size={14} className="rotate-180" /> Voltar aos alertas
              </button>

              <div className="bg-[#1A1A1A] rounded-2xl border border-[#333] overflow-hidden">
                {selectedExam.type === 'feedback' ? (
                   <>
                     <div className="p-5 border-b border-[#333] flex justify-between items-start bg-blue-500/5">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="font-black text-lg">{selectedExam.aluno?.nome || 'Aluno'}</h2>
                          </div>
                          <p className="text-xs text-gray-500">{selectedExam.aluno?.email}</p>
                        </div>
                        <span className={`text-[10px] px-3 py-1 rounded-lg uppercase font-bold ${selectedExam.feedback_texto ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {selectedExam.feedback_texto ? 'Feedback de Treino' : 'Treino Concluído'}
                        </span>
                     </div>
                     <div className="p-5 space-y-5">
                        {selectedExam.feedback_texto ? (
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Comentário / Relato</p>
                            <p className="text-sm text-gray-300 bg-[#222] p-4 rounded-xl border border-[#333] leading-relaxed">{selectedExam.feedback_texto}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-400 italic">Nenhum comentário deixado pelo aluno.</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">Referente a sessão: <span className="font-bold text-[#FF8C00]">{selectedExam.sessao_nome}</span></p>
                     </div>
                     <div className="flex gap-3 p-5 border-t border-[#333]">
                        <button
                          onClick={() => {
                            const tId = selectedExam.treino_id;
                            const fullWorkout = data.workouts?.find((w: any) => w.id === tId);
                            if (fullWorkout) {
                               const parsedTreino = {
                                  ...fullWorkout,
                                  data_inicio: fullWorkout.data_inicio ? fullWorkout.data_inicio.slice(0, 16) : '',
                                  data_fim: fullWorkout.data_fim ? fullWorkout.data_fim.slice(0, 16) : '',
                                  sessoes: fullWorkout.sessoes?.map((s: any) => ({
                                    ...s,
                                    exercicios: (() => {
                                      const raw = s.lista_exercicios;
                                      if (Array.isArray(raw)) return raw;
                                      if (typeof raw === 'string') { try { return JSON.parse(raw); } catch(err) { return []; } }
                                      return [];
                                    })()
                                  }))
                               };
                               setFormData(parsedTreino);
                               setCreateType('workout');
                               setView('workouts');
                               setSelectedExam(null);
                            } else {
                               alert('Treino não encontrado ou excluído.');
                            }
                          }}
                          className="flex-1 bg-blue-500/10 text-blue-500 border border-blue-500/30 px-4 py-3 rounded-xl text-xs font-black uppercase hover:bg-blue-500/20 transition-colors"
                        >
                          Abrir Treino
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Excluir notificação de ${selectedExam.aluno?.nome}?`)) return;
                            await dismissNotification(selectedExam.id, 'feedback');
                          }}
                          className="bg-red-500/10 text-red-500 border border-red-500/30 px-4 py-3 rounded-xl text-xs font-black uppercase hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={14} className="mx-auto" />
                        </button>
                     </div>
                   </>
                ) : (
                   <>
                     <div className={`p-5 border-b border-[#333] flex justify-between items-start ${
                       selectedExam.analise_texto?.nivel_alerta === 'alto' ? 'bg-red-500/5' :
                       selectedExam.analise_texto?.nivel_alerta === 'medio' ? 'bg-yellow-500/5' : 'bg-green-500/5'
                     }`}>
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <BrainCircuit size={18} className="text-[#FF8C00]" />
                           <h2 className="font-black text-lg">{selectedExam.aluno?.nome || 'Aluno'}</h2>
                         </div>
                         <p className="text-xs text-gray-500">{selectedExam.aluno?.email}</p>
                         <p className="text-xs text-gray-600 mt-0.5">
                           {new Date(selectedExam.created_at).toLocaleDateString('pt-BR')} às {new Date(selectedExam.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                         </p>
                       </div>
                       <span className={`text-[10px] px-3 py-1 rounded-lg uppercase font-bold ${
                         selectedExam.analise_texto?.nivel_alerta === 'alto' ? 'bg-red-500/20 text-red-400' :
                         selectedExam.analise_texto?.nivel_alerta === 'medio' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                       }`}>
                         Risco {selectedExam.analise_texto?.nivel_alerta || 'N/A'}
                       </span>
                     </div>
                     <div className="p-5 space-y-5">
                       {selectedExam.analise_texto?.diagnosticos && selectedExam.analise_texto.diagnosticos.length > 0 && (
                         <div>
                           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Diagnósticos Detectados</p>
                           <ul className="space-y-1">
                             {selectedExam.analise_texto.diagnosticos.map((d: string, i: number) => (
                               <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                 <span className="w-1.5 h-1.5 bg-[#FF8C00] rounded-full mt-1.5 shrink-0" />
                                 {d}
                               </li>
                             ))}
                           </ul>
                         </div>
                       )}

                       {selectedExam.restricoes_geradas?.restricoes_movimento && selectedExam.restricoes_geradas.restricoes_movimento.length > 0 && (
                         <div>
                           <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">⚠ Restrições de Movimento</p>
                           <div className="space-y-1.5">
                             {selectedExam.restricoes_geradas.restricoes_movimento.map((r: string, i: number) => (
                               <div key={i} className="text-sm text-red-300 bg-red-500/5 border border-red-500/10 px-3 py-2 rounded-lg">
                                 {r}
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       {selectedExam.analise_texto?.sugestao && (
                         <div>
                           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Sugestão de Adaptação</p>
                           <p className="text-sm text-gray-300 bg-[#222] p-4 rounded-xl border border-[#333] leading-relaxed">{selectedExam.analise_texto.sugestao}</p>
                         </div>
                       )}
                     </div>

                     <div className="flex gap-3 p-5 border-t border-[#333]">
                       <button
                         onClick={() => setView('workouts')}
                         className="flex-1 bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/30 px-4 py-3 rounded-xl text-xs font-black uppercase hover:bg-[#FF8C00]/20 transition-colors"
                       >
                         Ver Treinos
                       </button>
                       <button
                         onClick={() => {
                           setFormData({
                             aluno_id: selectedExam.aluno_id,
                             sessoes: [{ nome: 'Treino A', ordem_sequencial: 1, dia_preferencial: '', exercicios: [{ nome: '', series: '', reps: '', descanso: '' }] }]
                           });
                           setCreateType('workout');
                         }}
                         className="flex-1 bg-green-500/10 text-green-500 border border-green-500/30 px-4 py-3 rounded-xl text-xs font-black uppercase hover:bg-green-500/20 transition-colors"
                       >
                         Criar Treino Adaptado
                       </button>
                       <button
                         onClick={async () => {
                           if (!confirm(`Excluir este alerta de ${selectedExam.aluno?.nome}?`)) return;
                           await dismissNotification(selectedExam.id, 'exam');
                         }}
                         className="bg-red-500/10 text-red-500 border border-red-500/30 px-4 py-3 rounded-xl text-xs font-black uppercase hover:bg-red-500/20 transition-colors"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                   </>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Mobile Logout Button Below content if needed */}
      <div className="md:hidden p-6">
        <button onClick={onLogout} className="w-full text-center text-xs text-red-500 uppercase font-bold py-3 border border-red-500/20 rounded-xl">
          Sair da Conta
        </button>
      </div>

      {createType && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#121212] border border-[#333] rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic text-[#FF8C00] uppercase">
                {formData.id ? 'EDITAR ' : 'NOVO '}
                {createType === 'student' ? 'ALUNO' : createType === 'plan' ? 'PLANO' : 'TREINO'}
              </h2>
              <button disabled={loadingAction} onClick={() => setCreateType('')} className="text-gray-500 font-bold hover:text-white">VOLTAR</button>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setLoadingAction(true);
                try {
                  let endpoint = createType === 'settings' ? '/api/auth/profile' : createType === 'student' ? '/api/admin/students' : createType === 'plan' ? '/api/admin/plans' : '/api/admin/treinos';
                  const method = createType === 'settings' ? 'PUT' : formData.id ? 'PUT' : 'POST';
                  if (formData.id && createType !== 'settings') endpoint += `/${formData.id}`;

                  // Simple hacky prep for duration/valor
                  const payload = { ...formData };
                  if (payload.senha === '' || payload.senha === null) delete payload.senha;
                  
                  if(createType === 'plan') {
                    payload.duracao_dias = parseInt(payload.duracao_dias, 10);
                    payload.valor = parseFloat(payload.valor);
                  }
                  
                  if(createType === 'workout') {
                    payload.data_inicio = new Date(payload.data_inicio).toISOString();
                    payload.data_fim = new Date(payload.data_fim).toISOString();
                    payload.sessoes = (payload.sessoes || []).map((s: any, idx: number) => ({
                      id: s.id,
                      nome: s.nome,
                      ordem_sequencial: idx + 1,
                      dia_preferencial: s.dia_preferencial !== '' && s.dia_preferencial !== null && s.dia_preferencial !== undefined && !isNaN(parseInt(s.dia_preferencial)) ? parseInt(s.dia_preferencial) : null,
                      lista_exercicios: JSON.stringify(s.exercicios.filter((ex: any) => ex.nome.trim() !== ''))
                    }));
                  }
                  
                  const res = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload)
                  });
                  if(!res.ok) {
                     const err = await res.json().catch(()=>({ error: 'Erro desconhecido' }));
                     alert(err.error || 'Erro na operação');
                     setLoadingAction(false);
                     return;
                  }
                  
                  // Reload specific info
                  if(createType === 'student') await fetchStudents();
                  if(createType === 'plan') await fetchPlans();
                  if(createType === 'workout') await fetchWorkouts();
                  fetchLogs(); // Atualiza logs de atividade
                  
                  if(createType === 'settings') {
                    alert('Perfil atualizado! Por favor, faça login novamente.');
                    setCreateType('');
                    onLogout();
                    return;
                  }
                  
                  setCreateType('');
                } catch(e: any) {
                  alert(e?.message || 'Erro inesperado');
                }
                setLoadingAction(false);
              }}
              className="space-y-4"
            >
              {createType === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Seu Nome</label>
                    <input required className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder="Nome Completo" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">E-mail</label>
                    <input required type="email" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder="email@exemplo.com" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nova Senha (opcional)</label>
                    <input type="text" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder="Digite para alterar" value={formData.senha || ''} onChange={e => setFormData({...formData, senha: e.target.value})} />
                  </div>
                </div>
              )}

              {createType === 'plan' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nome do Plano</label>
                    <input required className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder="Ex: Mensal Básico" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Duração (Dias)</label>
                      <input required type="number" min="1" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder="Ex: 30" value={formData.duracao_dias || ''} onChange={e => setFormData({...formData, duracao_dias: e.target.value})} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Valor (R$)</label>
                      <input required type="number" min="0" step="0.01" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder="Ex: 99.90" value={formData.valor || ''} onChange={e => setFormData({...formData, valor: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {createType === 'student' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nome do Aluno</label>
                    <input required className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder="Nome Completo" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">E-mail</label>
                    <input required type="email" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder="email@exemplo.com" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Senha {formData.id ? '(Opcional)' : 'Provisória'}</label>
                    <input required={!formData.id} type="password" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder={formData.id ? "Digite para alterar a senha" : "Min. 6 caracteres"} value={formData.senha || ''} onChange={e => setFormData({...formData, senha: e.target.value})} />
                  </div>
                  {!formData.id && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Vincular Plano</label>
                        <select required className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors cursor-pointer" value={formData.plano_id || ''} onChange={e => setFormData({...formData, plano_id: e.target.value})}>
                          <option value="" disabled>Selecione um plano...</option>
                          {data.plans?.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Início (Opcional)</label>
                          <input type="date" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors cursor-pointer" value={formData.data_inicio || ''} onChange={e => setFormData({...formData, data_inicio: e.target.value})} />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Vencimento (Opcional)</label>
                          <input type="date" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors cursor-pointer" value={formData.data_fim || ''} onChange={e => setFormData({...formData, data_fim: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.id && (
                    <div className="mt-6 space-y-4">
                       <h3 className="text-sm font-bold text-gray-300">Resumo do Aluno</h3>
                       
                       <div className="bg-[#111] p-4 rounded-xl border border-[#333]">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Plano Atual</p>
                          {formData.matriculas && formData.matriculas.length > 0 ? (
                             <div>
                               <p className="font-bold text-white text-sm">{formData.matriculas[0].plano.nome}</p>
                               <p className="text-xs text-gray-400 mt-1">Expira em: {new Date(formData.matriculas[0].data_vencimento).toLocaleDateString('pt-BR')}</p>
                               <button
                                 type="button"
                                 onClick={async (e) => {
                                   e.preventDefault();
                                   if (!confirm(`Deseja renovar o plano deste aluno? O vencimento será estendido automaticamente.`)) return;
                                   try {
                                     const res = await fetch(`/api/admin/students/${formData.id}/renew`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                                     if (!res.ok) {
                                       const err = await res.json().catch(()=>({}));
                                       alert(err.error || 'Erro ao renovar plano');
                                       return;
                                     }
                                     alert('Plano renovado com sucesso!');
                                     fetchStudents();
                                     setCreateType('');
                                   } catch(err) {
                                     alert('Erro inesperado');
                                   }
                                 }}
                                 className="mt-3 text-[10px] bg-[#FF8C00] text-black hover:bg-orange-500 font-bold px-3 py-2 rounded-lg transition-colors uppercase tracking-widest"
                               >
                                 Renovar Plano
                               </button>
                             </div>
                          ) : (
                             <p className="text-xs text-gray-500 italic">Nenhum plano ativo.</p>
                          )}
                       </div>

                       <div className="bg-[#111] p-4 rounded-xl border border-[#333]">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Treino Atual</p>
                          {formData.treinos_recebidos && formData.treinos_recebidos.length > 0 ? (
                             <div>
                               <p className="font-bold text-[#FF8C00] text-sm mb-1">{formData.treinos_recebidos[0].nome}</p>
                               <p className="text-xs text-gray-400">
                                 {formData.treinos_recebidos[0].data_fim 
                                   ? `Expira em: ${new Date(formData.treinos_recebidos[0].data_fim).toLocaleDateString()}` 
                                   : 'Sem data de validade'}
                               </p>
                               <button 
                                 type="button"
                                 onClick={(e) => {
                                   e.preventDefault();
                                   const tId = formData.treinos_recebidos[0].id;
                                   const fullWorkout = data.workouts?.find((w: any) => w.id === tId);
                                   if (fullWorkout) {
                                      const parsedTreino = {
                                         ...fullWorkout,
                                         data_inicio: fullWorkout.data_inicio ? fullWorkout.data_inicio.slice(0, 16) : '',
                                         data_fim: fullWorkout.data_fim ? fullWorkout.data_fim.slice(0, 16) : '',
                                         sessoes: fullWorkout.sessoes?.map((s: any) => ({
                                           ...s,
                                           exercicios: (() => {
                                             const raw = s.lista_exercicios;
                                             if (Array.isArray(raw)) return raw;
                                             if (typeof raw === 'string') { try { return JSON.parse(raw); } catch(err) { return []; } }
                                             return [];
                                           })()
                                         }))
                                      };
                                      setFormData(parsedTreino);
                                      setCreateType('workout');
                                      setView('workouts');
                                   } else {
                                      setCreateType('');
                                      setView('workouts');
                                   }
                                 }}
                                 className="mt-3 text-xs bg-[#222] hover:bg-[#333] px-3 py-1.5 rounded-lg text-white transition-colors"
                               >
                                 Ver Treino
                               </button>
                             </div>
                          ) : (
                             <div>
                               <p className="text-xs text-gray-500 italic mb-3">O aluno não possui treinos ativos.</p>
                               <button
                                 type="button"
                                 onClick={(e) => {
                                    e.preventDefault();
                                    setCreateType('workout');
                                    setFormData({ aluno_id: formData.id, sessoes: [{ nome: 'Treino A', ordem_sequencial: 1, dia_preferencial: '', exercicios: [{ nome: '', series: '', reps: '', descanso: '' }] }] });
                                 }}
                                 className="text-xs font-bold bg-[#FF8C00] text-black px-3 py-2 rounded-lg hover:bg-orange-500 transition-colors"
                               >
                                 + CRIAR NOVO TREINO
                               </button>
                             </div>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              )}

              {createType === 'workout' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Selecionar Aluno</label>
                    <select required className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors cursor-pointer" value={formData.aluno_id || ''} onChange={e => setFormData({...formData, aluno_id: e.target.value})}>
                      <option value="" disabled>Selecione um aluno...</option>
                      {data.students?.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nome do Treino</label>
                    <input required className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors placeholder-gray-600" placeholder="Ex: Periodização V1" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Objetivo Geral</label>
                    <select required className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors cursor-pointer" value={formData.objetivo || ''} onChange={e => setFormData({...formData, objetivo: e.target.value})}>
                      <option value="" disabled>Selecione o objetivo...</option>
                      <option value="Hipertrofia">Hipertrofia</option>
                      <option value="Emagrecimento">Emagrecimento</option>
                      <option value="Resistencia">Resistência</option>
                      <option value="Forca">Força</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Início</label>
                      <input required type="datetime-local" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors cursor-pointer" value={formData.data_inicio || ''} onChange={e => setFormData({...formData, data_inicio: e.target.value})} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Fim</label>
                      <input required type="datetime-local" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222] transition-colors cursor-pointer" value={formData.data_fim || ''} onChange={e => setFormData({...formData, data_fim: e.target.value})} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#333]">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Sessões de Treino</label>
                      <button 
                        type="button"
                        onClick={() => {
                          const newSessoes = [...(formData.sessoes || []), { nome: '', ordem_sequencial: (formData.sessoes?.length || 0) + 1, dia_preferencial: '', exercicios: [{ nome: '', series: '', reps: '', descanso: '' }] }];
                          setFormData({ ...formData, sessoes: newSessoes });
                        }}
                        className="text-xs font-bold text-[#FF8C00] bg-[#FF8C00]/10 px-3 py-2 rounded-lg hover:bg-[#FF8C00]/20"
                      >
                        + ADICIONAR SESSÃO
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {formData.sessoes?.map((sessao: any, index: number) => (
                        <div key={index} className="bg-[#1A1A1A] border border-[#333] p-5 rounded-2xl space-y-4 relative">
                          <button 
                            type="button" 
                            onClick={() => {
                              const newSessoes = formData.sessoes.filter((_: any, i: number) => i !== index);
                              setFormData({ ...formData, sessoes: newSessoes });
                            }}
                            className="absolute top-5 right-5 text-gray-500 hover:text-red-500 bg-[#222] rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                          >
                            ×
                          </button>
                          
                          <div className="flex flex-col sm:flex-row sm:items-end gap-4 pr-8 sm:pr-12">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Nome da Sessão</label>
                              <input required placeholder={`Ex: ${String.fromCharCode(65 + index)} - Peito e Tríceps`} className="w-full h-[46px] bg-[#222] rounded-xl px-4 text-sm focus:border-[#FF8C00] border border-transparent outline-none text-white font-bold transition-all" value={sessao.nome || ''} onChange={e => {
                                 const newSessoes = [...formData.sessoes];
                                 newSessoes[index].nome = e.target.value;
                                 setFormData({ ...formData, sessoes: newSessoes });
                              }} />
                            </div>
                            <div className="sm:w-[40%] w-full shrink-0">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Dia Preferencial</label>
                              <select className="w-full h-[46px] bg-[#222] rounded-xl px-3 text-sm focus:border-[#FF8C00] border border-transparent outline-none text-white font-bold transition-all cursor-pointer" value={sessao.dia_preferencial || ''} onChange={e => {
                                 const newSessoes = [...formData.sessoes];
                                 newSessoes[index].dia_preferencial = e.target.value;
                                 setFormData({ ...formData, sessoes: newSessoes });
                              }}>
                                <option value="">Flexível</option>
                                <option value="0">Domingo</option>
                                <option value="1">Segunda-feira</option>
                                <option value="2">Terça-feira</option>
                                <option value="3">Quarta-feira</option>
                                <option value="4">Quinta-feira</option>
                                <option value="5">Sexta-feira</option>
                                <option value="6">Sábado</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                             <div className="flex items-center justify-between pl-1 mb-3">
                               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Exercícios</label>
                             </div>
                             
                             <div className="space-y-3">
                               {sessao.exercicios?.map((ex: any, exIndex: number) => (
                                 <div key={exIndex} className="flex gap-2 items-start relative bg-[#1E1E1E] p-3 rounded-xl border border-transparent focus-within:border-[#333] transition-colors">
                                    <div className="flex-1 flex flex-col gap-2 relative">
                                       <input list="exercicios-list" required placeholder="Nome do Exercício" className="w-full bg-[#222] rounded-lg p-2.5 text-xs focus:border-[#FF8C00] border border-transparent outline-none text-white font-bold transition-all" value={ex.nome || ''} onChange={e => {
                                         const newSessoes = [...formData.sessoes];
                                         newSessoes[index].exercicios[exIndex].nome = e.target.value;
                                         setFormData({ ...formData, sessoes: newSessoes });
                                       }} />
                                       <div className="flex gap-2">
                                          <div className="flex-1">
                                             <input required placeholder="Séries" className="w-full bg-[#222] rounded-lg p-2.5 text-xs focus:border-[#FF8C00] border border-transparent outline-none text-white text-center transition-all" value={ex.series || ''} onChange={e => {
                                               const newSessoes = [...formData.sessoes];
                                               newSessoes[index].exercicios[exIndex].series = e.target.value;
                                               setFormData({ ...formData, sessoes: newSessoes });
                                             }} />
                                          </div>
                                          <div className="flex-1">
                                             <input required placeholder="Repetições" className="w-full bg-[#222] rounded-lg p-2.5 text-xs focus:border-[#FF8C00] border border-transparent outline-none text-white text-center transition-all" value={ex.reps || ''} onChange={e => {
                                               const newSessoes = [...formData.sessoes];
                                               newSessoes[index].exercicios[exIndex].reps = e.target.value;
                                               setFormData({ ...formData, sessoes: newSessoes });
                                             }} />
                                          </div>
                                          <div className="flex-1">
                                             <input placeholder="Descanso" className="w-full bg-[#222] rounded-lg p-2.5 text-xs focus:border-[#FF8C00] border border-transparent outline-none text-white text-center transition-all" value={ex.descanso || ''} onChange={e => {
                                               const newSessoes = [...formData.sessoes];
                                               newSessoes[index].exercicios[exIndex].descanso = e.target.value;
                                               setFormData({ ...formData, sessoes: newSessoes });
                                             }} />
                                          </div>
                                       </div>
                                    </div>
                                    
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                         const newSessoes = [...formData.sessoes];
                                         newSessoes[index].exercicios = sessao.exercicios.filter((_: any, i: number) => i !== exIndex);
                                         setFormData({ ...formData, sessoes: newSessoes });
                                      }}
                                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 shrink-0 transition-opacity mt-1"
                                    >
                                      ×
                                    </button>
                                 </div>
                               ))}
                               <datalist id="exercicios-list">
                                 {data.exercicios?.map((gEx: any) => (
                                   <option key={gEx.id} value={gEx.nome} />
                                 ))}
                               </datalist>
                               <button 
                                 type="button"
                                 onClick={() => {
                                    const newSessoes = [...formData.sessoes];
                                    newSessoes[index].exercicios.push({ nome: '', series: '', reps: '', descanso: '' });
                                    setFormData({ ...formData, sessoes: newSessoes });
                                 }}
                                 className="text-[#FF8C00] text-xs font-bold mt-2 uppercase tracking-wider py-2"
                               >
                                 + Adicionar linha de exercício
                               </button>
                             </div>
                          </div>
                        </div>
                      ))}
                      {(!formData.sessoes || formData.sessoes.length === 0) && (
                        <p className="text-xs text-gray-500 italic text-center py-4">Adicione pelo menos uma sessão de treino.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}



              <div className="flex gap-4 mt-6">
                 {formData.id && createType === 'workout' && (
                    <button 
                      type="button" 
                      disabled={loadingAction}
                      onClick={() => {
                        const clone = { ...formData };
                        delete clone.id;
                        clone.nome = `${clone.nome || ''} (Cópia)`;
                        clone.aluno_id = '';
                        if (clone.sessoes) {
                          clone.sessoes = clone.sessoes.map((s: any) => ({
                            ...s,
                            id: undefined,
                            treino_id: undefined
                          }));
                        }
                        setFormData(clone);
                      }}
                      className="flex-1 bg-[#222] text-white border border-[#333] font-black uppercase py-4 rounded-xl disabled:opacity-50 hover:bg-white hover:text-black hover:border-white transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                    >
                      CLONAR
                    </button>
                 )}
                 {formData.id && (
                    <button 
                      type="button" 
                      disabled={loadingAction}
                      onClick={async () => {
                         if(!confirm('Tem certeza que deseja excluir?')) return;
                         setLoadingAction(true);
                         try {
                           let endpoint = createType === 'student' ? '/api/admin/students' : createType === 'plan' ? '/api/admin/plans' : '/api/admin/treinos';
                           const res = await fetch(`${endpoint}/${formData.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                           if (!res.ok) {
                             const err = await res.json().catch(()=>({}));
                             alert(err.error || 'Erro ao excluir');
                             setLoadingAction(false);
                             return;
                           }
                           if(createType === 'student') await fetchStudents();
                           if(createType === 'plan') await fetchPlans();
                           if(createType === 'workout') await fetchWorkouts();
                           fetchLogs();
                           setCreateType('');
                         } catch(e: any) {
                           alert(e?.message || 'Erro inesperado');
                         }
                         setLoadingAction(false);
                      }}
                      className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase py-4 rounded-xl disabled:opacity-50 hover:bg-red-500/20"
                    >
                      EXCLUIR
                    </button>
                 )}
                 <button disabled={loadingAction} type="submit" className="flex-1 bg-[#FF8C00] text-black font-black uppercase py-4 rounded-xl disabled:opacity-50 hover:bg-[#FFA500] shadow-[0_10px_20px_rgba(255,140,0,0.2)]">
                   {loadingAction ? 'SALVANDO...' : formData.id ? 'SALVAR' : 'CADASTRAR'}
                 </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function MenuBtn({ icon: Icon, label, active, onClick, badge }: { icon: any, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all relative ${active ? 'bg-[#FF8C00]/10 text-[#FF8C00]' : 'text-gray-500 hover:bg-[#1A1A1A] hover:text-white'}`}
    >
      <div className="relative">
        <Icon size={20} />
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[8px] font-black text-white">
              {badge > 9 ? '9+' : badge}
            </span>
          </span>
        )}
      </div>
      <span className="font-bold text-sm hidden md:block">{label}</span>
    </button>
  );
}

function DashCard({ icon: Icon, title, value, onClick }: any) {
  return (
    <div onClick={onClick} className="bg-gradient-to-br from-[#1A1A1A] to-[#121212] p-6 rounded-3xl border border-[#333] hover:border-[#FF8C00] cursor-pointer transition-all group relative overflow-hidden">
       <div className="absolute top-0 right-0 p-6 opacity-5 transform group-hover:scale-110 transition-transform">
         <Icon size={100} />
       </div>
       <div className="relative z-10 space-y-4">
         <div className="w-12 h-12 bg-[#222] rounded-xl flex items-center justify-center text-[#FF8C00]">
            <Icon size={24} />
         </div>
         <div>
            <p className="text-sm text-gray-400 font-bold">{title}</p>
            <p className="text-[#FF8C00] font-black mt-1 uppercase text-xs">{value} &rarr;</p>
         </div>
       </div>
    </div>
  )
}
