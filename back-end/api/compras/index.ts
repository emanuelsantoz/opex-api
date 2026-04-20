import type { NextApiRequest, NextApiResponse } from 'next';
import { createCompraSchema } from '../lib/validators';
import { CompraService } from '../services';
import { getAuthUser } from '../middlewares';
import { successResponse, errorResponse } from '../lib/response';

const compraService = new CompraService();

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

    const parseResult = createCompraSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(errorResponse(parseResult.error));
    }

    const compra = await compraService.create(parseResult.data, user);
    return res.status(201).json(successResponse(compra, 201));
  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}
