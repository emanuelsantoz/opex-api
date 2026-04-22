import { VercelRequest, VercelResponse } from '@vercel/node';
import { createLancamentoSchema, listLancamentosSchema } from '../../lib/validators.js';
import { LancamentoService } from '../../services/LancamentoService.js';
import { getAuthUser } from '../../middlewares/auth.js';
import { successResponse, errorResponse } from '../../lib/response.js';

const lancamentoService = new LancamentoService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const user = getAuthUser(req);

      const parseResult = createLancamentoSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json(errorResponse(parseResult.error));
      }

      const lancamento = await lancamentoService.create(parseResult.data, user);
      return res.status(201).json(successResponse(lancamento, 201));
    }

    if (req.method === 'GET') {
      const user = getAuthUser(req);

      const parseResult = listLancamentosSchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json(errorResponse(parseResult.error));
      }

      const result = await lancamentoService.findAll(user, parseResult.data);
      return res.status(200).json(successResponse(result));
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido' },
    });
  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}