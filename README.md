# 🏋️ Gym Smarth

Sistema completo para gestão de academia com análise de treinos via IA e controle de usuários.

## 📁 Estrutura do Projeto

```
gym-smarth/
├── server.ts                    # Entry point — Express + Vite dev server
├── index.html                   # SPA entry — carrega o frontend React
├── vite.config.ts               # Configuração Vite + Tailwind
├── tsconfig.json                # TypeScript config
├── .env.example                 # Template de variáveis de ambiente
├── package.json                 # Dependências e scripts
│
├── prisma/
│   └── schema.prisma            # Schema do banco de dados (PostgreSQL)
│
├── src/
│   ├── @types/                  # Type declarations (Express augmentation)
│   │   └── express.d.ts
│   │
│   ├── backend/                 # ══════ BACKEND (API REST) ══════
│   │   ├── controllers/         # Lógica dos endpoints HTTP
│   │   │   ├── AuthController.ts
│   │   │   ├── ExamController.ts
│   │   │   ├── LogController.ts
│   │   │   ├── NotificationController.ts
│   │   │   ├── PlanController.ts
│   │   │   ├── StudentController.ts
│   │   │   ├── TrainingController.ts
│   │   │   ├── TreinoController.ts
│   │   │   └── WorkoutController.ts
│   │   │
│   │   ├── services/            # Lógica de negócios e integrações
│   │   │   ├── AIService.ts     # Integração OpenRouter (análise IA)
│   │   │   ├── AuthService.ts   # Autenticação (JWT + bcrypt)
│   │   │   └── LogService.ts    # Log de atividades admin
│   │   │
│   │   ├── routes/              # Definição de rotas Express
│   │   │   ├── index.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── exam.routes.ts
│   │   │   ├── training.routes.ts
│   │   │   └── workout.routes.ts
│   │   │
│   │   ├── middlewares/         # Middlewares Express
│   │   │   └── auth.ts          # JWT auth + role-based access
│   │   │
│   │   ├── repositories/        # Camada de acesso a dados (Prisma)
│   │   │   ├── UserRepository.ts
│   │   │   └── StudentRepository.ts
│   │   │
│   │   ├── schemas/             # Validação de dados (Zod)
│   │   │   ├── auth.schema.ts
│   │   │   └── admin.schema.ts
│   │   │
│   │   └── lib/                 # Utilitários compartilhados
│   │       ├── prisma.ts        # Singleton Prisma Client
│   │       └── errorHandler.ts  # Tratamento centralizado de erros
│   │
│   ├── views/                   # ══════ FRONTEND (React SPA) ══════
│   │   ├── AdminDashboard.tsx   # Dashboard do administrador
│   │   ├── StudentDashboard.tsx # Dashboard do aluno
│   │   ├── LoginView.tsx        # Tela de login
│   │   └── RegisterAdminView.tsx# Tela de cadastro admin
│   │
│   ├── context/                 # React Contexts
│   │   └── AuthContext.tsx      # Estado global de autenticação
│   │
│   ├── App.tsx                  # Componente raiz do React
│   ├── main.tsx                 # Entry point do React
│   └── index.css                # Estilos globais
│
└── mobile/                      # ══════ APP MOBILE (React Native) ══════
    ├── tsconfig.json
    └── src/
        ├── screens/
        │   └── LoginScreen.tsx
        ├── contexts/
        │   └── AuthContext.tsx
        └── navigation/
            └── AppNavigator.tsx
```

## 🚀 Como Rodar

```bash
# 1. Instale as dependências
npm install

# 2. Configure o ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 3. Configure o banco de dados
npx prisma migrate dev

# 4. Inicie o servidor (backend + frontend)
npm run dev
```

## 🔒 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL | ✅ |
| `JWT_SECRET` | Chave secreta para tokens JWT | ✅ |
| `OPENROUTER_API_KEY` | Chave da API OpenRouter para IA | ⚠️ (funcionalidades IA) |
| `AI_MODEL` | Modelo de IA no OpenRouter | Não (tem padrão) |
| `APP_URL` | URL base do servidor | Não (padrão: localhost:3000) |

## 🤖 Integração com IA

O sistema usa **OpenRouter** para análise inteligente de exames médicos e geração de sugestões de treino personalizadas. O serviço é implementado em `src/backend/services/AIService.ts`.
