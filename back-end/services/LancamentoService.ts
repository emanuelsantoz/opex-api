import { prisma } from '../lib/prisma.js';
import { CreateLancamentoInput, ListLancamentosQuery, AuthUser } from '../types/index.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';
import { Prisma } from '@prisma/client';

export class LancamentoService {
  async create(data: CreateLancamentoInput, user: AuthUser) {
    // Buscar o orçamento para verificar a área
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: data.idOrcamento },
      include: { area: true },
    });

    if (!orcamento) {
      throw new NotFoundError('Orçamento');
    }

    // Verificar se o usuário pertence à área do orçamento
    if (orcamento.idArea !== user.idArea) {
      throw new ForbiddenError('Você não tem acesso a este orçamento');
    }

    // Buscar o status inicial (RASCUNHO - id 1)
    const statusRascunho = await prisma.statusLancamento.findFirst({
      where: { nome: 'RASCUNHO' },
    });

    if (!statusRascunho) {
      throw new NotFoundError('Status RASCUNHO');
    }

    // Criar o lançamento
    const lancamento = await prisma.lancamento.create({
      data: {
        idOrcamento: data.idOrcamento,
        idProduto: data.idProduto,
        idTipoLancamento: data.idTipoLancamento,
        idStatusLancamento: statusRascunho.id,
        mesReferencia: data.mesReferencia,
        valorPlanejado: data.valorPlanejado,
        quantidade: data.quantidade,
        descricao: data.descricao,
      },
      include: {
        orcamento: true,
        produto: true,
        tipo: true,
        status: true,
      },
    });

    // Criar histórico inicial
    await prisma.historicoLancamento.create({
      data: {
        idLancamento: lancamento.id,
        idUsuarioAprovador: user.id,
        acao: 'CRIADO',
        observacao: 'Lançamento criado',
      },
    });

    return lancamento;
  }

  async findAll(user: AuthUser, filters: ListLancamentosQuery) {
    const { ano, mes, idStatusLancamento, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // 1. Iniciamos o filtro básico (filtros de data e status valem para todos)
    const where: Prisma.LancamentoWhereInput = {};

    if (mes) where.mesReferencia = mes;
    if (idStatusLancamento) where.idStatusLancamento = idStatusLancamento;

    // 2. Lógica de Segurança por Perfil (O "Coração" da sua dúvida)
    // Se for N2 (ou qualquer um abaixo de N3), restringimos à área dele
    if (Number(user.idPerfil) <= 2) {
      where.orcamento = {
        idArea: user.idArea,
      };
    }

    // 3. Adição do filtro de Ano (preservando o idArea se ele existir)
    if (ano) {
      where.orcamento = {
        ...(where.orcamento as Prisma.OrcamentoWhereInput),
        ano,
      };
    }

    // 4. Execução da query
    const [lancamentos, total] = await Promise.all([
      prisma.lancamento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          orcamento: {
            include: {
              area: true,
            }
          },
          produto: true,
          tipo: true,
          status: true,
        },
      }),
      prisma.lancamento.count({ where }),
    ]);

    return {
      data: lancamentos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number, user: AuthUser) {
    const lancamento = await prisma.lancamento.findUnique({
      where: { id },
      include: {
        orcamento: true,
        produto: true,
        tipo: true,
        status: true,
        compras: {
          include: {
            comprovantes: true,
          },
        },
        historicos: {
          include: {
            aprovador: {
              select: { id: true, nome: true },
            },
          },
          orderBy: { dataAcao: 'desc' },
        },
      },
    });

    if (!lancamento) {
      throw new NotFoundError('Lançamento');
    }

    // Verificar acesso por área
    if (lancamento.orcamento.idArea !== user.idArea) {
      throw new ForbiddenError('Lançamento não pertence à sua área');
    }

    return lancamento;
  }

  async update(id: number, data: Partial<CreateLancamentoInput>, user: AuthUser) {
    const lancamento = await prisma.lancamento.findUnique({
      where: { id },
      include: {
        status: true,
        orcamento: true,
      },
    });

    if (!lancamento) {
      throw new NotFoundError('Lançamento');
    }

    // Verificar acesso por área
    if (lancamento.orcamento.idArea !== user.idArea) {
      throw new ForbiddenError('Lançamento não pertence à sua área');
    }

    // Apenas RASCUNHO pode ser editado
    if (lancamento.status.nome !== 'RASCUNHO') {
      throw new ForbiddenError('Apenas lançamentos em RASCUNHO podem ser editados');
    }

    return prisma.lancamento.update({
      where: { id },
      data: {
        descricao: data.descricao,
        idOrcamento: data.idOrcamento,
        idProduto: data.idProduto,
        idTipoLancamento: data.idTipoLancamento,
        mesReferencia: data.mesReferencia,
        valorPlanejado: data.valorPlanejado,
        quantidade: data.quantidade,
      },
      include: {
        orcamento: true,
        produto: true,
        tipo: true,
        status: true,
      },
    });
  }

  async delete(id: number, user: AuthUser) {
    const lancamento = await prisma.lancamento.findUnique({
      where: { id },
      include: {
        orcamento: true,
        status: true,
      },
    });

    if (!lancamento) {
      throw new NotFoundError('Lançamento');
    }

    if (lancamento.orcamento.idArea !== user.idArea) {
      throw new ForbiddenError('Lançamento não pertence à sua área');
    }

    if (lancamento.status.nome !== 'RASCUNHO') {
      throw new ForbiddenError('Apenas lançamentos em RASCUNHO podem ser excluídos');
    }

    // Deletar histórico primeiro
    await prisma.historicoLancamento.deleteMany({
      where: { idLancamento: id },
    });

    // Deletar compras
    await prisma.compra.deleteMany({
      where: { idLancamento: id },
    });

    // Deletar lançamento
    return prisma.lancamento.delete({
      where: { id },
    });
  }
}