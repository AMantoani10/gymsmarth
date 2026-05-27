/**
 * express.d.ts — Augmentação de tipos do Express
 *
 * Adiciona a propriedade `user` ao objeto Request do Express.
 * Sem isso, TypeScript reclamaria de `req.user` nos controllers e middlewares.
 *
 * Depois que o middleware auth.ts decodifica o JWT, ele injeta { id, role }
 * em req.user — esta declaração informa o TypeScript dessa propriedade.
 */
declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      role: 'ADMIN' | 'ALUNO';
    };
  }
}
