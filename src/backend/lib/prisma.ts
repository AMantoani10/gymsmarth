import { PrismaClient } from "@prisma/client";

// Singleton do Prisma Client com log de conexão
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Testa a conexão ao iniciar
prisma.$connect()
  .then(() => console.log('✅ Prisma conectado ao PostgreSQL com sucesso'))
  .catch((err: Error) => {
    console.error('❌ Falha na conexão com o PostgreSQL:', err.message);
    console.error('💡 Verifique se o PostgreSQL está rodando e se a DATABASE_URL no .env está correta');
    process.exit(1);
  });
