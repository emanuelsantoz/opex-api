import type { NextApiRequest, NextApiResponse } from 'next';
import { ProdutoService } from '../../services/index.js';
import { getAuthUser } from '../../middlewares/auth.js';
import { successResponse, errorResponse } from '../../lib/response.js';
import { createProdutoSchema, listProdutosSchema } from '../../lib/validators.js';

const produtoService = new ProdutoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Opcional: lidar com pré-flight CORS requests
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'x-user-id, x-user-area, x-user-perfil, content-type');
            return res.status(200).end(); // Aqui o guarda-costas (navegador) sorri e deixa o GET passar
        }
        // Buscar Produtos
        if (req.method === 'GET') {
            const user = getAuthUser(req);

            const parseResult = listProdutosSchema.safeParse(req.query);
            if (!parseResult.success) {
                return res.status(400).json(errorResponse(parseResult.error));
            }

            const produtos = await produtoService.findAll(user);
            return res.status(200).json(successResponse(produtos));
        }

        // Cadastrar Novo Produto
        if (req.method === 'POST') {
            const user = getAuthUser(req);

            const parseResult = createProdutoSchema.safeParse(req.body);
            if (!parseResult.success) {
                return res.status(400).json(errorResponse(parseResult.error));
            }

            const produto = await produtoService.create(parseResult.data, user);
            return res.status(201).json(successResponse(produto, 201));
        }
    } catch (error) {
        const { statusCode, body } = errorResponse(error);
        return res.status(statusCode).json(body);
    }
}
