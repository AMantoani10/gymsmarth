/**
 * vite.config.ts — Configuração do bundler Vite
 *
 * O Vite é responsável por servir o frontend React em desenvolvimento (com HMR)
 * e gerar o bundle otimizado para produção.
 *
 * Plugins:
 * - @vitejs/plugin-react: Suporte a JSX/TSX e Fast Refresh
 * - @tailwindcss/vite: Integração direta do TailwindCSS v4
 *
 * Alias '@' aponta para a raiz do projeto para imports simplificados.
 */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    // Não expor variáveis sensíveis do backend no frontend
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
