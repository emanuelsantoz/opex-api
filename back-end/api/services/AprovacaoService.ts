import { prisma } from '../lib/prisma';
import { AprovarLancamentoInput, AuthUser } from '../types';
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors';

// Máquina de estados válida
const STATE_MACHINE: Record<string, string[]> = {
  RASCUNHO: ['PLANEJADO'],
  PLANEJADO: ['PENDENTE_ADMINISTRADOR'],
  PENDENTE_ADMINISTRADOR: ['APROVADO', 'REPROVADO_ADMINISTRADOR'],
  APROVADO: ['VALIDADO_MENSAL'],
  VALIDADO_MENSAL: ['EM_EXECUCAO'],
  EM_EXECUCAO: ['CONCLUIDO'],
  REPROVADO_ADMINISTRADOR: ['PLANEJADO'],
  REPROVADO_COMPRAS: ['EM_EXECUCAO'],
};

export class AprovacaoService {
  async approve(data: AprovarLancamentoInput, user: AuthUser) {
    // Buscar o lançamento com o orçamento e produto
    const lancamento = await prisma.lancamento.findUnique({
      where: { id: data.idLancamento },
      include: {
        orcamento: {
          include: {
            coordenador: true,
          },
        },
        produto: true,
        status: true,
      },
    });

    if (!lancamento) {
      throw new NotFoundError('Lançamento');
    }

    // Verificar hierarquia: o usuário deve ser o coordenador do orçamento
    if (lancamento.orcamento.idCoordenador !== user.id) {
      throw new ForbiddenError('Apenas o coordenador do orçamento pode aprovar/reprovar');
    }

    // Validar transição de estado
    const currentStatus = lancamento.status.nome;
    const newStatus = await prisma.statusLancamento.findUnique({
      where: { id: data.idStatusLancamento },
    });

    if (!newStatus) {
      throw new NotFoundError('Status');
    }

    const allowedTransitions = STATE_MACHINE[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus.nome)) {
      throw new ValidationError(
        `Transição de ${currentStatus} para ${newStatus.nome} não é permitida`
      );
    }

    // Executar aprovação em transação
    const [lancamentoAtualizado] = await prisma.$transaction([
      prisma.lancamento.update({
        where: { id: data.idLancamento },
        data: {
          idStatusLancamento: data.idStatusLancamento,
        },
        include: {
          orcamento: true,
          produto: true,
          tipo: true,
          status: true,
        },
      }),
      prisma.historicoLancamento.create({
        data: {
          idLancamento: data.idLancamento,
          idUsuarioAprovador: user.id,
          acao: `APROVACAO_${newStatus.nome}`,
          observacao: data.observacao || null,
        },
      }),
    ]);

    return lancamentoAtualizado;
  }

  async getHistory(idLancamento: number, user: AuthUser) {
    const lancamento = await prisma.lancamento.findUnique({
      where: { id: idLancamento },
      include: {
        orcamento: true,
      },
    });

    if (!lancamento) {
      throw new NotFoundError('Lançamento');
    }

    if (lancamento.orcamento.idArea !== user.idArea) {
      throw new ForbiddenError('Lançamento não pertence à sua área');
    }

    return prisma.historicoLancamento.findMany({
      where: { idLancamento },
      include: {
        aprovador: {
          select: { id: true, nome: true, email: true },
        },
      },
      orderBy: { dataAcao: 'desc' },
    });
  }

  async getStatusOptions() {
    return prisma.statusLancamento.findMany({
      orderBy: { id: 'asc' },
    });
  }
}