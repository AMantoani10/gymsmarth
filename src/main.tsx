/**
 * main.tsx — Entry point do frontend React
 *
 * Este arquivo monta a aplicação React no elemento #root do index.html.
 * Envolve o App com:
 * - StrictMode: Ativa verificações extras em desenvolvimento
 * - AuthProvider: Fornece estado global de autenticação (Context API)
 */
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
