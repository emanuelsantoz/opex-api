import type { NextApiRequest, NextApiResponse } from 'next';
import { ProdutoService } from '../../services/index.js';
import { getAuthUser } from '../../middlewares/auth.js';
import { successResponse, errorResponse } from '../../lib/response.js';
import { createProdutoSchema, listProdutosSchema } from '../../lib/validators.js';
import { CORS_CONFIG } from '../../config/cors.js';

const produtoService = new ProdutoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const origin = req.headers.origin;
        // Verifica se a origem da requisição está na sua lista de permitidos

        if (origin && CORS_CONFIG.allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }

        // Configuração de CORS para garantir que o front acesse    
        if (req.method === 'OPTIONS') {
            // Somente o seu endereço local ou seu domínio de produção
            const allowedOrigin = 'http://localhost:5173';

            res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'x-user-id, x-user-area, x-user-perfil, x-user-superior, content-type');

            // Isso diz ao navegador que ele pode confiar nessa configuração por 24 horas (86400 seg)
            // Evita que o navegador faça um OPTIONS antes de CADA requisição, melhorando a performance.
            res.setHeader('Access-Control-Max-Age', '86400');

            return res.status(204).end();
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
