import type { NextApiRequest, NextApiResponse } from 'next';
import { UsuarioService } from '../../../services/index.js';
import { successResponse, withErrorHandler } from '../../../lib/response.js';
import { createUsuarioSchema, loginSchema } from '../../../lib/validators.js';
import { AuthUser } from '../../../types/index.js';

const usuarioService = new UsuarioService();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Resposta rápida para o pré-flight do CORS
  if (req.method === 'OPTIONS') {
    // 1. Headers de CORS - Essencial para o Navegador permitir o acesso
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id, x-user-area, x-user-perfil, x-user-superior');
    return res.status(200).end();
  }

  // Login via GET
  if (req.method === 'GET') {
    const validation = loginSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: validation.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    const { email, senha } = validation.data;
    const user = await usuarioService.login(email, senha);
    return res.status(200).json(successResponse(user));
  }

  // Cadastro via POST
  if (req.method === 'POST') {
    const validation = createUsuarioSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: validation.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    const user: AuthUser = {
      id: 1,
      idArea: 1,
      idPerfil: 1,
      idSuperior: null,
    };

    const novoUsuario = await usuarioService.create(validation.data, user);
    return res.status(201).json(successResponse(novoUsuario));
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Método não permitido',
    },
  });
}

export default withErrorHandler(handler);
