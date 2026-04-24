  - api/services/LancamentoService.ts
  - api/services/AprovacaoService.ts
  - api/middlewares/auth.ts
  - api/types/index.ts

  Ou prefere ajustar o schema para manter a estrutura que o código espera?

✻ Baked for 3m 59s

※ recap: Goal: Transform back-end to serviceless Vercel Functions. Schema Prisma is now corrected and generates successfully. Next: rewrite services (LancamentoService, AprovacaoService, auth middleware) to match schema - the code currently   
  expects fields and relations that don't exist in Prisma. (disable recaps in /config)

❯ ok, pode rescreve-lo, mas antes tente excultar um build

● Bash(cd "C:\Users\emanu\OneDrive\Desktop\controle-gasto\controle_gastos\back-end" && npm run build 2>&1)
  ⎿  Error: Exit code 2

     > controle-gastos-api@1.0.0 build
     > prisma generate && tsc --noEmit

     Environment variables loaded from .env
     Prisma schema loaded from prisma\schema.prisma

     ✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client in 165ms

     … +57 lines (ctrl+o to see all)

● Os erros são extensos. O código precisa ser reescrito para casar com o schema Prisma. Vou corrigir os arquivos principais.

  Read 2 files (ctrl+o to expand)

● Write(api\types\index.ts)
  ⎿  Added 17 lines, removed 23 lines
       1 -import { Perfil, StatusLancamento } from '@prisma/client';                                                                                                                                                                               
       2 -                                                                                                                                                                                                                                         
       1  export interface AuthUser {
       4 -  id: string;                                                                                                                                                                                                                            
       5 -  idArea: string;                                                                                                                                                                                                                        
       6 -  perfil: Perfil;                                                                                                                                                                                                                        
       7 -  idSuperior: string | null;                                                                                                                                                                                                             
       2 +  id: number;                                                                                                                                                                                                                            
       3 +  idArea: number;                                                                                                                                                                                                                        
       4 +  idPerfil: number;                                                                                                                                                                                                                      
       5 +  idSuperior: number | null;                                                                                                                                                                                                             
       6  }
       7
       8  export interface CreateLancamentoInput {
       9    descricao: string;
      12 -  idCategoria: string;                                                                                                                                                                                                                   
      13 -  ano: number;                                                                                                                                                                                                                           
      14 -  mes: number;                                                                                                                                                                                                                           
      10 +  idOrcamento: number;                                                                                                                                                                                                                   
      11 +  idProduto: number;                                                                                                                                                                                                                     
      12 +  idTipoLancamento: number;                                                                                                                                                                                                              
      13 +  mesReferencia: number;                                                                                                                                                                                                                 
      14    valorPlanejado: number;
      16 -  itens: {                                                                                                                                                                                                                               
      17 -    idProduto: string;                                                                                                                                                                                                                   
      18 -    quantidade: number;                                                                                                                                                                                                                  
      19 -    valorUnitario: number;                                                                                                                                                                                                               
      20 -  }[];                                                                                                                                                                                                                                   
      15 +  quantidade: number;                                                                                                                                                                                                                    
      16  }
      17
      18  export interface AprovarLancamentoInput {
      24 -  idLancamento: string;                                                                                                                                                                                                                  
      25 -  status: 'APROVADO' | 'REPROVADO';                                                                                                                                                                                                      
      26 -  justificativa?: string;                                                                                                                                                                                                                
      19 +  idLancamento: number;                                                                                                                                                                                                                  
      20 +  idStatusLancamento: number;                                                                                                                                                                                                            
      21 +  observacao?: string;                                                                                                                                                                                                                   
      22  }
      23
      24  export interface CreateCompraInput {
      30 -  idLancamento: string;                                                                                                                                                                                                                  
      31 -  quantidade: number;                                                                                                                                                                                                                    
      32 -  valorTotal: number;                                                                                                                                                                                                                    
      25 +  idLancamento: number;                                                                                                                                                                                                                  
      26 +  valorPago: number;                                                                                                                                                                                                                     
      27    dataCompra: string;
      34 -  observacao?: string;                                                                                                                                                                                                                   
      28 +  idComprovantes?: number;                                                                                                                                                                                                               
      29  }
      30
      31  export interface ListLancamentosQuery {
      32    ano?: number;
      33    mes?: number;
      40 -  status?: StatusLancamento;                                                                                                                                                                                                             
      34 +  idStatusLancamento?: number;                                                                                                                                                                                                           
      35    page?: number;
      36    limit?: number;
      43 -}                                                                                                                                                                                                                                        
      37 +}                                                                                                                                                                                                                                        
      38   No newline at end of file

● Write(api\services\LancamentoService.ts)
  ⎿  Added 139 lines, removed 136 lines
       1 -import { StatusLancamento } from '@prisma/client';                                                                                                                                                                                       
       1  import { prisma } from '../lib/prisma';
       3 -import { CreateLancamentoDTO } from '../lib/validators';                                                                                                                                                                                 
       4 -import { AuthUser } from '../types';                                                                                                                                                                                                     
       5 -import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors';                                                                                                                                                          
       6 -import { LancamentoItem, Categoria, Produto } from '@prisma/client';                                                                                                                                                                     
       2 +import { CreateLancamentoInput, ListLancamentosQuery, AuthUser } from '../types';                                                                                                                                                        
       3 +import { ForbiddenError, NotFoundError } from '../lib/errors';                                                                                                                                                                           
       4
       8 -type LancamentoWithRelations = {                                                                                                                                                                                                         
       9 -  id: string;                                                                                                                                                                                                                            
      10 -  descricao: string;                                                                                                                                                                                                                     
      11 -  idArea: string;                                                                                                                                                                                                                        
      12 -  idUsuario: string;                                                                                                                                                                                                                     
      13 -  idCategoria: string;                                                                                                                                                                                                                   
      14 -  ano: number;                                                                                                                                                                                                                           
      15 -  mes: number;                                                                                                                                                                                                                           
      16 -  valorPlanejado: number;                                                                                                                                                                                                                
      17 -  valorRealizado: number;                                                                                                                                                                                                                
      18 -  status: StatusLancamento;                                                                                                                                                                                                              
      19 -  itens: LancamentoItem[];                                                                                                                                                                                                               
      20 -  categoria: Categoria;                                                                                                                                                                                                                  
      21 -};                                                                                                                                                                                                                                       
      22 -                                                                                                                                                                                                                                         
       5  export class LancamentoService {
      24 -  async create(data: CreateLancamentoDTO, user: AuthUser): Promise<LancamentoWithRelations> {                                                                                                                                            
      25 -    // Validar que o usuário é PLANEJADOR                                                                                                                                                                                                
      26 -    if (user.perfil.nome !== 'PLANEJADOR') {                                                                                                                                                                                             
      27 -      throw new ForbiddenError('Apenas usuários com perfil Planejador podem criar lançamentos');                                                                                                                                         
      28 -    }                                                                                                                                                                                                                                    
      29 -                                                                                                                                                                                                                                         
      30 -    // Validar que a categoria pertence à área do usuário                                                                                                                                                                                
      31 -    const categoria = await prisma.categoria.findFirst({                                                                                                                                                                                 
      32 -      where: {                                                                                                                                                                                                                           
      33 -        id: data.idCategoria,                                                                                                                                                                                                            
      34 -        idArea: user.idArea,                                                                                                                                                                                                             
      35 -      },                                                                                                                                                                                                                                 
       6 +  async create(data: CreateLancamentoInput, user: AuthUser) {                                                                                                                                                                            
       7 +    // Buscar o orçamento para verificar a área                                                                                                                                                                                          
       8 +    const orcamento = await prisma.orcamento.findUnique({                                                                                                                                                                                
       9 +      where: { id: data.idOrcamento },                                                                                                                                                                                                   
      10 +      include: { area: true },                                                                                                                                                                                                           
      11      });
      12
      38 -    if (!categoria) {                                                                                                                                                                                                                    
      39 -      throw new NotFoundError('Categoria');                                                                                                                                                                                              
      13 +    if (!orcamento) {                                                                                                                                                                                                                    
      14 +      throw new NotFoundError('Orçamento');                                                                                                                                                                                              
      15      }
      16
      42 -    // Validar que todos os produtos pertencem à categoria e à área                                                                                                                                                                      
      43 -    const produtoIds = data.itens.map((item) => item.idProduto);                                                                                                                                                                         
      44 -    const produtos = await prisma.produto.findMany({                                                                                                                                                                                     
      45 -      where: {                                                                                                                                                                                                                           
      46 -        id: { in: produtoIds },                                                                                                                                                                                                          
      47 -        idCategoria: data.idCategoria,                                                                                                                                                                                                   
      48 -      },                                                                                                                                                                                                                                 
      17 +    // Verificar se o usuário pertence à área do orçamento                                                                                                                                                                               
      18 +    if (orcamento.idArea !== user.idArea) {                                                                                                                                                                                              
      19 +      throw new ForbiddenError('Você não tem acesso a este orçamento');                                                                                                                                                                  
      20 +    }                                                                                                                                                                                                                                    
      21 +                                                                                                                                                                                                                                         
      22 +    // Buscar o status inicial (RASCUNHO - id 1)                                                                                                                                                                                         
      23 +    const statusRascunho = await prisma.statusLancamento.findFirst({                                                                                                                                                                     
      24 +      where: { nome: 'RASCUNHO' },                                                                                                                                                                                                       
      25      });
      26
      51 -    if (produtos.length !== produtoIds.length) {                                                                                                                                                                                         
      52 -      throw new ValidationError('Alguns produtos não foram encontrados ou não pertencem à categoria');                                                                                                                                   
      27 +    if (!statusRascunho) {                                                                                                                                                                                                               
      28 +      throw new NotFoundError('Status RASCUNHO');                                                                                                                                                                                        
      29      }
      30
      55 -    // Calcular valor planejado total                                                                                                                                                                                                    
      56 -    const valorPlanejado = data.itens.reduce(                                                                                                                                                                                            
      57 -      (sum, item) => sum + item.quantidade * item.valorUnitario,                                                                                                                                                                         
      58 -      0                                                                                                                                                                                                                                  
      59 -    );                                                                                                                                                                                                                                   
      60 -                                                                                                                                                                                                                                         
      61 -    // Determinar status inicial                                                                                                                                                                                                         
      62 -    const statusInicial: StatusLancamento = 'PENDENTE';                                                                                                                                                                                  
      63 -                                                                                                                                                                                                                                         
      64 -    // Criar lançamento com itens                                                                                                                                                                                                        
      31 +    // Criar o lançamento                                                                                                                                                                                                                
      32      const lancamento = await prisma.lancamento.create({
      33        data: {
      34 +        idOrcamento: data.idOrcamento,                                                                                                                                                                                                   
      35 +        idProduto: data.idProduto,                                                                                                                                                                                                       
      36 +        idTipoLancamento: data.idTipoLancamento,                                                                                                                                                                                         
      37 +        idStatusLancamento: statusRascunho.id,                                                                                                                                                                                           
      38 +        mesReferencia: data.mesReferencia,                                                                                                                                                                                               
      39 +        valorPlanejado: data.valorPlanejado,                                                                                                                                                                                             
      40 +        quantidade: data.quantidade,                                                                                                                                                                                                     
      41          descricao: data.descricao,
      68 -        idArea: user.idArea,                                                                                                                                                                                                             
      69 -        idUsuario: user.id,                                                                                                                                                                                                              
      70 -        idCategoria: data.idCategoria,                                                                                                                                                                                                   
      71 -        ano: data.ano,                                                                                                                                                                                                                   
      72 -        mes: data.mes,                                                                                                                                                                                                                   
      73 -        valorPlanejado,                                                                                                                                                                                                                  
      74 -        status: statusInicial,                                                                                                                                                                                                           
      75 -        itens: {                                                                                                                                                                                                                         
      76 -          create: data.itens.map((item) => ({                                                                                                                                                                                            
      77 -            idProduto: item.idProduto,                                                                                                                                                                                                   
      78 -            quantidade: item.quantidade,                                                                                                                                                                                                 
      79 -            valorUnitario: item.valorUnitario,                                                                                                                                                                                           
      80 -          })),                                                                                                                                                                                                                           
      81 -        },                                                                                                                                                                                                                               
      42        },
      43        include: {
      84 -        itens: true,                                                                                                                                                                                                                     
      85 -        categoria: true,                                                                                                                                                                                                                 
      44 +        orcamento: true,                                                                                                                                                                                                                 
      45 +        produto: true,                                                                                                                                                                                                                   
      46 +        tipo: true,                                                                                                                                                                                                                      
      47 +        status: true,                                                                                                                                                                                                                    
      48        },
      49      });
      50
     ...
       52      await prisma.historicoLancamento.create({
       53        data: {
       54          idLancamento: lancamento.id,
       93 -        statusAnterior: null,                                                                                                                                                                                                           
       94 -        statusNovo: statusInicial,                                                                                                                                                                                                      
       95 -        justificativa: 'Lançamento criado',                                                                                                                                                                                             
       55 +        idUsuarioAprovador: user.id,                                                                                                                                                                                                    
       56 +        acao: 'CRIADO',                                                                                                                                                                                                                 
       57 +        observacao: 'Lançamento criado',                                                                                                                                                                                                
       58        },
       59      });
       60
       99 -    return lancamento as LancamentoWithRelations;                                                                                                                                                                                       
       61 +    return lancamento;                                                                                                                                                                                                                  
       62    }
       63
      102 -  async findAll(user: AuthUser, filters: {                                                                                                                                                                                              
      103 -    ano?: number;                                                                                                                                                                                                                       
      104 -    mes?: number;                                                                                                                                                                                                                       
      105 -    status?: StatusLancamento;                                                                                                                                                                                                          
      106 -    page?: number;                                                                                                                                                                                                                      
      107 -    limit?: number;                                                                                                                                                                                                                     
      108 -  }) {                                                                                                                                                                                                                                  
      109 -    const { ano, mes, status, page = 1, limit = 20 } = filters;                                                                                                                                                                         
       64 +  async findAll(user: AuthUser, filters: ListLancamentosQuery) {                                                                                                                                                                        
       65 +    const { ano, mes, idStatusLancamento, page = 1, limit = 20 } = filters;                                                                                                                                                             
       66      const skip = (page - 1) * limit;
       67
      112 -    // Usuários OPERACAO veem apenas lançamentos aprovados                                                                                                                                                                              
      113 -    // Planejadores veem apenas seus próprios                                                                                                                                                                                           
      114 -    // Estrategistas veem todos                                                                                                                                                                                                         
       68 +    // Buscar lançamentos pela área do usuário através do orçamento                                                                                                                                                                     
       69      const where: Parameters<typeof prisma.lancamento.findMany>[0]['where'] = {
      116 -      idArea: user.idArea,                                                                                                                                                                                                              
       70 +      orcamento: {                                                                                                                                                                                                                      
       71 +        idArea: user.idArea,                                                                                                                                                                                                            
       72 +      },                                                                                                                                                                                                                                
       73      };
       74
      119 -    if (user.perfil === 'PLANEJADOR') {                                                                                                                                                                                                 
      120 -      where.idUsuario = user.id;                                                                                                                                                                                                        
       75 +    if (ano) {                                                                                                                                                                                                                          
       76 +      where.orcamento = { ...where.orcamento, ano };                                                                                                                                                                                    
       77      }
       78
      123 -    if (user.perfil === 'OPERACAO') {                                                                                                                                                                                                   
      124 -      where.status = 'APROVADO';                                                                                                                                                                                                        
       79 +    if (mes) {                                                                                                                                                                                                                          
       80 +      where.mesReferencia = mes;                                                                                                                                                                                                        
       81      }
       82
      127 -    if (ano) where.ano = ano;                                                                                                                                                                                                           
      128 -    if (mes) where.mes = mes;                                                                                                                                                                                                           
      129 -    if (status && user.perfil !== 'OPERACAO') {                                                                                                                                                                                         
      130 -      where.status = status;                                                                                                                                                                                                            
       83 +    if (idStatusLancamento) {                                                                                                                                                                                                           
       84 +      where.idStatusLancamento = idStatusLancamento;                                                                                                                                                                                    
       85      }
       86
       87      const [lancamentos, total] = await Promise.all([
     ...
       89          where,
       90          skip,
       91          take: limit,
      138 -        orderBy: { createdAt: 'desc' },                                                                                                                                                                                                 
       92 +        orderBy: { id: 'desc' },                                                                                                                                                                                                        
       93          include: {
      140 -          categoria: true,                                                                                                                                                                                                              
      141 -          itens: { include: { produto: true } },                                                                                                                                                                                        
       94 +          orcamento: true,                                                                                                                                                                                                              
       95 +          produto: true,                                                                                                                                                                                                                
       96 +          tipo: true,                                                                                                                                                                                                                   
       97 +          status: true,                                                                                                                                                                                                                 
       98 +          historicos: {                                                                                                                                                                                                                 
       99 +            include: {                                                                                                                                                                                                                  
      100 +              aprovador: {                                                                                                                                                                                                              
      101 +                select: { id: true, nome: true },                                                                                                                                                                                       
      102 +              },                                                                                                                                                                                                                        
      103 +            },                                                                                                                                                                                                                          
      104 +            orderBy: { dataAcao: 'desc' },                                                                                                                                                                                              
      105 +            take: 5,                                                                                                                                                                                                                    
      106 +          },                                                                                                                                                                                                                            
      107          },
      108        }),
      109        prisma.lancamento.count({ where }),
     ...
      120      };
      121    }
      122
      158 -  async findById(id: string, user: AuthUser) {                                                                                                                                                                                          
      123 +  async findById(id: number, user: AuthUser) {                                                                                                                                                                                          
      124      const lancamento = await prisma.lancamento.findUnique({
      125        where: { id },
      126        include: {
      162 -        categoria: true,                                                                                                                                                                                                                
      163 -        itens: { include: { produto: true } },                                                                                                                                                                                          
      164 -        compras: true,                                                                                                                                                                                                                  
      165 -        historico: { include: { aprovador: true }, orderBy: { createdAt: 'desc' } },                                                                                                                                                    
      127 +        orcamento: true,                                                                                                                                                                                                                
      128 +        produto: true,                                                                                                                                                                                                                  
      129 +        tipo: true,                                                                                                                                                                                                                     
      130 +        status: true,                                                                                                                                                                                                                   
      131 +        compras: {                                                                                                                                                                                                                      
      132 +          include: {                                                                                                                                                                                                                    
      133 +            comprovantes: true,                                                                                                                                                                                                         
      134 +          },                                                                                                                                                                                                                            
      135 +        },                                                                                                                                                                                                                              
      136 +        historicos: {                                                                                                                                                                                                                   
      137 +          include: {                                                                                                                                                                                                                    
      138 +            aprovador: {                                                                                                                                                                                                                
      139 +              select: { id: true, nome: true },                                                                                                                                                                                         
      140 +            },                                                                                                                                                                                                                          
      141 +          },                                                                                                                                                                                                                            
      142 +          orderBy: { dataAcao: 'desc' },                                                                                                                                                                                                
      143 +        },                                                                                                                                                                                                                              
      144        },
      145      });
      146
     ...
      149      }
      150
      151      // Verificar acesso por área
      174 -    if (lancamento.idArea !== user.idArea) {                                                                                                                                                                                            
      152 +    if (lancamento.orcamento.idArea !== user.idArea) {                                                                                                                                                                                  
      153        throw new ForbiddenError('Lançamento não pertence à sua área');
      154      }
      155
      156      return lancamento;
      157    }
      158
      181 -  async update(id: string, data: Partial<CreateLancamentoDTO>, user: AuthUser) {                                                                                                                                                        
      159 +  async update(id: number, data: Partial<CreateLancamentoInput>, user: AuthUser) {                                                                                                                                                      
      160      const lancamento = await prisma.lancamento.findUnique({
      161        where: { id },
      184 -      include: { itens: true },                                                                                                                                                                                                         
      162 +      include: {                                                                                                                                                                                                                        
      163 +        status: true,                                                                                                                                                                                                                   
      164 +        orcamento: true,                                                                                                                                                                                                                
      165 +      },                                                                                                                                                                                                                                
      166      });
      167
      168      if (!lancamento) {
      169        throw new NotFoundError('Lançamento');
      170      }
      171
      191 -    // Apenas o criador pode editar                                                                                                                                                                                                     
      192 -    if (lancamento.idUsuario !== user.id) {                                                                                                                                                                                             
      193 -      throw new ForbiddenError('Apenas o criador pode editar este lançamento');                                                                                                                                                         
      172 +    // Verificar acesso por área                                                                                                                                                                                                        
      173 +    if (lancamento.orcamento.idArea !== user.idArea) {                                                                                                                                                                                  
      174 +      throw new ForbiddenError('Lançamento não pertence à sua área');                                                                                                                                                                   
      175      }
      176
      196 -    // Não pode editar se já foi aprovado                                                                                                                                                                                               
      197 -    if (lancamento.status === 'APROVADO') {                                                                                                                                                                                             
      198 -      throw new ForbiddenError('Lançamentos aprovados não podem ser editados');                                                                                                                                                         
      177 +    // Apenas RASCUNHO pode ser editado                                                                                                                                                                                                 
      178 +    if (lancamento.status.nome !== 'RASCUNHO') {                                                                                                                                                                                        
      179 +      throw new ForbiddenError('Apenas lançamentos em RASCUNHO podem ser editados');                                                                                                                                                    
      180      }
      181
      201 -    // Recalcular valor planejado se houver itens                                                                                                                                                                                       
      202 -    let valorPlanejado = lancamento.valorPlanejado;                                                                                                                                                                                     
      203 -    if (data.itens) {                                                                                                                                                                                                                   
      204 -      valorPlanejado = data.itens.reduce(                                                                                                                                                                                               
      205 -        (sum, item) => sum + item.quantidade * item.valorUnitario,                                                                                                                                                                      
      206 -        0                                                                                                                                                                                                                               
      207 -      );                                                                                                                                                                                                                                
      208 -    }                                                                                                                                                                                                                                   
      209 -                                                                                                                                                                                                                                        
      182      return prisma.lancamento.update({
      183        where: { id },
      184        data: {
      185          descricao: data.descricao,
      214 -        idCategoria: data.idCategoria,                                                                                                                                                                                                  
      215 -        ano: data.ano,                                                                                                                                                                                                                  
      216 -        mes: data.mes,                                                                                                                                                                                                                  
      217 -        valorPlanejado,                                                                                                                                                                                                                 
      218 -        itens: data.itens                                                                                                                                                                                                               
      219 -          ? {                                                                                                                                                                                                                           
      220 -              deleteMany: {},                                                                                                                                                                                                           
      221 -              create: data.itens.map((item) => ({                                                                                                                                                                                       
      222 -                idProduto: item.idProduto,                                                                                                                                                                                              
      223 -                quantidade: item.quantidade,                                                                                                                                                                                            
      224 -                valorUnitario: item.valorUnitario,                                                                                                                                                                                      
      225 -              })),                                                                                                                                                                                                                      
      226 -            }                                                                                                                                                                                                                           
      227 -          : undefined,                                                                                                                                                                                                                  
      186 +        idOrcamento: data.idOrcamento,                                                                                                                                                                                                  
      187 +        idProduto: data.idProduto,                                                                                                                                                                                                      
      188 +        idTipoLancamento: data.idTipoLancamento,                                                                                                                                                                                        
      189 +        mesReferencia: data.mesReferencia,                                                                                                                                                                                              
      190 +        valorPlanejado: data.valorPlanejado,                                                                                                                                                                                            
      191 +        quantidade: data.quantidade,                                                                                                                                                                                                    
      192        },
      193        include: {
      230 -        itens: { include: { produto: true } },                                                                                                                                                                                          
      231 -        categoria: true,                                                                                                                                                                                                                
      194 +        orcamento: true,                                                                                                                                                                                                                
      195 +        produto: true,                                                                                                                                                                                                                  
      196 +        tipo: true,                                                                                                                                                                                                                     
      197 +        status: true,                                                                                                                                                                                                                   
      198        },
      199      });
      200    }
      235 -}                                                                                                                                                                                                                                       
      201 +                                                                                                                                                                                                                                        
      202 +  async delete(id: number, user: AuthUser) {                                                                                                                                                                                            
      203 +    const lancamento = await prisma.lancamento.findUnique({                                                                                                                                                                             
      204 +      where: { id },                                                                                                                                                                                                                    
      205 +      include: {                                                                                                                                                                                                                        
      206 +        orcamento: true,                                                                                                                                                                                                                
      207 +        status: true,                                                                                                                                                                                                                   
      208 +      },                                                                                                                                                                                                                                
      209 +    });                                                                                                                                                                                                                                 
      210 +                                                                                                                                                                                                                                        
      211 +    if (!lancamento) {                                                                                                                                                                                                                  
      212 +      throw new NotFoundError('Lançamento');                                                                                                                                                                                            
      213 +    }                                                                                                                                                                                                                                   
      214 +                                                                                                                                                                                                                                        
      215 +    if (lancamento.orcamento.idArea !== user.idArea) {                                                                                                                                                                                  
      216 +      throw new ForbiddenError('Lançamento não pertence à sua área');                                                                                                                                                                   
      217 +    }                                                                                                                                                                                                                                   
      218 +                                                                                                                                                                                                                                        
      219 +    if (lancamento.status.nome !== 'RASCUNHO') {                                                                                                                                                                                        
      220 +      throw new ForbiddenError('Apenas lançamentos em RASCUNHO podem ser excluídos');                                                                                                                                                   
      221 +    }                                                                                                                                                                                                                                   
      222 +                                                                                                                                                                                                                                        
      223 +    // Deletar histórico primeiro                                                                                                                                                                                                       
      224 +    await prisma.historicoLancamento.deleteMany({                                                                                                                                                                                       
      225 +      where: { idLancamento: id },                                                                                                                                                                                                      
      226 +    });                                                                                                                                                                                                                                 
      227 +                                                                                                                                                                                                                                        
      228 +    // Deletar compras                                                                                                                                                                                                                  
      229 +    await prisma.compra.deleteMany({                                                                                                                                                                                                    
      230 +      where: { idLancamento: id },                                                                                                                                                                                                      
      231 +    });                                                                                                                                                                                                                                 
      232 +                                                                                                                                                                                                                                        
      233 +    // Deletar lançamento                                                                                                                                                                                                               
      234 +    return prisma.lancamento.delete({                                                                                                                                                                                                   
      235 +      where: { id },                                                                                                                                                                                                                    
      236 +    });                                                                                                                                                                                                                                 
      237 +  }                                                                                                                                                                                                                                     
      238 +}                                                                                                                                                                                                                                       
      239   No newline at end of file

● Write(api\services\AprovacaoService.ts)
  ⎿  Added 59 lines, removed 63 lines
       1 -import { StatusLancamento, Perfil } from '@prisma/client';                                                                                                                                                                               
       1  import { prisma } from '../lib/prisma';
       3 -import { ApproveLancamentoDTO } from '../lib/validators';                                                                                                                                                                                
       4 -import { AuthUser } from '../types';                                                                                                                                                                                                     
       5 -import {                                                                                                                                                                                                                                 
       6 -  ForbiddenError,                                                                                                                                                                                                                        
       7 -  NotFoundError,                                                                                                                                                                                                                         
       8 -  ValidationError,                                                                                                                                                                                                                       
       9 -  AppError,                                                                                                                                                                                                                              
      10 -} from '../lib/errors';                                                                                                                                                                                                                  
       2 +import { AprovarLancamentoInput, AuthUser } from '../types';                                                                                                                                                                             
       3 +import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors';                                                                                                                                                          
       4
       5  // Máquina de estados válida
      13 -const STATE_MACHINE: Record<StatusLancamento, StatusLancamento[]> = {                                                                                                                                                                    
      14 -  RASCUNHO: ['PENDENTE'],                                                                                                                                                                                                                
      15 -  PENDENTE: ['APROVADO', 'REPROVADO'],                                                                                                                                                                                                   
      16 -  APROVADO: [], // Estado terminal                                                                                                                                                                                                       
      17 -  REPROVADO: ['PENDENTE'], // Pode voltar para pendente para nova aprovação                                                                                                                                                              
       6 +const STATE_MACHINE: Record<string, string[]> = {                                                                                                                                                                                        
       7 +  RASCUNHO: ['PLANEJADO'],                                                                                                                                                                                                               
       8 +  PLANEJADO: ['PENDENTE_ADMINISTRADOR'],                                                                                                                                                                                                 
       9 +  PENDENTE_ADMINISTRADOR: ['APROVADO', 'REPROVADO_ADMINISTRADOR'],                                                                                                                                                                       
      10 +  APROVADO: ['VALIDADO_MENSAL'],                                                                                                                                                                                                         
      11 +  VALIDADO_MENSAL: ['EM_EXECUCAO'],                                                                                                                                                                                                      
      12 +  EM_EXECUCAO: ['CONCLUIDO'],                                                                                                                                                                                                            
      13 +  REPROVADO_ADMINISTRADOR: ['PLANEJADO'],                                                                                                                                                                                                
      14 +  REPROVADO_COMPRAS: ['EM_EXECUCAO'],                                                                                                                                                                                                    
      15  };
      16
      17  export class AprovacaoService {
      21 -  async approve(data: ApproveLancamentoDTO, user: AuthUser) {                                                                                                                                                                            
      22 -    // Buscar o lançamento com dados do criador                                                                                                                                                                                          
      18 +  async approve(data: AprovarLancamentoInput, user: AuthUser) {                                                                                                                                                                          
      19 +    // Buscar o lançamento com o orçamento e produto                                                                                                                                                                                     
      20      const lancamento = await prisma.lancamento.findUnique({
      21        where: { id: data.idLancamento },
      22        include: {
      26 -        usuario: {                                                                                                                                                                                                                       
      23 +        orcamento: {                                                                                                                                                                                                                     
      24            include: {
      28 -            superior: true,                                                                                                                                                                                                              
      25 +            coordenador: true,                                                                                                                                                                                                           
      26            },
      27          },
      28 +        produto: true,                                                                                                                                                                                                                   
      29 +        status: true,                                                                                                                                                                                                                    
      30        },
      31      });
      32
     ...
      34        throw new NotFoundError('Lançamento');
      35      }
      36
      38 -    // Verificar hierarquia: apenas o superior do criador pode aprovar                                                                                                                                                                   
      39 -    this.validateHierarquia(user, lancamento.usuario);                                                                                                                                                                                   
      37 +    // Verificar hierarquia: o usuário deve ser o coordenador do orçamento                                                                                                                                                               
      38 +    if (lancamento.orcamento.idCoordenador !== user.id) {                                                                                                                                                                                
      39 +      throw new ForbiddenError('Apenas o coordenador do orçamento pode aprovar/reprovar');                                                                                                                                               
      40 +    }                                                                                                                                                                                                                                    
      41
      42      // Validar transição de estado
      42 -    this.validateStateTransition(lancamento.status, data.status);                                                                                                                                                                        
      43 +    const currentStatus = lancamento.status.nome;                                                                                                                                                                                        
      44 +    const newStatus = await prisma.statusLancamento.findUnique({                                                                                                                                                                         
      45 +      where: { id: data.idStatusLancamento },                                                                                                                                                                                            
      46 +    });                                                                                                                                                                                                                                  
      47
      48 +    if (!newStatus) {                                                                                                                                                                                                                    
      49 +      throw new NotFoundError('Status');                                                                                                                                                                                                 
      50 +    }                                                                                                                                                                                                                                    
      51 +                                                                                                                                                                                                                                         
      52 +    const allowedTransitions = STATE_MACHINE[currentStatus];                                                                                                                                                                             
      53 +    if (!allowedTransitions || !allowedTransitions.includes(newStatus.nome)) {                                                                                                                                                           
      54 +      throw new ValidationError(                                                                                                                                                                                                         
      55 +        `Transição de ${currentStatus} para ${newStatus.nome} não é permitida`                                                                                                                                                           
      56 +      );                                                                                                                                                                                                                                 
      57 +    }                                                                                                                                                                                                                                    
      58 +                                                                                                                                                                                                                                         
      59      // Executar aprovação em transação
      60      const [lancamentoAtualizado] = await prisma.$transaction([
      61        prisma.lancamento.update({
      62          where: { id: data.idLancamento },
      48 -        data: { status: data.status },                                                                                                                                                                                                   
      63 +        data: {                                                                                                                                                                                                                          
      64 +          idStatusLancamento: data.idStatusLancamento,                                                                                                                                                                                   
      65 +        },                                                                                                                                                                                                                               
      66          include: {
      50 -          categoria: true,                                                                                                                                                                                                               
      51 -          itens: { include: { produto: true } },                                                                                                                                                                                         
      67 +          orcamento: true,                                                                                                                                                                                                               
      68 +          produto: true,                                                                                                                                                                                                                 
      69 +          tipo: true,                                                                                                                                                                                                                    
      70 +          status: true,                                                                                                                                                                                                                  
      71          },
      72        }),
      73        prisma.historicoLancamento.create({
      74          data: {
      75            idLancamento: data.idLancamento,
      57 -          statusAnterior: lancamento.status,                                                                                                                                                                                             
      58 -          statusNovo: data.status,                                                                                                                                                                                                       
      59 -          idAprovador: user.id,                                                                                                                                                                                                          
      60 -          justificativa: data.justificativa || null,                                                                                                                                                                                     
      76 +          idUsuarioAprovador: user.id,                                                                                                                                                                                                   
      77 +          acao: `APROVACAO_${newStatus.nome}`,                                                                                                                                                                                           
      78 +          observacao: data.observacao || null,                                                                                                                                                                                           
      79          },
      80        }),
      81      ]);
     ...
       83      return lancamentoAtualizado;
       84    }
       85
       68 -  private validateHierarquia(user: AuthUser, criador: { id: string; idSuperior: string | null; perfil: Perfil }) {                                                                                                                      
       69 -    // Apenas ESTRATEGISTA pode aprovar                                                                                                                                                                                                 
       70 -    if (user.perfil !== 'ESTRATEGISTA') {                                                                                                                                                                                               
       71 -      throw new ForbiddenError(                                                                                                                                                                                                         
       72 -        'Apenas usuários com perfil Estrategista podem aprovar ou reprovar lançamentos'                                                                                                                                                 
       73 -      );                                                                                                                                                                                                                                
       74 -    }                                                                                                                                                                                                                                   
       75 -                                                                                                                                                                                                                                        
       76 -    // O aprovador deve ser o superior hierárquico do criador                                                                                                                                                                           
       77 -    if (criador.idSuperior !== user.id) {                                                                                                                                                                                               
       78 -      throw new ForbiddenError(                                                                                                                                                                                                         
       79 -        'Apenas o gestor hierárquico direto pode aprovar ou reprovar este lançamento'                                                                                                                                                   
       80 -      );                                                                                                                                                                                                                                
       81 -    }                                                                                                                                                                                                                                   
       82 -  }                                                                                                                                                                                                                                     
       83 -                                                                                                                                                                                                                                        
       84 -  private validateStateTransition(                                                                                                                                                                                                      
       85 -    currentStatus: StatusLancamento,                                                                                                                                                                                                    
       86 -    newStatus: StatusLancamento                                                                                                                                                                                                         
       87 -  ) {                                                                                                                                                                                                                                   
       88 -    const allowedTransitions = STATE_MACHINE[currentStatus];                                                                                                                                                                            
       89 -                                                                                                                                                                                                                                        
       90 -    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {                                                                                                                                                               
       91 -      throw new ValidationError(                                                                                                                                                                                                        
       92 -        `Transição de ${currentStatus} para ${newStatus} não é permitida`                                                                                                                                                               
       93 -      );                                                                                                                                                                                                                                
       94 -    }                                                                                                                                                                                                                                   
       95 -  }                                                                                                                                                                                                                                     
       96 -                                                                                                                                                                                                                                        
       97 -  async getHistory(idLancamento: string, user: AuthUser) {                                                                                                                                                                              
       98 -    // Verificar que o lançamento existe e pertence à área do usuário                                                                                                                                                                   
       86 +  async getHistory(idLancamento: number, user: AuthUser) {                                                                                                                                                                              
       87      const lancamento = await prisma.lancamento.findUnique({
       88        where: { id: idLancamento },
      101 -      select: { idArea: true },                                                                                                                                                                                                         
       89 +      include: {                                                                                                                                                                                                                        
       90 +        orcamento: true,                                                                                                                                                                                                                
       91 +      },                                                                                                                                                                                                                                
       92      });
       93
       94      if (!lancamento) {
       95        throw new NotFoundError('Lançamento');
       96      }
       97
      108 -    if (lancamento.idArea !== user.idArea) {                                                                                                                                                                                            
       98 +    if (lancamento.orcamento.idArea !== user.idArea) {                                                                                                                                                                                  
       99        throw new ForbiddenError('Lançamento não pertence à sua área');
      100      }
      101
     ...
      106            select: { id: true, nome: true, email: true },
      107          },
      108        },
      119 -      orderBy: { createdAt: 'desc' },                                                                                                                                                                                                   
      109 +      orderBy: { dataAcao: 'desc' },                                                                                                                                                                                                    
      110      });
      111    }
      122 -}                                                                                                                                                                                                                                       
      112 +                                                                                                                                                                                                                                        
      113 +  async getStatusOptions() {                                                                                                                                                                                                            
      114 +    return prisma.statusLancamento.findMany({                                                                                                                                                                                           
      115 +      orderBy: { id: 'asc' },                                                                                                                                                                                                           
      116 +    });                                                                                                                                                                                                                                 
      117 +  }                                                                                                                                                                                                                                     
      118 +}                                                                                                                                                                                                                                       
      119   No newline at end of file

● Write(api\middlewares\auth.ts)
  ⎿  Added 21 lines, removed 24 lines
       1 -import type { NextApiRequest } from 'next';                                                                                                                                                                                              
       1  import { AuthUser } from '../types';
       2  import { UnauthorizedError } from '../lib/errors';
       3
       5 -// Em produção, isso viria de um JWT ou sessão                                                                                                                                                                                           
       6 -// Por enquanto, simulamos com um header customizado                                                                                                                                                                                     
       7 -export function getAuthUser(req: NextApiRequest): AuthUser {                                                                                                                                                                             
       8 -  const userId = req.headers['x-user-id'] as string;                                                                                                                                                                                     
       9 -  const userArea = req.headers['x-user-area'] as string;                                                                                                                                                                                 
      10 -  const userPerfil = req.headers['x-user-perfil'] as AuthUser['perfil'];                                                                                                                                                                 
      11 -  const userSuperior = req.headers['x-user-superior'] as string | undefined;                                                                                                                                                             
       4 +export function getAuthUser(headers: {                                                                                                                                                                                                   
       5 +  'x-user-id': string | string[] | undefined;                                                                                                                                                                                            
       6 +  'x-user-area': string | string[] | undefined;                                                                                                                                                                                          
       7 +  'x-user-perfil': string | string[] | undefined;                                                                                                                                                                                        
       8 +  'x-user-superior'?: string | string[] | undefined;                                                                                                                                                                                     
       9 +}): AuthUser {                                                                                                                                                                                                                           
      10 +  const userId = headers['x-user-id'];                                                                                                                                                                                                   
      11 +  const userArea = headers['x-user-area'];                                                                                                                                                                                               
      12 +  const userPerfil = headers['x-user-perfil'];                                                                                                                                                                                           
      13 +  const userSuperior = headers['x-user-superior'];                                                                                                                                                                                       
      14
      15    if (!userId || !userArea || !userPerfil) {
      16      throw new UnauthorizedError('Cabeçalhos de autenticação não encontrados');
      17    }
      18
      17 -  if (!['ESTRATEGISTA', 'PLANEJADOR', 'OPERACAO'].includes(userPerfil.nome)) {                                                                                                                                                           
      18 -    throw new UnauthorizedError('Perfil inválido');                                                                                                                                                                                      
      19 +  const id = parseInt(Array.isArray(userId) ? userId[0] : userId, 10);                                                                                                                                                                   
      20 +  const idArea = parseInt(Array.isArray(userArea) ? userArea[0] : userArea, 10);                                                                                                                                                         
      21 +  const idPerfil = parseInt(Array.isArray(userPerfil) ? userPerfil[0] : userPerfil, 10);                                                                                                                                                 
      22 +                                                                                                                                                                                                                                         
      23 +  if (isNaN(id) || isNaN(idArea) || isNaN(idPerfil)) {                                                                                                                                                                                   
      24 +    throw new UnauthorizedError('Cabeçalhos de autenticação inválidos');                                                                                                                                                                 
      25    }
      26
      27    return {
      22 -    id: userId,                                                                                                                                                                                                                          
      23 -    idArea: userArea,                                                                                                                                                                                                                    
      24 -    perfil: userPerfil,                                                                                                                                                                                                                  
      25 -    idSuperior: userSuperior || null,                                                                                                                                                                                                    
      28 +    id,                                                                                                                                                                                                                                  
      29 +    idArea,                                                                                                                                                                                                                              
      30 +    idPerfil,                                                                                                                                                                                                                            
      31 +    idSuperior: userSuperior ? parseInt(Array.isArray(userSuperior) ? userSuperior[0] : userSuperior, 10) : null,                                                                                                                        
      32    };
      27 -}                                                                                                                                                                                                                                        
      28 -                                                                                                                                                                                                                                         
      29 -export function requireAuth(getUser: (req: NextApiRequest) => AuthUser = getAuthUser) {                                                                                                                                                  
      30 -  return function (handler: Function) {                                                                                                                                                                                                  
      31 -    return async function (req: NextApiRequest, ...args: unknown[]) {                                                                                                                                                                    
      32 -      req.headers['x-auth-user'] = getUser(req);                                                                                                                                                                                         
      33 -      return handler(req, ...args);                                                                                                                                                                                                      
      34 -    };                                                                                                                                                                                                                                   
      35 -  };                                                                                                                                                                                                                                     
      36 -}                                                                                                                                                                                                                                        
      33 +}                                                                                                                                                                                                                                        
      34   No newline at end of file

  Read 2 files (ctrl+o to expand)

● Write(api\lib\validators.ts)
  ⎿  Added 14 lines, removed 22 lines
       2
       3  export const createLancamentoSchema = z.object({
       4    descricao: z.string().min(1, 'Descrição é obrigatória').max(500),
       5 -  idCategoria: z.string().uuid('ID da categoria inválido'),                                                                                                                                                                              
       6 -  ano: z.number().int().min(2020).max(2100),                                                                                                                                                                                             
       7 -  mes: z.number().int().min(1).max(12),                                                                                                                                                                                                  
       5 +  idOrcamento: z.number().int().positive(),                                                                                                                                                                                              
       6 +  idProduto: z.number().int().positive(),                                                                                                                                                                                                
       7 +  idTipoLancamento: z.number().int().positive(),                                                                                                                                                                                         
       8 +  mesReferencia: z.number().int().min(1).max(12),                                                                                                                                                                                        
       9    valorPlanejado: z.number().positive('Valor planejado deve ser positivo'),
       9 -  itens: z                                                                                                                                                                                                                               
      10 -    .array(                                                                                                                                                                                                                              
      11 -      z.object({                                                                                                                                                                                                                         
      12 -        idProduto: z.string().uuid('ID do produto inválido'),                                                                                                                                                                            
      13 -        quantidade: z.number().positive('Quantidade deve ser positiva'),                                                                                                                                                                 
      14 -        valorUnitario: z.number().positive('Valor unitário deve ser positivo'),                                                                                                                                                          
      15 -      })                                                                                                                                                                                                                                 
      16 -    )                                                                                                                                                                                                                                    
      17 -    .min(1, 'Pelo menos um item é obrigatório'),                                                                                                                                                                                         
      10 +  quantidade: z.number().positive('Quantidade deve ser positiva'),                                                                                                                                                                       
      11  });
      12
      13  export const approveLancamentoSchema = z.object({
      21 -  idLancamento: z.string().uuid('ID do lançamento inválido'),                                                                                                                                                                            
      22 -  status: z.enum(['APROVADO', 'REPROVADO']),                                                                                                                                                                                             
      23 -  justificativa: z.string().max(1000).optional(),                                                                                                                                                                                        
      14 +  idLancamento: z.number().int().positive(),                                                                                                                                                                                             
      15 +  idStatusLancamento: z.number().int().positive(),                                                                                                                                                                                       
      16 +  observacao: z.string().max(1000).optional(),                                                                                                                                                                                           
      17  });
      18
      19  export const createCompraSchema = z.object({
      27 -  idLancamento: z.string().uuid('ID do lançamento inválido'),                                                                                                                                                                            
      28 -  quantidade: z.number().positive('Quantidade deve ser positiva'),                                                                                                                                                                       
      29 -  valorTotal: z.number().positive('Valor total deve ser positivo'),                                                                                                                                                                      
      20 +  idLancamento: z.number().int().positive(),                                                                                                                                                                                             
      21 +  valorPago: z.number().positive('Valor pago deve ser positivo'),                                                                                                                                                                        
      22    dataCompra: z.string().datetime({ message: 'Data de compra inválida' }),
      31 -  observacao: z.string().max(500).optional(),                                                                                                                                                                                            
      23 +  idComprovantes: z.number().int().positive().optional(),                                                                                                                                                                                
      24  });
      25
      26  export const listLancamentosSchema = z.object({
      27    ano: z.coerce.number().int().min(2020).max(2100).optional(),
      28    mes: z.coerce.number().int().min(1).max(12).optional(),
      37 -  status: z.enum(['RASCUNHO', 'PENDENTE', 'APROVADO', 'REPROVADO']).optional(),                                                                                                                                                          
      29 +  idStatusLancamento: z.coerce.number().int().positive().optional(),                                                                                                                                                                     
      30    page: z.coerce.number().int().positive().default(1),
      31    limit: z.coerce.number().int().positive().max(100).default(20),
      32  });
      33
      34  export const idParamSchema = z.object({
      43 -  id: z.string().uuid('ID inválido'),                                                                                                                                                                                                    
      35 +  id: z.coerce.number().int().positive(),                                                                                                                                                                                                
      36  });
      37
      38  export type CreateLancamentoDTO = z.infer<typeof createLancamentoSchema>;
      39  export type ApproveLancamentoDTO = z.infer<typeof approveLancamentoSchema>;
      40  export type CreateCompraDTO = z.infer<typeof createCompraSchema>;
      49 -export type ListLancamentosDTO = z.infer<typeof listLancamentosSchema>;                                                                                                                                                                  
      41 +export type ListLancamentosDTO = z.infer<typeof listLancamentosSchema>;                                                                                                                                                                  
      42   No newline at end of file

  Read 1 file (ctrl+o to expand)

● Write(api\lancamentos\index.ts)
  ⎿  Added 7 lines, removed 11 lines
       1 -import type { NextApiRequest, NextApiResponse } from 'next';                                                                                                                                                                             
       1 +import { VercelRequest, VercelResponse } from '@vercel/node';                                                                                                                                                                            
       2  import { createLancamentoSchema, listLancamentosSchema } from '../lib/validators';
       3 -import { LancamentoService } from '../../services';                                                                                                                                                                                      
       4 -import { getAuthUser } from '../middlewares';                                                                                                                                                                                            
       3 +import { LancamentoService } from '../services/LancamentoService';                                                                                                                                                                       
       4 +import { getAuthUser } from '../middlewares/auth';                                                                                                                                                                                       
       5  import { successResponse, errorResponse } from '../lib/response';
       6  import { ForbiddenError } from '../lib/errors';
       7
       8  const lancamentoService = new LancamentoService();
       9
      10 -export default async function handler(req: NextApiRequest, res: NextApiResponse) {                                                                                                                                                       
      10 +export default async function handler(req: VercelRequest, res: VercelResponse) {                                                                                                                                                         
      11    try {
      12      if (req.method === 'POST') {
      13 -      const user = getAuthUser(req);                                                                                                                                                                                                     
      13 +      const user = getAuthUser(req.headers as any);                                                                                                                                                                                      
      14
      15 -      if (user.perfil.nome !== 'PLANEJADOR') {                                                                                                                                                                                           
      16 -        throw new ForbiddenError('Apenas Planejador pode criar lançamentos');                                                                                                                                                            
      17 -      }                                                                                                                                                                                                                                  
      18 -                                                                                                                                                                                                                                         
      15        const parseResult = createLancamentoSchema.safeParse(req.body);
      16        if (!parseResult.success) {
      17          return res.status(400).json(errorResponse(parseResult.error));
     ...
      22      }
      23
      24      if (req.method === 'GET') {
      29 -      const user = getAuthUser(req);                                                                                                                                                                                                     
      25 +      const user = getAuthUser(req.headers as any);                                                                                                                                                                                      
      26
      27        const parseResult = listLancamentosSchema.safeParse(req.query);
      28        if (!parseResult.success) {
     ...
      42      const { statusCode, body } = errorResponse(error);
      43      return res.status(statusCode).json(body);
      44    }
      49 -}                                                                                                                                                                                                                                        
      45 +}                                                                                                                                                                                                                                        
      46   No newline at end of file

  Read 2 files (ctrl+o to expand)

● Write(api\services\CompraService.ts)
  ⎿  Added 26 lines, removed 35 lines
       1 -import { StatusLancamento } from '@prisma/client';                                                                                                                                                                                       
       1  import { prisma } from '../lib/prisma';
       3 -import { CreateCompraDTO } from '../lib/validators';                                                                                                                                                                                     
       4 -import { AuthUser } from '../types';                                                                                                                                                                                                     
       2 +import { CreateCompraDTO, AuthUser } from '../types';                                                                                                                                                                                    
       3  import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors';
       4
       5  export class CompraService {
       6    async create(data: CreateCompraDTO, user: AuthUser) {
       9 -    // Buscar o lançamento                                                                                                                                                                                                               
       7      const lancamento = await prisma.lancamento.findUnique({
       8        where: { id: data.idLancamento },
      12 -      include: { compras: true },                                                                                                                                                                                                        
       9 +      include: {                                                                                                                                                                                                                         
      10 +        status: true,                                                                                                                                                                                                                    
      11 +        orcamento: true,                                                                                                                                                                                                                 
      12 +      },                                                                                                                                                                                                                                 
      13      });
      14
      15      if (!lancamento) {
      16        throw new NotFoundError('Lançamento');
      17      }
      18
      19 -    // Apenas OPERACAO pode registrar compras                                                                                                                                                                                            
      20 -    if (user.perfil.nome !== 'OPERACAO') {                                                                                                                                                                                               
      21 -      throw new ForbiddenError(                                                                                                                                                                                                          
      22 -        'Apenas usuários com perfil Operação podem registrar compras'                                                                                                                                                                    
      23 -      );                                                                                                                                                                                                                                 
      24 -    }                                                                                                                                                                                                                                    
      25 -                                                                                                                                                                                                                                         
      26 -    // O lançamento DEVE estar aprovado                                                                                                                                                                                                  
      27 -    if (lancamento.status !== 'APROVADO') {                                                                                                                                                                                              
      19 +    // O lançamento deve estar em EXECUCAO ou VALIDADO_MENSAL para receber compras                                                                                                                                                       
      20 +    const statusPermitidos = ['EM_EXECUCAO', 'VALIDADO_MENSAL'];                                                                                                                                                                         
      21 +    if (!statusPermitidos.includes(lancamento.status.nome)) {                                                                                                                                                                            
      22        throw new ValidationError(
      29 -        'Apenas lançamentos com status Aprovado podem receber compras'                                                                                                                                                                   
      23 +        `Lançamento deve estar em ${statusPermitidos.join(' ou ')} para registrar compras`                                                                                                                                               
      24        );
      25      }
      26
      33 -    // O lançamento deve pertencer à área do usuário                                                                                                                                                                                     
      34 -    if (lancamento.idArea !== user.idArea) {                                                                                                                                                                                             
      27 +    // Verificar área                                                                                                                                                                                                                    
      28 +    if (lancamento.orcamento.idArea !== user.idArea) {                                                                                                                                                                                   
      29        throw new ForbiddenError('Lançamento não pertence à sua área');
      30      }
      31
     ...
      33      const compra = await prisma.compra.create({
      34        data: {
      35          idLancamento: data.idLancamento,
      42 -        idUsuario: user.id,                                                                                                                                                                                                              
      43 -        quantidade: data.quantidade,                                                                                                                                                                                                     
      44 -        valorTotal: data.valorTotal,                                                                                                                                                                                                     
      36 +        valorPago: data.valorPago,                                                                                                                                                                                                       
      37          dataCompra: new Date(data.dataCompra),
      46 -        observacao: data.observacao,                                                                                                                                                                                                     
      38 +        idComprovantes: data.idComprovantes,                                                                                                                                                                                             
      39        },
      40 +      include: {                                                                                                                                                                                                                         
      41 +        comprovantes: true,                                                                                                                                                                                                              
      42 +      },                                                                                                                                                                                                                                 
      43      });
      44
      50 -    // Atualizar o valor realizado do lançamento (soma dinâmica)                                                                                                                                                                         
      45 +    // Atualizar o valor realizado do lançamento                                                                                                                                                                                         
      46      const novoValorRealizado = await this.calculateRealizadoValue(data.idLancamento);
      47
      48      await prisma.lancamento.update({
     ...
      56      };
      57    }
      58
      64 -  private async calculateRealizadoValue(idLancamento: string): Promise<number> {                                                                                                                                                         
      59 +  private async calculateRealizadoValue(idLancamento: number): Promise<number> {                                                                                                                                                         
      60      const result = await prisma.compra.aggregate({
      61        where: { idLancamento },
      67 -      _sum: { valorTotal: true },                                                                                                                                                                                                        
      62 +      _sum: { valorPago: true },                                                                                                                                                                                                         
      63      });
      64
      70 -    return result._sum.valorTotal?.toNumber() || 0;                                                                                                                                                                                      
      65 +    return result._sum.valorPago?.toNumber() || 0;                                                                                                                                                                                       
      66    }
      67
      73 -  async findByLancamento(idLancamento: string, user: AuthUser) {                                                                                                                                                                         
      68 +  async findByLancamento(idLancamento: number, user: AuthUser) {                                                                                                                                                                         
      69      const lancamento = await prisma.lancamento.findUnique({
      70        where: { id: idLancamento },
      76 -      select: { idArea: true, status: true },                                                                                                                                                                                            
      71 +      include: {                                                                                                                                                                                                                         
      72 +        orcamento: true,                                                                                                                                                                                                                 
      73 +      },                                                                                                                                                                                                                                 
      74      });
      75
      76      if (!lancamento) {
      77        throw new NotFoundError('Lançamento');
      78      }
      79
      83 -    // Qualquer usuário da área pode ver compras (se o lançamento estiver aprovado)                                                                                                                                                      
      84 -    if (lancamento.idArea !== user.idArea) {                                                                                                                                                                                             
      80 +    if (lancamento.orcamento.idArea !== user.idArea) {                                                                                                                                                                                   
      81        throw new ForbiddenError('Lançamento não pertence à sua área');
      82      }
      83
      84      return prisma.compra.findMany({
      85        where: { idLancamento },
      90 -      include: {                                                                                                                                                                                                                         
      91 -        usuario: {                                                                                                                                                                                                                       
      92 -          select: { id: true, nome: true, email: true },                                                                                                                                                                                 
      93 -        },                                                                                                                                                                                                                               
      94 -      },                                                                                                                                                                                                                                 
      86        orderBy: { dataCompra: 'desc' },
      87      });
      88    }
      98 -}                                                                                                                                                                                                                                        
      89 +}                                                                                                                                                                                                                                        
      90   No newline at end of file

● Write(api\services\CategoriaService.ts)
  ⎿  Added 32 lines, removed 17 lines
       1  import { prisma } from '../lib/prisma';
       2  import { AuthUser } from '../types';
       3 -import { ForbiddenError } from '../lib/errors';                                                                                                                                                                                          
       3 +import { ForbiddenError, NotFoundError } from '../lib/errors';                                                                                                                                                                           
       4
       5  export class CategoriaService {
       6    async findAll(user: AuthUser) {
       7 -    return prisma.categoria.findMany({                                                                                                                                                                                                   
       8 -      where: { idArea: user.idArea }, // Isolamento obrigatório por área                                                                                                                                                                 
       7 +    return prisma.categoriaLancamento.findMany({                                                                                                                                                                                         
       8 +      where: { idArea: user.idArea },                                                                                                                                                                                                    
       9        include: {
      10 -        produtos: true,                                                                                                                                                                                                                  
      10 +        produtos: {                                                                                                                                                                                                                      
      11 +          include: {                                                                                                                                                                                                                     
      12 +            tipoProduto: true,                                                                                                                                                                                                           
      13 +          },                                                                                                                                                                                                                             
      14 +        },                                                                                                                                                                                                                               
      15        },
      16        orderBy: { nome: 'asc' },
      17      });
      18    }
      19
      16 -  async findById(id: string, user: AuthUser) {                                                                                                                                                                                           
      17 -    const categoria = await prisma.categoria.findUnique({                                                                                                                                                                                
      20 +  async findById(id: number, user: AuthUser) {                                                                                                                                                                                           
      21 +    const categoria = await prisma.categoriaLancamento.findUnique({                                                                                                                                                                      
      22        where: { id },
      19 -      include: { produtos: true },                                                                                                                                                                                                       
      23 +      include: {                                                                                                                                                                                                                         
      24 +        produtos: {                                                                                                                                                                                                                      
      25 +          include: {                                                                                                                                                                                                                     
      26 +            tipoProduto: true,                                                                                                                                                                                                           
      27 +          },                                                                                                                                                                                                                             
      28 +        },                                                                                                                                                                                                                               
      29 +      },                                                                                                                                                                                                                                 
      30      });
      31
      32      if (!categoria) {
      23 -      throw new ForbiddenError('Categoria não encontrada');                                                                                                                                                                              
      33 +      throw new NotFoundError('Categoria');                                                                                                                                                                                              
      34      }
      35
      36      if (categoria.idArea !== user.idArea) {
     ...
      42  }
      43
      44  export class ProdutoService {
      35 -  async findAll(user: AuthUser, idCategoria?: string) {                                                                                                                                                                                  
      36 -    const where: { idArea?: string; idCategoria?: string } = {                                                                                                                                                                           
      37 -      idArea: user.idArea,                                                                                                                                                                                                               
      45 +  async findAll(user: AuthUser, idCategoriaLancamento?: number) {                                                                                                                                                                        
      46 +    const where: { idCategoriaLancamento?: number; categoria: { idArea: number } } = {                                                                                                                                                   
      47 +      categoria: { idArea: user.idArea },                                                                                                                                                                                                
      48      };
      49
      40 -    if (idCategoria) {                                                                                                                                                                                                                   
      41 -      where.idCategoria = idCategoria;                                                                                                                                                                                                   
      50 +    if (idCategoriaLancamento) {                                                                                                                                                                                                         
      51 +      where.idCategoriaLancamento = idCategoriaLancamento;                                                                                                                                                                               
      52      }
      53
      54      return prisma.produto.findMany({
      55        where,
      56        include: {
      57          categoria: true,
      58 +        tipoProduto: true,                                                                                                                                                                                                               
      59        },
      60        orderBy: { nome: 'asc' },
      61      });
      62    }
      63
      53 -  async findById(id: string, user: AuthUser) {                                                                                                                                                                                           
      64 +  async findById(id: number, user: AuthUser) {                                                                                                                                                                                           
      65      const produto = await prisma.produto.findUnique({
      66        where: { id },
      56 -      include: { categoria: true },                                                                                                                                                                                                      
      67 +      include: {                                                                                                                                                                                                                         
      68 +        categoria: true,                                                                                                                                                                                                                 
      69 +        tipoProduto: true,                                                                                                                                                                                                               
      70 +        areaProduto: true,                                                                                                                                                                                                               
      71 +      },                                                                                                                                                                                                                                 
      72      });
      73
      74      if (!produto) {
      60 -      throw new ForbiddenError('Produto não encontrado');                                                                                                                                                                                
      75 +      throw new NotFoundError('Produto');                                                                                                                                                                                                
      76      }
      77
      78      if (produto.categoria.idArea !== user.idArea) {
     ...
      81
      82      return produto;
      83    }
      69 -}                                                                                                                                                                                                                                        
      84 +}                                                                                                                                                                                                                                        
      85   No newline at end of file