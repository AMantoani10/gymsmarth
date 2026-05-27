import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, KeyRound } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function ForgotPasswordView({ onBack }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Preencha o seu e-mail.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar o código.');
      setSuccess('Código enviado! Verifique o seu e-mail.');
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao redefinir a senha.');
      setSuccess(data.message || 'Senha redefinida com sucesso!');
      setTimeout(() => onBack(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="flex flex-col h-full bg-[#121212] overflow-y-auto sm:justify-center sm:items-center sm:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] sm:from-[#1e1e1e] sm:to-[#0D0D0D]"
    >
      <div className="p-8 pt-16 sm:p-12 flex flex-col h-full sm:h-auto sm:max-w-md w-full sm:bg-[#121212]/80 sm:backdrop-blur-xl sm:border border-[#333] sm:rounded-3xl sm:shadow-2xl relative">
        <button
          onClick={onBack}
          className="absolute top-8 left-8 text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex flex-col items-center mt-8 mb-8">
          <div className="w-16 h-16 bg-[#FF8C00]/10 border border-[#FF8C00]/30 rounded-2xl flex items-center justify-center mb-4">
            {step === 1 ? <Mail size={30} className="text-[#FF8C00]" /> : <KeyRound size={30} className="text-[#FF8C00]" />}
          </div>
          <h2 className="text-2xl font-black italic text-[#FF8C00]">
            {step === 1 ? 'RECUPERAR SENHA' : 'NOVA SENHA'}
          </h2>
          <p className="text-gray-500 text-[11px] mt-1 font-black uppercase tracking-[0.2em] text-center">
            {step === 1
              ? 'Informe seu e-mail para receber o código'
              : `Código enviado para ${email}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-500 text-xs p-3 rounded-xl mb-4 border border-red-500/50">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 text-green-400 text-xs p-3 rounded-xl mb-4 border border-green-500/50">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <input
              type="email"
              placeholder="E-mail cadastrado"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-xl p-4 text-white outline-none transition-all focus:bg-[#222]"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF8C00] text-black font-black py-4 mt-2 rounded-xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(255,140,0,0.2)] hover:bg-[#FFA500] disabled:opacity-50"
            >
              <Mail size={18} strokeWidth={3} />
              {loading ? '...' : 'ENVIAR CÓDIGO'}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              type="text"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              maxLength={6}
              className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-xl p-4 text-white outline-none transition-all focus:bg-[#222] tracking-widest text-center text-lg font-bold"
            />
            <input
              type="password"
              placeholder="Nova Senha"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-xl p-4 text-white outline-none transition-all focus:bg-[#222]"
            />
            <input
              type="password"
              placeholder="Confirmar Nova Senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-xl p-4 text-white outline-none transition-all focus:bg-[#222]"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF8C00] text-black font-black py-4 mt-2 rounded-xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(255,140,0,0.2)] hover:bg-[#FFA500] disabled:opacity-50"
            >
              <KeyRound size={18} strokeWidth={3} />
              {loading ? '...' : 'REDEFINIR SENHA'}
            </motion.button>
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setSuccess(''); }}
              className="w-full text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors py-2"
            >
              Reenviar código
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
