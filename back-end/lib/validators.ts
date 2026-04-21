import { z } from 'zod';

export const createLancamentoSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória').max(500),
  idOrcamento: z.number().int().positive(),
  idProduto: z.number().int().positive(),
  idTipoLancamento: z.number().int().positive(),
  mesReferencia: z.number().int().min(1).max(12),
  valorPlanejado: z.number().positive('Valor planejado deve ser positivo'),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
});

export const updateLancamentoSchema = createLancamentoSchema.partial();

export const approveLancamentoSchema = z.object({
  idLancamento: z.number().int().positive(),
  idStatusLancamento: z.number().int().positive(),
  observacao: z.string().max(1000).optional(),
});

export const createCompraSchema = z.object({
  idLancamento: z.number().int().positive(),
  valorPago: z.number().positive('Valor pago deve ser positivo'),
  dataCompra: z.string().datetime({ message: 'Data de compra inválida' }),
  idComprovantes: z.number().int().positive().optional(),
});

export const listLancamentosSchema = z.object({
  ano: z.coerce.number().int().min(2020).max(2100).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  idStatusLancamento: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateLancamentoDTO = z.infer<typeof createLancamentoSchema>;
export type ApproveLancamentoDTO = z.infer<typeof approveLancamentoSchema>;
export type CreateCompraDTO = z.infer<typeof createCompraSchema>;
export type ListLancamentosDTO = z.infer<typeof listLancamentosSchema>;