import { prisma } from '../lib/prisma.js';
import { AprovarLancamentoInput, AuthUser } from '../types/index.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors.js';

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
      // 1. Atualiza o Lançamento
      prisma.lancamento.update({
        where: { id: data.idLancamento },
        data: { idStatusLancamento: data.idStatusLancamento },
        include: { orcamento: true, produto: true, tipo: true, status: true },
      }),

      // 2. Cria o Histórico
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

  async approveBudget(idOrcamento: number, user: AuthUser) {
    // 1. Buscar o orçamento e seus lançamentos
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: idOrcamento },
      include: {
        lancamentos: {
          where: { status: { nome: 'PENDENTE_ADMINISTRADOR', } } // Apenas o que ainda não foi aprovado
        },
        status: true
      }
    });

    if (!orcamento) throw new NotFoundError('Orçamento');

    // 2. Somar o valor planejado de todos os lançamentos rascunhados
    const totalPlanejado = orcamento.lancamentos.reduce(
      (sum, lanc) => sum + Number(lanc.valorPlanejado),
      0
    );

    // 3. Buscar o ID do status 'APROVADO' para Lançamentos e Orçamentos
    const statusAprovadoLanc = await prisma.statusLancamento.findFirst({ where: { nome: 'APROVADO' } });
    const statusAprovadoOrc = await prisma.statusOrcamento.findFirst({ where: { nome: 'APROVADO' } });

    // 4. TRANSAÇÃO ATÔMICA: Tudo ou nada
    return await prisma.$transaction(async (tx) => {

      // A) Aprovar todos os lançamentos daquela área de uma vez
      await tx.lancamento.updateMany({
        where: {
          idOrcamento: idOrcamento,
          status: { nome: 'AGUARDANDO_APROVACAO' }
        },
        data: { idStatusLancamento: statusAprovadoLanc!.id }
      });

      // B) Criar histórico para cada lançamento aprovado em massa
      const historicos = orcamento.lancamentos.map(lanc => ({
        idLancamento: lanc.id,
        idUsuarioAprovador: user.id,
        acao: 'APROVACAO_EM_MASSA',
        observacao: `Aprovado via aprovação total do orçamento anual - ano referência: ${orcamento.ano}.`
      }));

      await tx.historicoLancamento.createMany({ data: historicos });

      // C) ATUALIZAR O ORÇAMENTO: Definir o valorTotalAnual com a soma dos rascunhos
      // e mudar o status do orçamento para APROVADO
      return await tx.orcamento.update({
        where: { id: idOrcamento },
        data: {
          valorTotalAnual: totalPlanejado, // Aqui o planejado vira o teto oficial
          idStatusOrcamento: statusAprovadoOrc!.id
        },
        include: { status: true }
      });
    });
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