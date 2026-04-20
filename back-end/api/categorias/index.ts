import type { NextApiRequest, NextApiResponse } from 'next';
import { CategoriaService, ProdutoService } from '../../services';
import { getAuthUser } from '../../middlewares';
import { successResponse, errorResponse } from '../../lib/response';

const categoriaService = new CategoriaService();
const produtoService = new ProdutoService();

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
    const { tipo, idCategoria } = req.query;

    if (tipo === 'produtos') {
      // Para:
      const produtos = await produtoService.findAll(
        user,
        idCategoria ? Number(idCategoria) : undefined
      );
      return res.status(200).json(successResponse(produtos));
    }

    const categorias = await categoriaService.findAll(user);
    return res.status(200).json(successResponse(categorias));
  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}
