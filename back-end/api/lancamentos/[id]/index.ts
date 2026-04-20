import type { NextApiRequest, NextApiResponse } from 'next';
import { idParamSchema } from '../../../lib/validators';
import { LancamentoService } from '../../../services';
import { getAuthUser } from '../../../middlewares';
import { successResponse, errorResponse } from '../../../lib/response';

const lancamentoService = new LancamentoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido' },
      });
    }

    const user = getAuthUser(req);

    const parseResult = idParamSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json(errorResponse(parseResult.error));
    }

    const lancamento = await lancamentoService.findById(parseResult.data.id, user);
    return res.status(200).json(successResponse(lancamento));
  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}
