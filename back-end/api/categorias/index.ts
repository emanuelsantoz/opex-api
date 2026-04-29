import type { NextApiRequest, NextApiResponse } from 'next';
import { CategoriaService, ProdutoService } from '../../services/index.js';
import { getAuthUser } from '../../middlewares/auth.js';
import { successResponse, errorResponse } from '../../lib/response.js';

const categoriaService = new CategoriaService();
const produtoService = new ProdutoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'x-user-id, x-user-area, x-user-perfil, content-type');
      return res.status(200).end(); // Aqui o guarda-costas (navegador) sorri e deixa o GET passar
    }

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

    if (tipo && tipo !== 'status_lancamento') {
      //const categoriaLancamento 
    }


    const categorias = await categoriaService.findAll(user);
    return res.status(200).json(successResponse(categorias));
  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}
