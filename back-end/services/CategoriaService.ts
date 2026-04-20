import { prisma } from '../lib/prisma.js';
import { AuthUser } from '../types/index.js';  
import { ForbiddenError, NotFoundError } from '../lib/errors.js';

export class CategoriaService {
  async findAll(user: AuthUser) {
    return prisma.categoriaLancamento.findMany({
      where: { idArea: user.idArea },
      include: {
        produtos: {
          include: {
            tipoProduto: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number, user: AuthUser) {
    const categoria = await prisma.categoriaLancamento.findUnique({
      where: { id },
      include: {
        produtos: {
          include: {
            tipoProduto: true,
          },
        },
      },
    });

    if (!categoria) {
      throw new NotFoundError('Categoria');
    }

    if (categoria.idArea !== user.idArea) {
      throw new ForbiddenError('Categoria não pertence à sua área');
    }

    return categoria;
  }
}

export class ProdutoService {
  async findAll(user: AuthUser, idCategoriaLancamento?: number) {
    const where: { idCategoriaLancamento?: number; categoria: { idArea: number } } = {
      categoria: { idArea: user.idArea },
    };

    if (idCategoriaLancamento) {
      where.idCategoriaLancamento = idCategoriaLancamento;
    }

    return prisma.produto.findMany({
      where,
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