# Referência do Projeto - Controle de Gastos API

## Visão Geral do Projeto

API Serverless para **Planejamento Orçamentário Anual** com fluxo de aprovação hierárquico. Desenvolvida para deploy no Vercel, mas com intenção de rodar localmente para desenvolvimento e testes.

---

## Estrutura do Projeto

```
back-end/
├── api/
│   ├── categorias/index.ts       # GET - Lista categorias e produtos
│   ├── compras/index.ts          # POST - Registra compras
│   ├── lancamentos/
│   │   ├── index.ts              # GET/POST - Lista e cria lançamentos
│   │   ├── [id]/index.ts         # GET/PUT/DELETE - CRUD por ID
│   │   └── aprovar/index.ts       # POST - Aprova/reprova lançamentos
│   ├── lib/
│   │   ├── errors.ts             # Classes de erro customizadas
│   │   ├── prisma.ts             # Cliente Prisma singleton
│   │   ├── response.ts           # Helpers de resposta API
│   │   └── validators.ts        # Schemas Zod
│   ├── middlewares/
│   │   ├── auth.ts               # getAuthUser() - Extrai usuário dos headers
│   │   ├── rbac.ts               # RBAC (futuro)
│   │   └── index.ts
│   ├── services/
│   │   ├── LancamentoService.ts  # Lançamentos orçamentários
│   │   ├── AprovacaoService.ts   # Fluxo de aprovação
│   │   ├── CompraService.ts      # Registro de compras
│   │   ├── CategoriaService.ts   # Categorias e Produtos
│   │   └── index.ts
│   └── types/index.ts            # Interfaces DTOs
├── prisma/
│   └── schema.prisma             # Modelo do banco MySQL
├── vercel.json                   # Configuração Vercel
├── package.json
└── tsconfig.json
```

---

## Banco de Dados (MySQL)

### Modelos (Prisma Schema)

| Modelo | Descrição |
|--------|-----------|
| `Area` | Áreas organizacionais |
| `Usuario` | Usuários com perfil hierárquico |
| `Categoria` | Categorias de planejamento por área |
| `Produto` | Produtos por categoria |
| `Lancamento` | Lançamento orçamentário (planejamento) |
| `LancamentoItem` | Itens do lançamento (planejado) |
| `Compra` | Compras realizadas (realizado) |
| `HistoricoLancamento` | Audit log de aprovações |

### Perfis de Usuário
- `ESTRATEGISTA` - Nível estratégico
- `PLANEJADOR` - Pode criar lançamentos
- `OPERACAO` - Nível operacional

### Status de Lançamento
- `RASCUNHO` → `PENDENTE` → `APROVADO` / `REPROVADO`

---

## Endpoints Implementados

### ✅ GET `/api/categorias`
- Lista categorias da área do usuário
- Query params: `?tipo=produtos&idCategoria=uuid`
- **Handler:** `api/categorias/index.ts`
- **Service:** `CategoriaService.findAll()`

### ✅ POST `/api/compras`
- Registra uma compra (atualiza valor realizado do lançamento)
- Body: `{ idLancamento, quantidade, valorTotal, dataCompra, observacao }`
- **Handler:** `api/compras/index.ts`
- **Service:** `CompraService.create()`
- **Validação:** `createCompraSchema`

### ✅ GET `/api/lancamentos`
- Lista lançamentos com filtros
- Query params: `?ano=2024&mes=3&status=PENDENTE&page=1&limit=20`
- **Handler:** `api/lancamentos/index.ts`
- **Service:** `LancamentoService.findAll()`
- **Validação:** `listLancamentosSchema`

### ✅ POST `/api/lancamentos`
- Cria novo lançamento (apenas PLANEJADOR)
- Body: `{ descricao, idCategoria, ano, mes, valorPlanejado, itens[] }`
- **Handler:** `api/lancamentos/index.ts`
- **Service:** `LancamentoService.create()`
- **Validação:** `createLancamentoSchema`
- **RBAC:** Verifica `user.perfil === 'PLANEJADOR'`

### ✅ POST `/api/lancamentos/aprovar`
- Aprova ou reprova lançamento
- Body: `{ idLancamento, status: 'APROVADO'|'REPROVADO', justificativa }`
- **Handler:** `api/lancamentos/aprovar/index.ts`
- **Service:** `AprovacaoService.aprovar()`
- **Validação:** `approveLancamentoSchema`

### ❌ `/api/lancamentos/[id]` (Pendente)
- GET - Detalhe de lançamento
- PUT - Atualiza lançamento
- DELETE - Remove lançamento
- **Handler:** `api/lancamentos/[id]/index.ts` (estrutura existe, código incompleto)

---

## Autenticação

O sistema usa **headers customizados** para autenticação (não é JWT ainda):

```
x-user-id: uuid
x-user-area: uuid
x-user-perfil: ESTRATEGISTA|PLANEJADOR|OPERACAO
x-user-superior: uuid (opcional)
```

**Arquivo:** `api/middlewares/auth.ts` → `getAuthUser(req)`

---

## O que Está Pronto ✅

### Backend (API Serverless)
- [x] Estrutura de endpoints REST
- [x] Validação com Zod
- [x] Erros customizados (AppError hierarchy)
- [x] Serviços com Prisma ORM
- [x] Isolamento por área (multi-tenant)
- [x] Schema do banco MySQL completo
- [x] Scripts npm: `db:generate`, `db:push`, `db:migrate`, `db:studio`
- [x] Configuração Vercel (`vercel.json`)

### Frontend
- [x] Menu com navegação
- [x] Components base

---

## O que Falta Implementar ❌

### Backend

#### 1. Endpoint `GET /api/lancamentos/[id]`
- Detalhe de um lançamento específico
- Arquivo já existe: `api/lancamentos/[id]/index.ts`

#### 2. Endpoint `PUT /api/lancamentos/[id]`
- Atualização de lançamento (apenas RASCUNHO)
- Arquivo já existe

#### 3. Endpoint `DELETE /api/lancamentos/[id]`
- Remoção de lançamento (apenas RASCUNHO)
- Arquivo já existe

#### 4. Autenticação Real (JWT)
- Currently usa headers customizados
- Precisa de: `POST /api/auth/login`, `POST /api/auth/logout`
- Trocar `getAuthUser` para validar JWT

#### 5. Seed/Banco de Dados
- Criar script de seed para testes locais
- Popular áreas, usuários, categorias示例

#### 6. Documentação API
- OpenAPI/Swagger

---

## Problemas para Rodar Localmente 🔧

### Problema 1: Imports com paths errados
Os arquivos em `api/categorias/` usam `../../services` quando deveria ser `../services`.

### Problema 2: Módulo `next` não instalado
O projeto é "serverless" mas usa tipos do Next.js que não estão no `package.json`.

### Solução Temporária (para desenvolvimento local)
Foi criado o arquivo `local-server.ts` que tenta emular o ambiente, mas precisa de ajustes.

### Solução Correta
Para desenvolvimento local sem Vercel, seria necessário:
1. Corrigir os paths dos imports (já foi feito pelo usuário)
2. Instalar `next` como devDependency (já foi feito)
3. Criar um wrapper que simule o ambiente Next.js API

---

## Configuração para Vercel ✅

```json
// vercel.json
{
  "version": 2,
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": null,
  "regions": ["sao-paulo"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

O deploy para Vercel está configurado e pronto. Basta conectar o repo.

---

## Para Rodar Localmente (sem Vercel)

### Pré-requisitos
1. **MySQL** rodando localmente (ou Docker)
2. URL de conexão no `.env`

### Passos

```bash
# 1. Instalar dependências
cd back-end
npm install

# 2. Configurar .env
cp .env.example .env
# Editar DATABASE_URL com sua conexão MySQL

# 3. Gerar Prisma Client
npx prisma generate

# 4. Criar banco (ou aplicar migrations)
npx prisma db push
# ou: npx prisma migrate dev

# 5. Rodar servidor local
npx vercel dev
# ou quando o local-server.ts estiver funcionando:
npx ts-node local-server.ts
```

### Headers para testar (local)
```
x-user-id: uuid-do-usuario
x-user-area: uuid-da-area
x-user-perfil: PLANEJADOR
```

---

## Ambiente Vercel (Produção)

### Variáveis de Ambiente Necessárias
- `DATABASE_URL` - conexão PostgreSQL Vercel (ou MySQL)

### Databases Suportados
- **Neon Postgres** (recomendado)
- **MySQL** (atual schema usa MySQL provider no Prisma)
- **PostgreSQL** (precisa mudar provider no schema)

---

## Resumo do Estado Atual

| Componente | Status |
|------------|--------|
| Schema BD | ✅ Completo |
| Endpoints GET/POST/Categorias | ✅ Implementado |
| Endpoints Compras | ✅ Implementado |
| Endpoints Lançamentos | ✅ Básico |
| Aprovação | ✅ Implementado |
| CRUD [id] Lançamentos | ❌ Incompleto |
| Auth JWT | ❌ Headers customizados |
| Seed/Fixture | ❌ Não existe |
| Deploy Vercel | ✅ Configurado |
| Dev Local | 🔧 Parcial (problemas com imports) |

---

## Próximos Passos Recomendados

1. **Alta Prioridade:**
   - Completar CRUD `/api/lancamentos/[id]`
   - Implementar Auth JWT (ou integrar Clerk/NextAuth)

2. **Média Prioridade:**
   - Criar script de seed
   - Corrigir `local-server.ts` para rodar sem Vercel
   - Documentação API com OpenAPI

3. **Após MVP:**
   - Implementar RBAC completo
   - Webhooks para notificações
   - Cache com Vercel Edge Config