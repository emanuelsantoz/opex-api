import { prisma } from '../lib/prisma';
import { CreateCompraInput, AuthUser } from '../types';
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors';

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

    // Criar a compra
    const compra = await prisma.compra.create({
      data: {
        idLancamento: data.idLancamento,
        valorPago: data.valorPago,
        dataCompra: new Date(data.dataCompra),
        idComprovantes: data.idComprovantes,
      },
      include: {
        comprovantes: true,
      },
    });

    // Atualizar o valor realizado do lançamento
    const novoValorRealizado = await this.calculateRealizadoValue(data.idLancamento);

    await prisma.lancamento.update({
      where: { id: data.idLancamento },
      data: { valorRealizado: novoValorRealizado },
    });

    return {
      ...compra,
      valorRealizadoAtualizado: novoValorRealizado,
    };
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