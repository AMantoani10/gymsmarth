/**
 * auth.ts — Middleware de Autenticação e Autorização
 *
 * Contém três middlewares:
 * - authMiddleware: Valida o token JWT do header Authorization
 *   e verifica se o usuário ainda existe (não foi excluído) no banco.
 *   Se válido, injeta os dados do usuário em req.user (id e role).
 * - isAdmin: Verifica se o usuário tem role 'ADMIN' (403 se não).
 * - hasRole: Middleware factory — aceita array de roles permitidas.
 *
 * Esses middlewares são usados nas rotas para proteger endpoints.
 * Ex: router.use(authMiddleware, isAdmin) → só admins acessam.
 *
 * REGRA DE NEGÓCIO: Alunos excluídos (deleted_at != null) recebem 401
 * mesmo que ainda possuam um token JWT válido, impedindo acesso ao app
 * até que uma nova conta seja criada pelo administrador.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface TokenPayload {
  id: string;
  role: 'ADMIN' | 'ALUNO';
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  const [, token] = authorization.split(' ');

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set' });
    }
    const decoded = jwt.verify(token, secret) as TokenPayload;

    // Verifica se o usuário ainda existe no banco e não foi excluído.
    // Isso garante que alunos deletados percam acesso imediatamente,
    // mesmo que seu token JWT ainda seja válido.
    const userExists = await prisma.user.findFirst({
      where: { id: decoded.id, deleted_at: null },
      select: { id: true }
    });

    if (!userExists) {
      return res.status(401).json({ error: 'Conta não encontrada ou desativada. Entre em contato com seu administrador.' });
    }

    // Injetando dados do usuário no Request
    req.user = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Requires Admin role' });
  }
  return next();
};

export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied: Requires one of ${roles.join(', ')}` });
    }
    return next();
  };
};
