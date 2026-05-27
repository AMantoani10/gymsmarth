import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./src/backend/routes";
import { verifyEmailConnection } from "./src/backend/services/EmailService";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // CORS — permite origens locais e dispositivos na rede (mobile)
  app.use(cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (Postman, server-side, mobile apps)
      if (!origin) return callback(null, true);
      // Permite localhost, rede local e Expo
      const allowed =
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.match(/^http:\/\/192\.168\.\d+\.\d+/) ||
        origin.match(/^http:\/\/10\.\d+\.\d+\.\d+/) ||
        origin.match(/^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/) ||
        origin.includes('expo');
      callback(null, !!allowed);
    },
    credentials: true,
  }));

  // Body parser com limite razoável
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting simples para API (previne abuso)
  const requestCounts = new Map<string, { count: number; resetAt: number }>();
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60_000; // 1 minuto
    const maxRequests = 100; // 100 requests por minuto por IP

    const entry = requestCounts.get(ip);
    if (!entry || now > entry.resetAt) {
      requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
      if (entry.count > maxRequests) {
        return res.status(429).json({ error: 'Muitas requisições. Tente novamente em breve.' });
      }
    }
    next();
  });

  // Verificação de variáveis de ambiente essenciais
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    console.error('💡 Verifique se o arquivo .env existe na raiz do projeto');
    process.exit(1);
  }

  // JWT_SECRET não pode ser o fallback padrão em produção
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'gym_smarth_secret_2024') {
    console.error('❌ JWT_SECRET está usando valor padrão em produção. Configure um segredo forte.');
    process.exit(1);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️  OPENROUTER_API_KEY não configurada — funcionalidades de IA estarão desabilitadas');
  }

  console.log('🔧 Configuração carregada:');
  console.log(`   📦 DATABASE: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`   🌐 APP_URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
  console.log(`   🤖 AI_MODEL: ${process.env.AI_MODEL || 'não definido'}`);
  console.log(`   🔑 JWT_SECRET: ${'*'.repeat(8)} (configurado)`);

  // --- API ROUTES ---
  app.use("/api", routes);

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online", 
      project: "Gym Smarth",
      database: "Prisma Configured",
      serverTime: new Date().toISOString()
    });
  });

  // Global Error Handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[Server Error]', err.message);
    // Não vazar stack trace em produção
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'Erro interno do servidor' 
        : err.message 
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🚀 Server Gym Smarth ready at http://localhost:${PORT}`);
    // Verifica credenciais de e-mail na inicialização
    await verifyEmailConnection();
  });
}

startServer().catch((err) => {
  console.error("Critical server error:", err);
});
