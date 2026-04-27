import type { NextApiRequest, NextApiResponse } from 'next';
import { CategoriaService, ProdutoService } from '../../services/index.js';
import { getAuthUser } from '../../middlewares/auth.js';
import { successResponse, errorResponse } from '../../lib/response.js';

const categoriaService = new CategoriaService();
const produtoService = new ProdutoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Configuração de CORS para garantir que o front acesse    
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'x-user-id, x-user-area, x-user-perfil, x-user-superior, content-type');
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    // Pega o usuário logado (contendo idArea e idPerfil)
    const user = getAuthUser(req);
    const { tipo, idCategoria } = req.query;

    if (tipo === 'produtos') {
      const produtos = await produtoService.findAll(
        user, 
        idCategoria ? Number(idCategoria) : undefined
      );
      return res.status(200).json(successResponse(produtos));
    }

    // AQUI: O Service de categorias agora precisa do objeto 'user'
    const categorias = await categoriaService.findAll(user);
    return res.status(200).json(successResponse(categorias));

  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}