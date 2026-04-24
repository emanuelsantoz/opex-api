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

export interface CreateOrcamentoInput {
  ano: number;
  idArea: number;
  idCoordenador: number;
  idStatusOrcamento: number;
  valorTotalAnual: number;
}

export interface UpdateOrcamentoInput {
  ano?: number;
  idArea?: number;
  idCoordenador?: number;
  idStatusOrcamento?: number;
  valorTotalAnual?: number;
}

export interface ListOrcamentosQuery {
  ano?: number;
  idArea?: number;
  idStatusOrcamento?: number;
  page?: number;
  limit?: number;
}

export interface CreateUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  idPerfil: number;
  idArea: number;
  idSuperior: number | null;
}

export interface LoginInput {
  email: string;
  senha: string;
}

export interface LoginResponse {
  id: number;
  nome: string;
  email: string;
  idPerfil: number;
  idArea: number;
}