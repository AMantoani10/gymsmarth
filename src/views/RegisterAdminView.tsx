import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';

interface Props {
  onBack: () => void;
  onRegister: (nome: string, email: string, pass: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function RegisterAdminView({ onBack, onRegister, loading, error }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setLocalError('As senhas não coincidem');
      return;
    }
    if (password.length < 6) {
      setLocalError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    setLocalError('');
    await onRegister(nome, email, password);
  };

  const displayError = localError || error;

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
          className="absolute top-8 left-8 text-gray-500 hover:text-white"
        >
        <ArrowLeft size={24} />
      </button>

      <div className="flex flex-col items-center mt-8 mb-8">
        <h2 className="text-2xl font-black italic text-[#FF8C00]">NOVO ADMIN</h2>
        <p className="text-gray-500 text-[10px] mt-1 font-black uppercase tracking-[0.2em]">
          Gerencie sua academia
        </p>
      </div>

      {displayError && (
        <div className="bg-red-500/20 text-red-500 text-xs p-3 rounded-xl mb-4 border border-red-500/50">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" 
          placeholder="Nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
          className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-xl p-4 text-white outline-none transition-all"
        />
        <input 
          type="email" 
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-xl p-4 text-white outline-none transition-all"
        />
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-xl p-4 text-white outline-none transition-all"
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Confirmar Senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-xl p-4 text-white outline-none transition-all"
          />
        </div>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF8C00] text-black font-black py-4 mt-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(255,140,0,0.2)] hover:bg-[#FFA500] disabled:opacity-50"
        >
          <UserPlus size={18} strokeWidth={3} />
          {loading ? '...' : 'CRIAR CONTA'}
        </motion.button>
      </form>
      </div>
    </motion.div>
  );
}
