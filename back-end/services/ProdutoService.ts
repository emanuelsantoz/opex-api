import { prisma } from '../lib/prisma.js';
import { AuthUser } from '../types/index.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';

export class ProdutoService {
  async findAll(user: AuthUser, idCategoriaLancamento?: number) {
    const where: { idCategoriaLancamento?: number; categoria: { idArea: number } } = {
      categoria: { idArea: user.idArea },
    };

    if (idCategoriaLancamento) {
      where.idCategoriaLancamento = idCategoriaLancamento;
    }

    return prisma.produto.findMany({
      where: {
        // Mesclamos os filtros existentes (como busca por nome, se houver) com o OR
        ...where,
        OR: [
          { idCategoriaLancamento: user.idArea }, // Traz o que é da área específica do usuário        // + Traz o que for Global (nulo)
        ]
      },
      include: {
        categoria: true,
        tipoProduto: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number, user: AuthUser) {
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: {
        categoria: true,
        tipoProduto: true,
        areaProduto: true,
      },
    });

    if (!produto) {
      throw new NotFoundError('Produto');
    }

    if (produto.categoria.idArea !== user.idArea) {
      throw new ForbiddenError('Produto não pertence à sua área');
    }

    return produto;
  }
}