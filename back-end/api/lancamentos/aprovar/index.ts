import type { NextApiRequest, NextApiResponse } from 'next';
import { approveLancamentoSchema } from '../../../lib/validators';
import { AprovacaoService } from '../../../services';
import { getAuthUser } from '../../../middlewares';
import { successResponse, errorResponse } from '../../../lib/response';

const aprovacaoService = new AprovacaoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido' },
      });
    }

    const user = getAuthUser(req);

    const parseResult = approveLancamentoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(errorResponse(parseResult.error));
    }

    const lancamento = await aprovacaoService.approve(parseResult.data, user);
    return res.status(200).json(successResponse(lancamento));
  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}
