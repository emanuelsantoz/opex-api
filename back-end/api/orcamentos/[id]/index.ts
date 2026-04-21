import type { NextApiRequest, NextApiResponse } from 'next';
import { idParamSchema, updateOrcamentoSchema } from '../../../lib/validators';
import { OrcamentoService } from '../../../services';
import { getAuthUser } from '../../../middlewares';
import { successResponse, errorResponse } from '../../../lib/response';

const orcamentoService = new OrcamentoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const parseIdResult = idParamSchema.safeParse(req.query);
    if (!parseIdResult.success) {
      return res.status(400).json(errorResponse(parseIdResult.error));
    }

    const { id } = parseIdResult.data;

    if (req.method === 'GET') {
      const user = getAuthUser(req);
      const orcamento = await orcamentoService.findById(id, user);
      return res.status(200).json(successResponse(orcamento));
    }

    if (req.method === 'PUT') {
      const user = getAuthUser(req);

      const parseResult = updateOrcamentoSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json(errorResponse(parseResult.error));
      }

      const orcamento = await orcamentoService.update(id, parseResult.data, user);
      return res.status(200).json(successResponse(orcamento));
    }

    if (req.method === 'DELETE') {
      const user = getAuthUser(req);
      const orcamento = await orcamentoService.delete(id, user);
      return res.status(200).json(successResponse(orcamento));
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido' },
    });
  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}