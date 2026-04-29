import { prisma } from '../lib/prisma.js';
import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import { AuthUser, CreateProdutoInput } from "../types/index.js";

export class ProdutoService {
  async create(data: CreateProdutoInput, user: AuthUser) {
    // Verificar se a categoria pertence à área do usuário
    const categoria = await prisma.categoriaLancamento.findUnique({
      where: { id: data.idCategoriaLancamento },
    });

    if (!categoria) {
      throw new NotFoundError('Categoria');
    }

    if (categoria.idArea !== user.idArea) {
      throw new ForbiddenError('Categoria não pertence à sua área');
    }

    return prisma.produto.create({
      data: { ...data, idCategoriaLancamento: categoria.id },
    });
  }

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