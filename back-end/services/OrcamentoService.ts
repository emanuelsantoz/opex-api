import { prisma } from '../lib/prisma.js';
import { CreateOrcamentoInput, UpdateOrcamentoInput, ListOrcamentosQuery, AuthUser } from '../types/index.js';
import { ForbiddenError, NotFoundError, ConflictError } from '../lib/errors.js';
import { Prisma } from '@prisma/client';

export class OrcamentoService {
  async create(data: CreateOrcamentoInput, user: AuthUser) {
    // Verificar se já existe orçamento para esta área e ano
    const existingOrcamento = await prisma.orcamento.findUnique({
      where: {
        ano_idArea: {
          ano: data.ano,
          idArea: data.idArea,
        },
      },
    });

    if (existingOrcamento) {
      throw new ConflictError(`Já existe um orçamento para a área ${data.idArea} no ano ${data.ano}`);
    }

    const userPerfil = await prisma.perfil.findFirst({
        where: {id: 1 }
    })

    if(userPerfil?.nome !== "Diretor"){
        
    }

    // Verificar se a área existe
    const area = await prisma.area.findUnique({
      where: { id: data.idArea },
    });

    if (!area) {
      throw new NotFoundError('Área');
    }

    // Verificar se o coordenador existe
    // const coordenador = await prisma.usuario.findUnique({
    //   where: { id: data.idCoordenador },
    // });

    // if (!coordenador) {
    //   throw new NotFoundError('Coordenador');
    // }

    // Verificar se o status existe
    const status = await prisma.statusOrcamento.findUnique({
      where: { id: data.idStatusOrcamento },
    });

    if (!status) {
      throw new NotFoundError('Status do orçamento');
    }

    const orcamento = await prisma.orcamento.create({
      data: {
        ano: data.ano,
        idArea: data.idArea,
        idCoordenador: data.idCoordenador,
        idStatusOrcamento: data.idStatusOrcamento,
        valorTotalAnual: data.valorTotalAnual,
      },
      include: {
        area: true,
        coordenador: {
          select: { id: true, nome: true, email: true },
        },
        status: true,
      },
    });

    return orcamento;
  }

  async findAll(user: AuthUser, filters: ListOrcamentosQuery) {
    const { ano, idArea, idStatusOrcamento, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.OrcamentoWhereInput = {};

    if (ano) {
      where.ano = ano;
    }

    if (idArea) {
      where.idArea = idArea;
    }

    if (idStatusOrcamento) {
      where.idStatusOrcamento = idStatusOrcamento;
    }

    // Se não for ADMIN, filtra pela área do usuário
    if (user.idPerfil !== 1) {
      where.idArea = user.idArea;
    }

    const [orcamentos, total] = await Promise.all([
      prisma.orcamento.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ ano: 'desc' }, { id: 'desc' }],
        include: {
          area: true,
          coordenador: {
            select: { id: true, nome: true, email: true },
          },
          status: true,
          _count: {
            select: { lancamentos: true },
          },
        },
      }),
      prisma.orcamento.count({ where }),
    ]);

    return {
      data: orcamentos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number, user: AuthUser) {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id },
      include: {
        area: true,
        coordenador: {
          select: { id: true, nome: true, email: true },
        },
        status: true,
        lancamentos: {
          include: {
            produto: true,
            tipo: true,
            status: true,
          },
          orderBy: { mesReferencia: 'asc' },
        },
        _count: {
          select: { lancamentos: true },
        },
      },
    });

    if (!orcamento) {
      throw new NotFoundError('Orçamento');
    }

    // Verificar acesso por área (se não for ADMIN)
    if (user.idPerfil !== 1 && orcamento.idArea !== user.idArea) {
      throw new ForbiddenError('Orçamento não pertence à sua área');
    }

    return orcamento;
  }

  async update(id: number, data: UpdateOrcamentoInput, user: AuthUser) {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id },
      include: {
        status: true,
        lancamentos: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundError('Orçamento');
    }

    // Verificar acesso por área
    if (user.idPerfil !== 1 && orcamento.idArea !== user.idArea) {
      throw new ForbiddenError('Orçamento não pertence à sua área');
    }

    // Verificar se já existe orçamento para a nova combinação (se mudar ano ou área)
    if (data.ano || data.idArea) {
      const newAno = data.ano || orcamento.ano;
      const newIdArea = data.idArea || orcamento.idArea;

      const existingOrcamento = await prisma.orcamento.findFirst({
        where: {
          id: { not: id },
          ano: newAno,
          idArea: newIdArea,
        },
      });

      if (existingOrcamento) {
        throw new ConflictError(`Já existe um orçamento para a área ${newIdArea} no ano ${newAno}`);
      }
    }

    // Se estiver mudando área, verificar se a nova área existe
    if (data.idArea) {
      const area = await prisma.area.findUnique({
        where: { id: data.idArea },
      });

      if (!area) {
        throw new NotFoundError('Área');
      }
    }

    // Se estiver mudando coordenador, verificar se existe
    if (data.idCoordenador) {
      const coordenador = await prisma.usuario.findUnique({
        where: { id: data.idCoordenador },
      });

      if (!coordenador) {
        throw new NotFoundError('Coordenador');
      }
    }

    // Se estiver mudando status, verificar se existe
    if (data.idStatusOrcamento) {
      const status = await prisma.statusOrcamento.findUnique({
        where: { id: data.idStatusOrcamento },
      });

      if (!status) {
        throw new NotFoundError('Status do orçamento');
      }
    }

    // Recalcular valor total se houver lançamentos
    let valorTotalAnual = data.valorTotalAnual;
    if (valorTotalAnual === undefined && orcamento.lancamentos.length > 0) {
      const total = orcamento.lancamentos.reduce((sum, l) => {
        return sum + Number(l.valorPlanejado);
      }, 0);
      valorTotalAnual = total;
    }

    return prisma.orcamento.update({
      where: { id },
      data: {
        ano: data.ano,
        idArea: data.idArea,
        idCoordenador: data.idCoordenador,
        idStatusOrcamento: data.idStatusOrcamento,
        valorTotalAnual: valorTotalAnual,
      },
      include: {
        area: true,
        coordenador: {
          select: { id: true, nome: true, email: true },
        },
        status: true,
      },
    });
  }

  async delete(id: number, user: AuthUser) {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id },
      include: {
        lancamentos: true,
        validacoesMensais: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundError('Orçamento');
    }

    // Verificar acesso por área
    if (user.idPerfil !== 1 && orcamento.idArea !== user.idArea) {
      throw new ForbiddenError('Orçamento não pertence à sua área');
    }

    // Apenas orçamentos sem lançamentos podem ser excluídos
    if (orcamento.lancamentos.length > 0) {
      throw new ForbiddenError('Não é possível excluir orçamento que possui lançamentos');
    }

    // Deletar validações mensais primeiro
    await prisma.validacaoMensal.deleteMany({
      where: { idOrcamento: id },
    });

    // Deletar histórico de lançamentos
    const lancamentoIds = orcamento.lancamentos.map((l) => l.id);
    if (lancamentoIds.length > 0) {
      await prisma.historicoLancamento.deleteMany({
        where: { idLancamento: { in: lancamentoIds } },
      });
    }

    // Deletar lançamentos
    await prisma.lancamento.deleteMany({
      where: { idOrcamento: id },
    });

    // Deletar orçamento
    return prisma.orcamento.delete({
      where: { id },
    });
  }
}