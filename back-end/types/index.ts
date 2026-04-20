export interface AuthUser {
  id: number;
  idArea: number;
  idPerfil: number;
  idSuperior: number | null;
}

export interface CreateLancamentoInput {
  descricao: string;
  idOrcamento: number;
  idProduto: number;
  idTipoLancamento: number;
  mesReferencia: number;
  valorPlanejado: number;
  quantidade: number;
}

export interface AprovarLancamentoInput {
  idLancamento: number;
  idStatusLancamento: number;
  observacao?: string;
}

export interface CreateCompraInput {
  idLancamento: number;
  valorPago: number;
  dataCompra: string;
  idComprovantes?: number;
}

export interface ListLancamentosQuery {
  ano?: number;
  mes?: number;
  idStatusLancamento?: number;
  page?: number;
  limit?: number;
}