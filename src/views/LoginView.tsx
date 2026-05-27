import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Dumbbell, Eye, EyeOff, LogIn } from 'lucide-react';

interface Props {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
  error?: string;
  loading?: boolean;
}

export function LoginView({ onLogin, onRegisterClick, onForgotPasswordClick, error, loading }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex flex-col h-full bg-[#121212] overflow-y-auto sm:justify-center sm:items-center sm:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] sm:from-[#1e1e1e] sm:to-[#0D0D0D]"
    >
      <div className="p-8 pt-20 sm:p-12 flex flex-col h-full sm:h-auto sm:max-w-md w-full sm:bg-[#121212]/80 sm:backdrop-blur-xl sm:border border-[#333] sm:rounded-3xl sm:shadow-2xl">
        {error && (
          <div className="bg-red-500/20 text-red-500 text-xs p-3 rounded-xl mb-4 border border-red-500/50">
            {error}
          </div>
        )}
        
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-20 h-20 bg-[#FF8C00] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,140,0,0.4)] mb-4"
          >
            <Dumbbell size={40} color="#000" strokeWidth={3} />
          </motion.div>
          <h1 className="text-4xl font-black italic tracking-tighter text-[#FF8C00]">
            GYM <span className="text-white">SMARTH</span>
          </h1>
          <p className="text-gray-500 text-[10px] mt-2 font-black uppercase tracking-[0.3em]">
            Você no Controle
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input 
              type="email" 
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-2xl p-5 text-white outline-none transition-all focus:bg-[#222]"
            />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#1A1A1A] border-2 border-transparent focus:border-[#FF8C00] rounded-2xl p-5 text-white outline-none transition-all focus:bg-[#222]"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF8C00] text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(255,140,0,0.2)] hover:bg-[#FFA500] disabled:opacity-50"
          >
            <LogIn size={20} strokeWidth={3} />
            {loading ? '...' : 'ENTRAR NA ARENA'}
          </motion.button>
        </form>

        <div className="mt-auto sm:mt-8 pb-4 flex flex-col items-center gap-3 pt-8">
          <button 
            onClick={onRegisterClick}
            className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            Criar Conta de Administrador
          </button>
          <button 
            onClick={onForgotPasswordClick}
            className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
          >
            Esqueci minha senha
          </button>
        </div>
      </div>
    </motion.div>
  );
}
