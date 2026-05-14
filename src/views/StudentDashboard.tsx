import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Activity, BrainCircuit, ShieldAlert, FileText, Send, LogOut, CheckCircle, ChevronRight } from 'lucide-react';

interface Props {
  onLogout: () => void;
  user: any;
  token?: string;
}

export function StudentDashboard({ onLogout, user, token }: Props) {
  const [examOverlay, setExamOverlay] = useState(false);
  const [feedbackOverlay, setFeedbackOverlay] = useState(false);
  const [examText, setExamText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  const [treinoAtivo, setTreinoAtivo] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [cargas, setCargas] = useState<Record<string, string>>({});
  
  const [historicoOverlay, setHistoricoOverlay] = useState<string | null>(null);
  const [historicoData, setHistoricoData] = useState<any[]>([]);

  const [settingsOverlay, setSettingsOverlay] = useState(false);
  const [examFile, setExamFile] = useState<File | null>(null);
  const [examFileData, setExamFileData] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loadingAction, setLoadingAction] = useState(false);

  React.useEffect(() => {
    fetch('/api/training/all', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => {
      if(r.ok) return r.json();
      throw new Error();
    })
    .then(data => {
      setTreinoAtivo(data);
      setLoadingSession(false);
    })
    .catch(() => setLoadingSession(false));
  }, [token]);

  const saveCarga = async (exercicio: string, carga: string) => {
    if (!carga) return;
    try {
      const res = await fetch('/api/training/carga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ exercicio, carga })
      });
      if(res.ok) alert('Carga salva!');
      else alert('Erro ao salvar');
    } catch(e) { alert('Erro ao salvar'); }
  };

  const openHistorico = async (exercicio: string) => {
    setHistoricoOverlay(exercicio);
    setHistoricoData([]);
    try {
      const res = await fetch(`/api/training/carga/${encodeURIComponent(exercicio)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setHistoricoData(await res.json());
    } catch(e) { }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] relative">
      <div className="p-8 pt-16 bg-[#121212] rounded-b-[2.5rem] shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Bem-vindo de volta,</h2>
            <p className="text-2xl font-black italic text-white truncate max-w-[200px]">{user.nome.toUpperCase()}</p>
          </div>
          <div className="w-12 h-12 bg-[#1A1A1A] rounded-full flex items-center justify-center border-2 border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.3)] cursor-pointer" onClick={() => { setFormData({ nome: user.nome, email: user.email }); setSettingsOverlay(true); }}>
            <User color="#FF8C00" size={24} />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <div className="bg-[#1A1A1A] p-4 rounded-2xl min-w-[140px] border border-[#222]">
            <Activity size={18} className="text-[#FF8C00] mb-2" />
            <p className="text-xs text-gray-400 font-bold mb-1">Status Plano</p>
            <p className="text-sm font-black text-green-500 uppercase">Ativo</p>
          </div>
          <div 
             onClick={() => setExamOverlay(true)}
             className="bg-gradient-to-br from-[#1A1A1A] to-[#222] p-4 rounded-2xl min-w-[140px] border border-[#FF8C00]/30 cursor-pointer hover:border-[#FF8C00] transition-colors"
          >
            <BrainCircuit size={18} className="text-[#FF8C00] mb-2" />
            <p className="text-xs text-gray-400 font-bold mb-1">IA Médica</p>
            <p className="text-[10px] font-black text-[#FF8C00] uppercase mt-1">Enviar Exame &rarr;</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-8 pb-24">
        
        {!selectedSession ? (
          <div className="space-y-4">
            <div className="flex justify-between items-end gap-4">
              <h3 className="text-xl font-black italic shrink-0">MEUS TREINOS</h3>
              <span className="text-[10px] font-bold bg-[#FF8C00]/20 text-[#FF8C00] px-2 py-0.5 rounded uppercase tracking-widest truncate">
                {treinoAtivo ? (treinoAtivo.nome || 'Sessões') : 'Pausado'}
              </span>
            </div>

            {loadingSession ? (
              <p className="text-sm text-gray-500 text-center py-10">Buscando seus treinos...</p>
            ) : treinoAtivo ? (
              <div className="space-y-3">
                {treinoAtivo.sessoes?.map((s: any) => {
                  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                  const dia = s.dia_preferencial != null ? weekDays[s.dia_preferencial] : '';
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => { setSelectedSession(s); setCompletedExercises([]); setCargas({}); }}
                      className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#333] hover:border-[#FF8C00]/50 cursor-pointer transition-colors flex justify-between items-center group"
                    >
                        <div>
                          <h4 className="font-bold text-white text-lg">{s.nome || `Sessão ${s.ordem_sequencial}`}</h4>
                          {dia && <p className="text-xs text-[#FF8C00] font-bold tracking-widest uppercase mt-1">{dia}</p>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#222] group-hover:bg-[#FF8C00]/20 flex items-center justify-center transition-colors">
                          <ChevronRight color="#FF8C00" size={18} />
                        </div>
                    </div>
                  );
                })}
              </div>
            ) : (
                <div className="text-center text-gray-500 text-xs py-10">
                  Nenhum treino liberado no momento. <br/><br/>
                  Aguarde o Admin criar ou reativar sua assinatura.
                </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedSession(null)} className="text-[#FF8C00] font-bold text-sm uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
                 &larr; Voltar aos Treinos
              </button>
            </div>
            
            <div className="flex justify-between items-end">
              <h3 className="text-2xl font-black italic text-white truncate">{selectedSession.nome || `Sessão ${selectedSession.ordem_sequencial}`}</h3>
            </div>
            
            <div className="bg-[#1A1A1A] p-4 md:p-6 rounded-3xl border border-[#333] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8C00] opacity-5 rounded-bl-full blur-2xl pointer-events-none" />
              
              <div className="space-y-3 relative z-10">
                {(() => {
                  let exercises: any[] = [];
                  const raw = selectedSession.lista_exercicios;
                  if (Array.isArray(raw)) {
                    exercises = raw;
                  } else if (typeof raw === 'string') {
                    try { exercises = JSON.parse(raw); } catch(e) { exercises = []; }
                  }
                  
                  if (exercises.length === 0) return <p className="text-gray-500 text-sm italic">Nenhum exercício cadastrado nesta sessão.</p>;

                  return exercises.map((ex: any, i: number) => {
                    const isCompleted = completedExercises.includes(i);
                    const exName = ex.nome || ex;
                    return (
                      <div key={i} className={`p-4 rounded-xl border transition-colors ${isCompleted ? 'bg-[#FF8C00]/5 border-[#FF8C00]/50' : 'bg-[#222] border-[#333]'}`}>
                        <div 
                          className="flex items-start gap-3 cursor-pointer"
                          onClick={() => {
                            if (isCompleted) setCompletedExercises(completedExercises.filter(id => id !== i));
                            else setCompletedExercises([...completedExercises, i]);
                          }}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${isCompleted ? 'border-[#FF8C00] bg-[#FF8C00]' : 'border-gray-500'}`}>
                              {isCompleted && <CheckCircle size={12} color="black" />}
                          </div>
                          <div className="flex-1 min-w-0">
                              <span className={`font-black text-lg block truncate ${isCompleted ? 'text-[#FF8C00] line-through opacity-70' : 'text-white'}`}>{exName}</span>
                              <div className={`text-sm mt-1 ${isCompleted ? 'text-[#FF8C00]/70' : 'text-gray-400'}`}>
                                {ex.series && ex.reps ? (
                                  <span className="bg-black/30 px-2 py-0.5 rounded text-xs font-bold mr-2">{ex.series} x {ex.reps}</span>
                                ) : null}
                                {ex.descanso && <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">⏱ Descanso: {ex.descanso}</span>}
                              </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-[#333] flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Carga (ex: 20kg)" 
                            className="bg-[#121212] border border-[#444] rounded-lg px-3 py-2 text-xs w-28 text-white focus:border-[#FF8C00] outline-none transition-colors"
                            value={cargas[`${i}`] || ''}
                            onChange={e => setCargas({...cargas, [`${i}`]: e.target.value})}
                          />
                          <button 
                            onClick={(e) => { e.stopPropagation(); saveCarga(exName, cargas[`${i}`]); }}
                            className="bg-[#FF8C00]/10 border border-[#FF8C00]/30 text-[#FF8C00] px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-[#FF8C00]/20 transition-colors"
                          >
                            Salvar
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openHistorico(exName); }}
                            className="ml-auto text-gray-400 p-2 hover:text-[#FF8C00] bg-[#222] rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
                            title="Ver Histórico de Carga"
                          >
                            <Activity size={14} /> <span className="hidden sm:inline">Histórico</span>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <button 
                onClick={() => setFeedbackOverlay(true)}
                disabled={(() => {
                  let exercises: any[] = [];
                  const raw = selectedSession.lista_exercicios;
                  if (Array.isArray(raw)) exercises = raw;
                  else if (typeof raw === 'string') { try { exercises = JSON.parse(raw); } catch(e) { exercises = []; } }
                  return completedExercises.length !== exercises.length || exercises.length === 0;
                })()}
                className="w-full mt-6 py-4 rounded-2xl border-2 border-[#FF8C00] text-[#FF8C00] font-black uppercase text-sm hover:bg-[#FF8C00]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                FINALIZAR SESSÃO
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={onLogout}
          className="w-full flex justify-center items-center gap-2 py-4 text-xs font-black text-gray-600 uppercase tracking-widest hover:text-white"
        >
          <LogOut size={16} />
          Sair da Conta
        </button>
      </div>

      {/* Histórico de Carga Overlay */}
      <AnimatePresence>
        {historicoOverlay && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-0 z-50 bg-[#121212] flex flex-col p-6"
          >
             <div className="flex justify-between items-center mb-8 mt-6">
                <h3 className="text-xl font-black italic text-[#FF8C00] truncate max-w-[200px]">{historicoOverlay}</h3>
                <button onClick={() => setHistoricoOverlay(null)} className="text-gray-500 font-bold hover:text-white text-xs">FECHAR</button>
             </div>
             
             <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-widest font-bold bg-[#1A1A1A] p-3 rounded-lg border border-[#333]">
               Histórico e Progressão de Carga
             </p>

             <div className="space-y-3 overflow-y-auto pb-10">
               {historicoData.length === 0 ? (
                 <p className="text-gray-500 text-sm italic text-center mt-10">Nenhum registro encontrado para este exercício.</p>
               ) : (
                 historicoData.map((h, idx) => (
                   <div key={idx} className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl border border-[#333]">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FF8C00]/10 flex items-center justify-center">
                          <Activity size={14} className="text-[#FF8C00]" />
                        </div>
                        <span className="text-lg font-black text-white">{h.carga}</span>
                     </div>
                     <span className="text-xs text-gray-500 font-bold">{new Date(h.created_at).toLocaleDateString('pt-BR')}</span>
                   </div>
                 ))
               )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exam Overlay */}
      <AnimatePresence>
        {examOverlay && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-0 z-50 bg-[#121212] flex flex-col p-6"
          >
             <div className="flex justify-between items-center mb-8 mt-6">
                <h3 className="text-2xl font-black italic text-[#FF8C00]">ENVIAR EXAME</h3>
                <button onClick={() => setExamOverlay(false)} className="text-gray-500 font-bold hover:text-white text-xs">VOLTAR</button>
             </div>
             
             <p className="text-sm text-gray-400 mb-6 leading-relaxed">
               Descreva suas restrições médicas, lesões ou cole o laudo do seu exame. A nossa IA processará as informações e adaptará os exercícios do seu treino automaticamente.
             </p>

             <textarea 
               className="w-full bg-[#1A1A1A] text-sm text-white p-4 rounded-2xl border border-[#333] focus:border-[#FF8C00] outline-none h-48 resize-none mb-4"
               placeholder="Ex: Tenho condromalácia patelar grau 2..."
               value={examText}
               onChange={e => setExamText(e.target.value)}
             />

             <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Anexar Laudo/Imagem</label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  className="w-full bg-[#1A1A1A] text-sm text-gray-400 p-3 rounded-xl border border-[#333] focus:border-[#FF8C00] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#FF8C00] file:text-black hover:file:bg-[#FFA500]"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                       setExamFile(file);
                       const reader = new FileReader();
                       reader.onload = () => setExamFileData(reader.result as string);
                       reader.readAsDataURL(file);
                    } else {
                       setExamFile(null);
                       setExamFileData(null);
                    }
                  }}
                />
             </div>

             <button 
               disabled={loadingAction}
               onClick={async () => {
                 if (!examText.trim()) { alert('Por favor, descreva seu exame.'); return; }
                 setLoadingAction(true);
                 try {
                   const res = await fetch('/api/exams/analyze', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                     body: JSON.stringify({ examText, fileData: examFileData?.split(',')[1], fileMimeType: examFile?.type })
                   });
                   if (!res.ok) throw new Error();
                   alert('Exame enviado com sucesso!');
                   setExamOverlay(false);
                 } catch (e: any) { alert('Erro ao enviar exame.'); } 
                 finally { setLoadingAction(false); }
               }}
               className="w-full bg-[#FF8C00] text-black font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2 mt-auto mb-8 hover:bg-[#FFA500] disabled:opacity-50"
             >
               {loadingAction ? 'Analisando...' : <><Send size={18} strokeWidth={3} /> Analisar Restrições</>}
             </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedbackOverlay && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-0 z-50 bg-[#121212] flex flex-col p-6 items-center justify-center"
          >
             <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
               <CheckCircle size={40} />
             </div>
             <h3 className="text-3xl font-black italic mb-2 text-center text-white">SESSÃO CONCLUÍDA</h3>
             <p className="text-gray-400 text-sm mb-8 text-center max-w-[250px]">
               Como foi o treino? Deixe um comentário para o professor (opcional).
             </p>

             <textarea 
               value={feedbackText}
               onChange={e => setFeedbackText(e.target.value)}
               className="w-full bg-[#1A1A1A] text-sm text-white p-4 rounded-2xl border border-[#333] focus:border-[#FF8C00] outline-none h-32 resize-none mb-6"
               placeholder="Ex: Muito bom..."
             />

             <div className="flex gap-4 w-full">
               <button onClick={() => setFeedbackOverlay(false)} className="flex-1 py-4 text-xs font-bold text-gray-500 uppercase hover:text-white">Cancelar</button>
               <button 
                 disabled={submittingFeedback}
                 onClick={async () => {
                   setSubmittingFeedback(true);
                   try {
                     await fetch('/api/training/log', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                       body: JSON.stringify({ sessao_id: selectedSession?.id, observacao: feedbackText })
                     });
                     alert('Treino registrado com sucesso!');
                     setFeedbackOverlay(false);
                     setFeedbackText('');
                     setSelectedSession(null);
                     window.location.reload();
                   } catch(e) { alert('Erro ao registrar'); } 
                   finally { setSubmittingFeedback(false); }
                 }}
                 className="flex-1 bg-[#FF8C00] text-black font-black uppercase py-4 rounded-xl disabled:opacity-50"
               >
                 Salvar
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          >
            <div className="bg-[#121212] border border-[#333] rounded-3xl p-6 w-full max-w-md">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black italic text-[#FF8C00]">CONFIGURAÇÕES</h2>
                 <button onClick={() => setSettingsOverlay(false)} className="text-gray-500 font-bold hover:text-white">VOLTAR</button>
               </div>
               
               <form 
                 onSubmit={async(e) => {
                   e.preventDefault();
                   setLoadingAction(true);
                   try {
                     const payload = { ...formData };
                     if (payload.senha === '' || payload.senha === null) delete payload.senha;

                     const res = await fetch('/api/auth/profile', {
                       method: 'PUT',
                       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                       body: JSON.stringify(payload)
                     });
                     if(!res.ok) throw new Error();
                     alert('Perfil atualizado! Faça login novamente para ver as alterações.');
                     setSettingsOverlay(false);
                     onLogout();
                   } catch(e) { alert('Erro ao atualizar perfil.'); }
                   setLoadingAction(false);
                 }}
                 className="space-y-4"
               >
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Seu Nome</label>
                    <input required className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222]" placeholder="Nome Completo" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">E-mail</label>
                    <input required type="email" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222]" placeholder="email@exemplo.com" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nova Senha</label>
                    <input type="text" className="mt-1 w-full bg-[#1A1A1A] rounded-xl p-4 text-sm focus:border-[#FF8C00] border border-[#333] outline-none text-white focus:bg-[#222]" placeholder="Digite para alterar" value={formData.senha || ''} onChange={e => setFormData({...formData, senha: e.target.value})} />
                  </div>
                  
                  <button disabled={loadingAction} type="submit" className="w-full bg-[#FF8C00] text-black font-black uppercase py-4 rounded-xl mt-6 disabled:opacity-50 hover:bg-[#FFA500]">
                    {loadingAction ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                  </button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
