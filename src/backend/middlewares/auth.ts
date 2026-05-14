import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: 'ADMIN' | 'ALUNO';
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
