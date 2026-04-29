import type { NextApiRequest, NextApiResponse } from 'next';
import { CategoriaService, ProdutoService } from '../../services/index.js';
import { getAuthUser } from '../../middlewares/auth.js';
import { successResponse, errorResponse } from '../../lib/response.js';
import { createCategoriaSchema } from '../../lib/validators.js';

const categoriaService = new CategoriaService();
const produtoService = new ProdutoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Configuração de CORS para garantir que o front acesse    
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'x-user-id, x-user-area, x-user-perfil, content-type');
      return res.status(200).end();
    }
    // AQUI: O POST agora pode criar tanto categorias quanto produtos, dependendo do query param 'tipo'
    if (req.method === 'POST') {
      const user = getAuthUser(req);

      const parseResult = createCategoriaSchema.safeParse(req.body);
      console.log('Parse result:', parseResult);
      if (!parseResult.success) {
        return res.status(400).json(errorResponse(parseResult.error));
      }

      const categoria = await categoriaService.create(parseResult.data, user);
      return res.status(201).json(successResponse(categoria, 201));
    }
    // AQUI: O GET agora pode retornar tanto categorias quanto produtos, dependendo do query param 'tipo'
    if (req.method === 'GET') {
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
    }

  } catch (error) {
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}