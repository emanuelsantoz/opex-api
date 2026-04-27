import { prisma } from '../lib/prisma.js';
import { AuthUser } from '../types/index.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';

export class CategoriaService {
  async findAll(user: AuthUser, filtros?: any) {
    return prisma.categoriaLancamento.findMany({
      where: {
        // Mesclamos os filtros existentes (como busca por nome, se houver) com o OR
        ...filtros,
        OR: [
          { idArea: user.idArea },
          { idArea: null },
        ],
      },
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