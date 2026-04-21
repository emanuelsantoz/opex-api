import { prisma } from '../lib/prisma.js';
import { CreateCompraInput, AuthUser } from '../types/index.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors.js';

export class CompraService {
  async create(data: CreateCompraInput, user: AuthUser) {
    const lancamento = await prisma.lancamento.findUnique({
      where: { id: data.idLancamento },
      include: {
        status: true,
        orcamento: true,
      },
    });

    if (!lancamento) {
      throw new NotFoundError('Lançamento');
    }

    // O lançamento deve estar em EXECUCAO ou VALIDADO_MENSAL para receber compras
    const statusPermitidos = ['EM_EXECUCAO', 'VALIDADO_MENSAL'];
    if (!statusPermitidos.includes(lancamento.status.nome)) {
      throw new ValidationError(
        `Lançamento deve estar em ${statusPermitidos.join(' ou ')} para registrar compras`
      );
    }

    // Verificar área
    if (lancamento.orcamento.idArea !== user.idArea) {
      throw new ForbiddenError('Lançamento não pertence à sua área');
    }

    // Iniciamos a transação para garantir que tudo aconteça ou nada aconteça
    return await prisma.$transaction(async (tx) => {

      // 1. Criar a compra usando o contexto da transação (tx)
      const compra = await tx.compra.create({
        data: {
          idLancamento: data.idLancamento,
          valorPago: data.valorPago,
          dataCompra: new Date(data.dataCompra),
          idComprovantes: data.idComprovantes,
        },
        include: { comprovantes: true },
      });

      // 2. Calcular o novo valor total (Soma de todas as compras deste lançamento)
      // Dica: passe o 'tx' para dentro da sua função se ela fizer consultas ao banco
      const novoValorRealizado = await this.calculateRealizadoValue(data.idLancamento);

      // 3. Atualizar o Lançamento
      await tx.lancamento.update({
        where: { id: data.idLancamento },
        data: { valorRealizado: novoValorRealizado },
      });

      // 4. Atualizar o Orçamento (A mágica final)
      // Aqui, como você já tem o novo valor total do lançamento, 
      // podemos atualizar o orçamento refletindo esse gasto real.
      await tx.orcamento.update({
        where: { id: lancamento.idOrcamento },
        data: {
          valorUtilizado: { increment: data.valorPago }
        },
      });

      return {
        ...compra,
        valorRealizadoAtualizado: novoValorRealizado,
      };
    });
  }

  private async calculateRealizadoValue(idLancamento: number): Promise<number> {
    const result = await prisma.compra.aggregate({
      where: { idLancamento },
      _sum: { valorPago: true },
    });

    return result._sum.valorPago?.toNumber() || 0;
  }

  async findByLancamento(idLancamento: number, user: AuthUser) {
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

    return prisma.compra.findMany({
      where: { idLancamento },
      orderBy: { dataCompra: 'desc' },
    });
  }
}