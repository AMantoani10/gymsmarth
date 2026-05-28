# 🏋️ Gym Smarth

Sistema completo para gestão de academia com análise de treinos via IA e controle de usuários.
Inclui painel Web para administradores e aplicativo Mobile para alunos/administradores.

---

## 📚 Tecnologias Utilizadas

### Linguagem

| Tecnologia | Descrição |
|---|---|
| **TypeScript** | Superset do JavaScript que adiciona **tipagem estática**. Ajuda a encontrar erros antes de executar o código, melhora o autocomplete no editor e torna o código mais legível. Usado em todo o projeto (backend, frontend e mobile). |

### Backend

| Tecnologia | O que é | Para que serve no projeto |
|---|---|---|
| **Node.js** | Runtime JavaScript do lado do servidor (motor V8 do Chrome). | Permite rodar JavaScript/TypeScript fora do navegador. É o "motor" que roda o servidor. |
| **Express** | Framework web minimalista para Node.js. | Gerencia rotas HTTP (`GET /api/students`, `POST /api/auth/login`, etc.), middlewares e tratamento de erros. |
| **Prisma ORM** | Ferramenta de acesso a banco de dados com tipagem automática. ORM = Object-Relational Mapping — traduz objetos TypeScript para consultas SQL automaticamente. | Substitui queries SQL manuais. Ex: `prisma.user.create({ data: {...} })` gera o SQL automaticamente. |
| **PostgreSQL** | Banco de dados relacional robusto e open-source. | Armazena todos os dados: usuários, planos, treinos, exames, logs. Suporta tipos como JSON nativo, UUID e Decimal. |
| **JWT (jsonwebtoken)** | Padrão para criar tokens de autenticação seguros. JSON Web Token. | Gera e valida tokens que identificam o usuário logado. O token viaja no header `Authorization: Bearer <token>` a cada requisição. |
| **bcryptjs** | Biblioteca de hashing de senhas. | Transforma senhas em hashes irreversíveis antes de salvar no banco. Nunca armazenamos a senha original. |
| **Zod** | Biblioteca de validação de dados com tipagem TypeScript automática. | Valida dados de entrada (body das requisições). Ex: garante que o email é válido, que a senha tem 6+ caracteres. |
| **Nodemailer** | Biblioteca para envio de e-mails via Node.js. | Envia e-mails de boas-vindas e de recuperação de senha via Gmail SMTP. |
| **dotenv** | Carrega variáveis de ambiente do arquivo `.env`. | Permite configurar secrets (senhas, chaves de API) sem hardcoded no código. |
| **tsx** | Executor TypeScript para Node.js, sem necessidade de compilação. | Roda `server.ts` diretamente, sem passo de build. Equivalente ao `ts-node`, mas mais rápido. |
| **CORS** | Middleware para Cross-Origin Resource Sharing. | Permite que o app mobile (em outra origem/IP) faça requisições ao servidor. |

### Frontend Web

| Tecnologia | O que é | Para que serve no projeto |
|---|---|---|
| **React** | Biblioteca para construir interfaces de usuário com componentes reutilizáveis. | Todo o frontend web é construído com React — cada tela (Login, Dashboard Admin, Dashboard Aluno) é um componente React. |
| **Vite** | Bundler e dev server ultrarrápido para projetos web modernos. | Serve o frontend em desenvolvimento com Hot Module Replacement (HMR) — quando você salva um arquivo, a tela atualiza instantaneamente sem recarregar a página. |
| **TailwindCSS v4** | Framework CSS utility-first. Em vez de criar classes CSS, você compõe estilos diretamente no HTML com classes como `bg-red-500`, `p-4`, `rounded-xl`. | Estiliza todos os componentes web. Permite prototipagem rápida e design consistente. |
| **Motion (Framer Motion)** | Biblioteca de animações para React. | Cria transições suaves entre telas, animações de entrada/saída (fade-in, slide-up) e micro-interações (hover effects). |
| **Lucide React** | Biblioteca de ícones SVG leves e personalizáveis. | Fornece todos os ícones usados na interface (lupa, sino, logout, etc.). |

### Mobile

| Tecnologia | O que é | Para que serve no projeto |
|---|---|---|
| **React Native** | Framework para construir apps nativos usando React. O mesmo código gera apps para Android e iOS. | Toda a interface mobile é construída com React Native. |
| **Expo** | Plataforma e toolchain que simplifica o desenvolvimento React Native. | Facilita o setup, build e teste do app mobile. Roda com `npx expo start`. |
| **React Navigation** | Biblioteca de navegação para React Native. | Gerencia a navegação entre telas (Login → Dashboard → Treinos). |
| **AsyncStorage** | Armazenamento local key-value para React Native. | Salva o token JWT e dados do usuário localmente no dispositivo (equivalente ao `localStorage` da web). |
| **Expo Vector Icons (Feather)** | Biblioteca de ícones vetoriais para React Native. | Fornece ícones para a interface mobile. |

### Ferramentas de Desenvolvimento

| Tecnologia | O que é | Para que serve no projeto |
|---|---|---|
| **Git** | Sistema de controle de versão distribuído. | Rastreia mudanças no código. Permite colaboração e histórico de versões. |
| **npm** | Gerenciador de pacotes do Node.js. | Instala e gerencia dependências (bibliotecas) do projeto. |

### API Externa

| Serviço | O que é | Para que serve no projeto |
|---|---|---|
| **OpenRouter** | Gateway para múltiplos modelos de IA (GPT, Claude, LLaMA, etc.). | Analisa exames médicos enviados pelos alunos e gera sugestões de treino personalizadas. A IA identifica restrições físicas e adapta exercícios. |

---

## 🏗️ Arquitetura do Projeto

O projeto segue o padrão **MVC** (Model-View-Controller) adaptado para API REST:

```
┌──────────────────────────────────────────────────────┐
│                    CLIENTE                           │
│  ┌────────────┐    ┌──────────────────────────────┐  │
│  │ Mobile App │    │ Frontend Web (React + Vite)  │  │
│  │  (Expo)    │    │ AdminDashboard / StudentDash │  │
│  └─────┬──────┘    └────────────┬─────────────────┘  │
│        │  HTTP/REST             │  Mesmo processo    │
│        │  (via API)             │  (Vite middleware)  │
└────────┼────────────────────────┼────────────────────┘
         │                        │
┌────────┼────────────────────────┼────────────────────┐
│        ▼                        ▼                    │
│  ┌──────────────────────────────────────────────┐    │
│  │            Express Server (server.ts)         │    │
│  │  ┌────────┐  ┌───────────┐  ┌─────────────┐  │    │
│  │  │ Routes │→ │Controllers│→ │  Services   │  │    │
│  │  └────────┘  └───────────┘  └──────┬──────┘  │    │
│  │                                     │         │    │
│  │  ┌────────────┐  ┌─────────────────┐│         │    │
│  │  │Middlewares │  │  Repositories   ││         │    │
│  │  │ (auth.ts)  │  │ (Prisma ORM)   ││         │    │
│  │  └────────────┘  └────────┬────────┘│         │    │
│  │                           │         │         │    │
│  │                   ┌───────┴─────────┴───┐     │    │
│  │                   │   PostgreSQL DB     │     │    │
│  │                   └─────────────────────┘     │    │
│  │                                                │    │
│  │  ┌──────────────┐                             │    │
│  │  │ OpenRouter   │ ← AIService.ts              │    │
│  │  │ (IA externa) │                             │    │
│  │  └──────────────┘                             │    │
│  └──────────────────────────────────────────────┘    │
│                    SERVIDOR                          │
└──────────────────────────────────────────────────────┘
```

**Fluxo de uma requisição:**
1. O cliente (web ou mobile) faz uma requisição HTTP (ex: `POST /api/auth/login`)
2. O **Express Router** direciona para a rota correta (`auth.routes.ts`)
3. O **Middleware de autenticação** (`auth.ts`) valida o token JWT (se necessário)
4. O **Controller** recebe a requisição e valida os dados com **Zod**
5. O **Service** executa a lógica de negócio
6. O **Repository** ou **Prisma** acessa o banco de dados
7. A resposta volta pelo mesmo caminho até o cliente

---

## 📁 Estrutura do Projeto — Descrição de Cada Arquivo

```
gym-smarth/
├── server.ts                    # Entry point — Configura e inicia Express + Vite dev server
├── index.html                   # Ponto de entrada HTML — Carrega o React (SPA)
├── vite.config.ts               # Configuração do bundler Vite + plugin TailwindCSS e React
├── tsconfig.json                # Configuração do compilador TypeScript (target, paths, etc.)
├── .env.example                 # Template de variáveis de ambiente (copie para .env)
├── .gitignore                   # Arquivos ignorados pelo Git (node_modules, .env, etc.)
├── package.json                 # Dependências, scripts npm e metadados do projeto
├── replace.py                   # Script utilitário Python (migração de ícones emoji → Feather)
│
├── prisma/
│   └── schema.prisma            # Schema do banco de dados — Define tabelas, campos e relações
│
├── src/
│   ├── @types/
│   │   └── express.d.ts         # Augmentação de tipos do Express — Adiciona `req.user`
│   │
│   ├── backend/                 # ══════ BACKEND (API REST) ══════
│   │   │
│   │   ├── controllers/         # Camada Controller — Recebe HTTP, valida, delega e responde
│   │   │   ├── AuthController.ts       # Login, registro admin, esqueci senha, redefinir senha
│   │   │   ├── ExamController.ts       # Envio e análise de exames médicos por IA
│   │   │   ├── LogController.ts        # Lista logs de atividade do admin
│   │   │   ├── NotificationController.ts # Lista e gerencia notificações (exames + feedbacks)
│   │   │   ├── PlanController.ts       # CRUD de planos de matrícula
│   │   │   ├── StudentController.ts    # CRUD de alunos + renovação de matrícula
│   │   │   ├── TrainingController.ts   # Consulta treinos do aluno + registro de sessão e carga
│   │   │   ├── TreinoController.ts     # CRUD de treinos (admin) com sessões e exercícios
│   │   │   └── WorkoutController.ts    # Sugestão de treino inteligente via IA
│   │   │
│   │   ├── services/            # Camada Service — Lógica de negócios e integrações externas
│   │   │   ├── AIService.ts     # Integração OpenRouter (análise de exames + geração de treinos)
│   │   │   ├── AuthService.ts   # Login, registro, recuperação de senha (JWT + bcrypt)
│   │   │   ├── EmailService.ts  # Envio de e-mails (boas-vindas + recuperação de senha)
│   │   │   └── LogService.ts    # Registra ações do admin em log de atividade
│   │   │
│   │   ├── routes/              # Definição de rotas — Liga URLs a Controllers
│   │   │   ├── index.ts         # Agregador central de todas as rotas
│   │   │   ├── admin.routes.ts  # Rotas protegidas do admin (alunos, planos, treinos, exames)
│   │   │   ├── auth.routes.ts   # Rotas de autenticação (login, registro, perfil)
│   │   │   ├── exam.routes.ts   # Rotas de exames do aluno (enviar e listar)
│   │   │   ├── training.routes.ts # Rotas de treino do aluno (próxima sessão, log, carga)
│   │   │   └── workout.routes.ts  # Rota de sugestão de treino via IA (admin)
│   │   │
│   │   ├── middlewares/         # Middlewares Express — Interceptam antes do Controller
│   │   │   └── auth.ts          # Autenticação JWT + verificação de role (Admin/Aluno)
│   │   │
│   │   ├── repositories/        # Camada Repository — Encapsula queries Prisma
│   │   │   ├── UserRepository.ts     # Busca e criação de usuários genéricos
│   │   │   └── StudentRepository.ts  # Listagem e busca de alunos com includes
│   │   │
│   │   ├── schemas/             # Schemas Zod — Validação de dados de entrada
│   │   │   ├── auth.schema.ts   # Validação de login, registro e forgot-password
│   │   │   └── admin.schema.ts  # Validação de criação de alunos e planos
│   │   │
│   │   └── lib/                 # Utilitários compartilhados do backend
│   │       ├── prisma.ts        # Instância singleton do Prisma Client
│   │       └── errorHandler.ts  # Tratamento centralizado de erros Zod + genéricos
│   │
│   ├── views/                   # ══════ FRONTEND WEB (React SPA) ══════
│   │   ├── AdminDashboard.tsx   # Painel do administrador (alunos, planos, treinos, notificações)
│   │   ├── StudentDashboard.tsx # Painel do aluno (treinos, exames, configurações)
│   │   ├── LoginView.tsx        # Tela de login com animações
│   │   ├── RegisterAdminView.tsx # Tela de cadastro de administrador
│   │   └── ForgotPasswordView.tsx # Tela de recuperação de senha (2 etapas)
│   │
│   ├── context/                 # React Contexts — Estado global compartilhado
│   │   └── AuthContext.tsx      # Gerencia autenticação (user, token, login, logout)
│   │
│   ├── App.tsx                  # Componente raiz — Roteamento entre Login/Admin/Aluno
│   ├── main.tsx                 # Entry point React — Monta o React no DOM
│   └── index.css                # Estilos globais — Import TailwindCSS + resets
│
└── mobile/                      # ══════ APP MOBILE (React Native + Expo) ══════
    ├── App.tsx                  # Componente raiz mobile — Navigation + AuthProvider
    ├── index.ts                 # Entry point Expo — Registra o componente raiz
    ├── app.json                 # Configuração Expo (nome, versão, splash screen)
    ├── package.json             # Dependências do app mobile
    ├── tsconfig.json            # TypeScript config mobile
    └── src/
        ├── screens/             # Telas do app mobile
        │   ├── LoginScreen.tsx         # Tela de login mobile
        │   ├── RegisterAdminScreen.tsx # Cadastro de admin mobile
        │   ├── ForgotPasswordScreen.tsx # Recuperação de senha mobile
        │   ├── AdminHomeScreen.tsx     # Dashboard admin mobile (com tabs)
        │   ├── StudentHomeScreen.tsx   # Dashboard aluno mobile
        │   └── tabs/                   # Sub-telas (tabs) do admin
        │       ├── StudentsTab.tsx     # Aba de gestão de alunos
        │       ├── PlansTab.tsx        # Aba de gestão de planos
        │       ├── WorkoutsTab.tsx     # Aba de gestão de treinos
        │       └── NotificationsTab.tsx # Aba de notificações
        ├── components/          # Componentes reutilizáveis mobile
        │   ├── ConfirmDialog.tsx # Modal de confirmação (Sim/Não)
        │   ├── FormModal.tsx     # Modal genérico de formulário
        │   └── SelectPicker.tsx  # Componente de seleção (dropdown nativo)
        ├── contexts/
        │   └── AuthContext.tsx   # Estado global de autenticação mobile
        ├── navigation/
        │   └── AppNavigator.tsx  # Configuração de rotas/telas (React Navigation)
        └── services/
            └── api.ts           # Camada de API — Funções que chamam o backend
```

---

## 🗃️ Modelos do Banco de Dados (Prisma Schema)

| Modelo | Tabela SQL | Descrição |
|---|---|---|
| `User` | `users` | Usuários do sistema (Admin ou Aluno). Contém nome, email, senha (hash), role, e vínculos com planos, treinos e exames. |
| `Plano` | `planos` | Planos de matrícula da academia (ex: "Mensal", "Trimestral"). Possui nome, duração e valor. |
| `Matricula` | `matriculas` | Vínculo entre um aluno e um plano. Controla datas de início/vencimento e status de pagamento. |
| `Treino` | `treinos` | Programa de treino atribuído a um aluno. Contém nome, objetivo e datas de vigência. |
| `SessaoTreino` | `sessoes_treino` | Sessão dentro de um treino (ex: "Treino A - Peito", "Treino B - Costa"). Contém lista de exercícios em JSON. |
| `LogTreino` | `logs_treino` | Registro de conclusão de sessão pelo aluno, com duração e feedback opcional. |
| `ExameIA` | `exames_ia` | Exame médico analisado pela IA. Armazena a análise completa e restrições detectadas em JSON. |
| `LogAtividade` | `logs_atividade` | Log de auditoria das ações do admin (criar aluno, editar treino, etc.). |
| `Exercicio` | `exercicios` | Catálogo global de exercícios (usado como autocomplete ao criar treinos). |
| `HistoricoCarga` | `historico_cargas` | Histórico de cargas por exercício por aluno (progressão ao longo do tempo). |

---

## 🚀 Como Rodar

### Pré-requisitos

- **Node.js** v18+ ([download](https://nodejs.org/))
- **PostgreSQL** v14+ ([download](https://www.postgresql.org/download/))
- **npm** (vem com o Node.js)

### Servidor Web (Backend + Frontend)

```bash
# 1. Instale as dependências
npm install

# 2. Configure o ambiente
cp .env.example .env
# Edite o .env com suas credenciais reais (DATABASE_URL, JWT_SECRET, etc.)

# 3. Configure o banco de dados
npx prisma migrate dev

# 4. Inicie o servidor (backend + frontend juntos)
npm run dev
# → Acesse http://localhost:3000
```

### App Mobile

```bash
# 1. Acesse a pasta mobile
cd mobile

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Abra o arquivo mobile/.env e coloque o IP da sua máquina na rede local
# Ex: EXPO_PUBLIC_API_URL=http://192.168.1.100:3000

# 4. Inicie o Expo
npx expo start

# 5. Escaneie o QR Code com o app Expo Go (Android/iOS)
```

---

## 🔒 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL (ex: `postgresql://user:pass@localhost:5432/gymsmarth`) | ✅ |
| `JWT_SECRET` | Chave secreta para assinatura de tokens JWT | ✅ |
| `EMAIL_USER` | Email Gmail para envio de e-mails (boas-vindas e recuperação) | ⚠️ (funcionalidades de e-mail) |
| `EMAIL_PASS` | Senha de App do Gmail (16 caracteres, gerada em https://myaccount.google.com/apppasswords) | ⚠️ (funcionalidades de e-mail) |
| `OPENROUTER_API_KEY` | Chave da API OpenRouter para IA (https://openrouter.ai/keys) | ⚠️ (funcionalidades de IA) |
| `AI_MODEL` | Modelo de IA do OpenRouter | Não (padrão: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`) |
| `APP_URL` | URL base do servidor | Não (padrão: `http://localhost:3000`) |

---

## 🤖 Integração com IA

O sistema usa **OpenRouter** para:
1. **Análise de Exames Médicos**: O aluno envia um laudo/descrição e a IA identifica diagnósticos, restrições de movimento e nível de alerta.
2. **Geração de Treinos Personalizados**: O admin solicita e a IA gera uma sessão de treino respeitando as restrições médicas do aluno.

O serviço é implementado em `src/backend/services/AIService.ts`.

---

## 📐 Padrões de Projeto Utilizados

| Padrão | Onde | Explicação |
|---|---|---|
| **MVC** | Backend inteiro | Model (Prisma), View (React), Controller (Controllers) |
| **Repository Pattern** | `repositories/` | Isola o acesso a dados do Prisma dos Controllers |
| **Singleton** | `lib/prisma.ts` | Uma única instância do Prisma Client para toda a aplicação |
| **Context Pattern** | `context/AuthContext.tsx` | Estado global de autenticação compartilhado via React Context |
| **Middleware Chain** | `middlewares/auth.ts` | Intercepta requisições antes do Controller (autenticação, autorização) |
| **Schema Validation** | `schemas/*.ts` | Valida dados de entrada antes de processar (fail-fast) |
| **Soft Delete** | Schema Prisma | Registros não são apagados — recebem `deleted_at` para manter histórico |
| **Fire-and-Forget** | `LogService.ts` | Logs de atividade são gravados sem bloquear a resposta ao cliente |

---

## 📝 Scripts Disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor Express + Vite (desenvolvimento) |
| `npm run build` | Gera o bundle de produção do frontend |
| `npm run start` | Inicia o servidor (mesmo que dev, usa tsx) |
| `npm run lint` | Verifica erros TypeScript sem gerar arquivos |
| `npx prisma migrate dev` | Aplica migrações pendentes ao banco |
| `npx prisma studio` | Abre interface visual do banco de dados |
| `npx prisma generate` | Regenera o Prisma Client após mudar o schema |
