/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './views/LoginView';
import { RegisterAdminView } from './views/RegisterAdminView';
import { AdminDashboard } from './views/AdminDashboard';
import { StudentDashboard } from './views/StudentDashboard';

export default function App() {
  const { user, token, login, logout } = useAuth();
  
  const [view, setView] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (email: string, senha: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }
      
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAdmin = async (nome: string, email: string, senha: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar admin');
      }
      
      // Auto login in after creation
      await handleLogin(email, senha);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center font-sans tracking-tight">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full h-screen ${
          user?.role === 'ADMIN' 
            ? 'sm:w-full sm:max-w-full sm:h-screen sm:rounded-none' 
            : user?.role === 'ALUNO'
              ? 'sm:h-auto sm:min-h-[800px] sm:max-w-[380px] sm:rounded-[3.5rem] sm:border-8 sm:border-[#1E1E1E]'
              : 'sm:h-auto sm:min-h-[800px] sm:max-w-4xl sm:rounded-3xl' // Login/Register
        } bg-[#121212] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col transition-all duration-500`}
      >
        {user?.role !== 'ADMIN' && user && (
          <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1E1E1E] rounded-b-2xl z-20" />
        )}

        <AnimatePresence mode="wait">
          {!user ? (
            view === 'login' ? (
              <motion.div key="login" className="w-full h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoginView onLogin={handleLogin} onRegisterClick={() => { setView('register'); setError(''); }} error={error} loading={loading} />
              </motion.div>
            ) : (
              <motion.div key="register" className="w-full h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RegisterAdminView onBack={() => { setView('login'); setError(''); }} onRegister={handleRegisterAdmin} loading={loading} error={error} />
              </motion.div>
            )
          ) : user.role === 'ADMIN' ? (
             <motion.div key="admin" className="w-full h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <AdminDashboard onLogout={logout} user={user} token={token || ''} />
             </motion.div>
          ) : (
             <motion.div key="student" className="w-full h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <StudentDashboard onLogout={logout} user={user} token={token || ''} />
             </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

