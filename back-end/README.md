# API de Controle de Gastos - Planejamento Orçamentário Anual

API Serverless para gestão de planejamento orçamentário anual, hospedada na Vercel.

## Stack Tecnológica

- **Runtime**: Node.js 18+ (Vercel Serverless Functions)
- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Validação**: Zod

## Estrutura do Projeto

```
├── api/
│   ├── lib/              # Utilitários compartilhados
│   │   ├── errors.ts     # Classes de erro customizadas
│   │   ├── prisma.ts     # Cliente Prisma singleton
│   │   ├── response.ts   # Formatadores de resposta
│   │   └── validators.ts # Schemas Zod
│   ├── middlewares/       # Middlewares de autenticação e RBAC
│   ├── services/         # Lógica de negócio
│   ├── types/            # Tipos TypeScript
│   ├── categorias/       # GET /api/categorias
│   ├── compras/          # POST /api/compras
│   └── lancamentos/      # CRUD /api/lancamentos
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
└── vercel.json           # Configuração Vercel
```

## Instalação

```bash
npm install
cp .env.example .env  # Configure o DATABASE_URL
npx prisma generate
npx prisma db push   # Cria as tabelas no banco
```

## Variáveis de Ambiente

```env
DATABASE_URL="postgresql://..."
```

## Autenticação

A API utiliza headers customizados para simulação de autenticação:

| Header | Descrição |
|--------|-----------|
| `x-user-id` | ID do usuário |
| `x-user-area` | ID da área |
| `x-user-perfil` | ESTRATEGISTA / PLANEJADOR / OPERACAO |
| `x-user-superior` | ID do superior hierárquico (opcional) |

## Endpoints

### POST /api/lancamentos
Criar novo lançamento (apenas PLANEJADOR).

**Body:**
```json
{
  "descricao": "Compra de equipamentos",
  "idCategoria": "uuid",
  "ano": 2024,
  "mes": 6,
  "valorPlanejado": 15000.00,
  "itens": [
    {
      "idProduto": "uuid",
      "quantidade": 5,
      "valorUnitario": 3000.00
    }
  ]
}
```

**Resposta (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "descricao": "Compra de equipamentos",
    "status": "PENDENTE",
    "valorPlanejado": 15000.00,
    "valorRealizado": 0,
    ...
  }
}
```

### GET /api/lancamentos
Listar lançamentos com filtros.

**Query:** `?ano=2024&mes=6&status=PENDENTE&page=1&limit=20`

### GET /api/lancamentos/[id]
Obter detalhes de um lançamento.

### POST /api/lancamentos/aprovar
Aprovar ou reprovar lançamento (apenas ESTRATEGISTA).

**Body:**
```json
{
  "idLancamento": "uuid",
  "status": "APROVADO",
  "justificativa": "Aprovado para Q2"
}
```

### POST /api/compras
Registrar compra em lançamento aprovado (apenas OPERACAO).

**Body:**
```json
{
  "idLancamento": "uuid",
  "quantidade": 2,
  "valorTotal": 6000.00,
  "dataCompra": "2024-06-15T10:30:00Z",
  "observacao": "Compra via fornecedor X"
}
```

### GET /api/categorias
Listar categorias da área do usuário.

**Query:** `?tipo=produtos&idCategoria=uuid`

## Regras de Negócio

### Hierarquia de Aprovação
- Lançamentos criados por PLANEJADOR iniciam como `PENDENTE`
- Apenas o superior hierárquico (ESTRATEGISTA) pode aprovar/reprovar

### Máquina de Estados
```
RASCUNHO → PENDENTE → APROVADO
                    → REPROVADO → PENDENTE
```

### Valor Realizado
- Não é editável manualmente
- É calculado automaticamente pela soma das compras vinculadas

### Isolamento por Área
- Categorias, produtos e lançamentos são sempre filtrados pela `idArea` do usuário

## Perfis de Acesso (RBAC)

| Perfil | Permissões |
|--------|------------|
| ESTRATEGISTA | Aprovar/reprovar subordinados, visualizar |
| PLANEJADOR | Criar/editar lançamentos próprios, visualizar |
| OPERACAO | Registrar compras em lançamentos aprovados, visualizar |

## Exemplos com cURL

```bash
# Criar lançamento
curl -X POST http://localhost:3000/api/lancamentos \
  -H "Content-Type: application/json" \
  -H "x-user-id: uuid" \
  -H "x-user-area: uuid" \
  -H "x-user-perfil: PLANEJADOR" \
  -d '{...}'

# Aprovar lançamento
curl -X POST http://localhost:3000/api/lancamentos/aprovar \
  -H "Content-Type: application/json" \
  -H "x-user-id: uuid" \
  -H "x-user-area: uuid" \
  -H "x-user-perfil: ESTRATEGISTA" \
  -H "x-user-superior: uuid" \
  -d '{"idLancamento":"...","status":"APROVADO","justificativa":"Ok"}'
```

## Deploy

```bash
npm run deploy
```
