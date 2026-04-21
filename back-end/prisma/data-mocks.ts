export const MOCK_AREAS = [
    { nome: 'Diretoria', sigla: 'DR' },
    { nome: 'Tecnologia da Informação', sigla: 'TI' },
    { nome: 'Recursos Humanos', sigla: 'RH' },
    { nome: 'Marketing e Vendas', sigla: 'MKT' },
    { nome: 'Operações', sigla: 'OPS' },
    { nome: 'Desenvolvimento Social', sigla: 'DS' },
    { nome: 'Administrativo e Financeiro', sigla: 'ADM' }
];

export const MOCK_TIPOS_PERFIL = [
  { nome: 'N1', descricao: 'Acesso Total - Todas as Áreas' },
  { nome: 'N2', descricao: 'Acesso Restrito - Própria Área' },
  { nome: 'N3', descricao: 'Acesso Operacional - Execução/Compras' }
];

export const MOCK_PERFIS = [
  { nome: 'Diretor', tipo: 'N1' },
  { nome: 'Coordenador', tipo: 'N2' },
  { nome: 'Analista de Compras', tipo: 'N3' },
  { nome: 'Operador', tipo: 'N3' }
];

export const MOCK_STATUS_ORCAMENTO = [
  { nome: 'RASCUNHO' },
  { nome: 'EM_ELABORACAO' },
  { nome: 'AGUARDANDO_APROVACAO' },
  { nome: 'APROVADO' },
  { nome: 'REPROVADO' }
];

export const MOCK_TIPO_LANCAMENTO = [
  { nome: 'FIXO' },
  { nome: 'VARIAVEL' }
];

export const MOCK_STATUS_LANCAMENTO = [
  { nome: 'RASCUNHO' },
  { nome: 'PLANEJADO' },
  { nome: 'PENDENTE_ADMINISTRADOR' },
  { nome: 'APROVADO' },
  { nome: 'VALIDADO_MENSAL' },
  { nome: 'REPROVADO_ADMINISTRADOR' },
  { nome: 'REPROVADO_COMPRAS' },
  { nome: 'EM_EXECUCAO' },
  { nome: 'CONCLUIDO' }
];

export const MOCK_TIPO_PRODUTO = [
  { nome: 'PRODUTO' },
  { nome: 'SERVIÇO' },
  { nome: 'ASSINATURA' }
];

export const MOCK_CATEGORIA_LANCAMENTO =[
    { nome: 'Administrativas', areaSigla: 'DS' },
    { nome: 'Pessoal e Prestadores de Serviços', areaSigla: 'DS' },
    { nome: 'Treinamento e Capacitação', areaSigla: 'DS' },
    { nome: 'Manutenção e Conservação', areaSigla: 'DS' },
];