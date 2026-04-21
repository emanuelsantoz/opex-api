import type { NextApiRequest, NextApiResponse } from 'next';
import { idParamSchema, updateLancamentoSchema } from '../../../lib/validators.js'; // Adicione o schema de update
import { LancamentoService } from '../../../services/index.js';
import { getAuthUser } from '../../../middlewares/index.js';
import { successResponse, errorResponse } from '../../../lib/response.js';

const lancamentoService = new LancamentoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getAuthUser(req);
    const { id } = idParamSchema.parse(req.query);

    switch (req.method) {
      case 'GET':
        const lancamento = await lancamentoService.findById(id, user);
        return res.status(200).json(successResponse(lancamento));

      case 'PUT':
        // Apenas PLANEJADOR ou superior costuma editar
        const updateData = updateLancamentoSchema.parse(req.body);
        const atualizado = await lancamentoService.update(id, updateData, user);
        return res.status(200).json(successResponse(atualizado));

      case 'DELETE':
        await lancamentoService.delete(id, user);
        return res.status(200).json(successResponse({ message: 'Lançamento excluído com sucesso' }));

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}