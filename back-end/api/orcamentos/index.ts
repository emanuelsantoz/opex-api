import type { NextApiRequest, NextApiResponse } from 'next';
import { createOrcamentoSchema, listOrcamentosSchema } from '../../lib/validators.js';
import { OrcamentoService } from '../../services/index.js';
import { getAuthUser } from '../../middlewares/index.js';
import { successResponse, errorResponse } from '../../lib/response.js';

const orcamentoService = new OrcamentoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'x-user-id, x-user-area, x-user-perfil, content-type');
      return res.status(200).end(); // Aqui o guarda-costas (navegador) sorri e deixa o GET passar
    }

    if (req.method === 'POST') {
      const user = getAuthUser(req);

      const parseResult = createOrcamentoSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json(errorResponse(parseResult.error));
      }

      const orcamento = await orcamentoService.create(parseResult.data, user);
      console.log(orcamento)
      return res.status(201).json(successResponse(orcamento, 201));
    }

    if (req.method === 'GET') {
      const user = getAuthUser(req);

      const parseResult = listOrcamentosSchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json(errorResponse(parseResult.error));
      }

      const result = await orcamentoService.findAll(user, parseResult.data);
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