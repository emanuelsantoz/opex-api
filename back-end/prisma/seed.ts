import { PrismaClient } from "@prisma/client";
import { MOCK_AREAS, MOCK_CATEGORIA_LANCAMENTO, MOCK_PERFIS, MOCK_STATUS_LANCAMENTO, MOCK_STATUS_ORCAMENTO, MOCK_TIPO_LANCAMENTO, MOCK_TIPO_PRODUTO } from "./data-mocks.js";
const prisma = new PrismaClient();

async function seed() {

    // No loop de Áreas do seed.ts
    for (const area of MOCK_AREAS) {
        await prisma.area.upsert({
            where: { nome: area.nome },
            update: { sigla: area.sigla },
            create: area
        });
    }
    console.log('✅ Área populados.');

    // No loop de Tipos de Perfil do seed.ts
    for (const perfil of MOCK_PERFIS) {
        // Usamos upsert aqui também para garantir que o tipo pai exista antes do filho
        const tipoRelacionado = await prisma.tipoPerfil.upsert({
            where: { nome: perfil.tipo },
            update: {}, // Se já existir, não faz nada
            create: {
                nome: perfil.tipo,
                descricao: `Nível ${perfil.tipo}`
            }
        });

        // Agora que temos certeza que tipoRelacionado tem um ID...
        await prisma.perfil.upsert({
            where: { nome: perfil.nome },
            update: { idTipoPerfil: tipoRelacionado.id },
            create: {
                nome: perfil.nome,
                idTipoPerfil: tipoRelacionado.id
            }
        });
    }
    console.log('✅ Perfis e Tipos sincronizados com sucesso!');


    // No loop de Status Orçamento do seed.ts
    for (const _status_orcamento of MOCK_STATUS_ORCAMENTO) {
        await prisma.statusOrcamento.upsert({
            where: { nome: _status_orcamento.nome },
            update: {},
            create: _status_orcamento
        })
    }
    console.log('✅ Status Orçamento populados.');

    // No loop de Tipo Lancamento do seed.ts
    for (const _tipo_lancamento of MOCK_TIPO_LANCAMENTO) {
        await prisma.tipoLancamento.upsert({
            where: { nome: _tipo_lancamento.nome },
            update: {},
            create: _tipo_lancamento
        })
    }
    console.log('✅ Tipo Lançamento populados.');

    // No loop de Status Lancamento do seed.ts
    for (const _status_lancamento of MOCK_STATUS_LANCAMENTO) {
        await prisma.statusLancamento.upsert({
            where: { nome: _status_lancamento.nome },
            update: {},
            create: _status_lancamento
        })
    }
    console.log('✅ Status Lançamento populados.');

    // No loop de Tipo Lancamento do seed.ts
    for (const _tipo_produto of MOCK_TIPO_PRODUTO) {
        await prisma.tipoProduto.upsert({
            where: { nome: _tipo_produto.nome },
            update: {},
            create: _tipo_produto
        })
    }
    console.log('✅ Tipo Produto populados.');

    // No loop de Lançamento Categoria do seed.ts
    for (const categoria of MOCK_CATEGORIA_LANCAMENTO) {
        const areaDb = await prisma.area.findUnique({ where: { sigla: categoria.areaSigla } })

        if (areaDb) {
            await prisma.categoriaLancamento.upsert({
                // Como não tem campo único óbvio, buscamos por nome dentro daquela área
                where: {
                    id: (await prisma.categoriaLancamento.findFirst({
                        where: { nome: categoria.nome, idArea: areaDb.id }
                    }))?.id || 0
                },
                update: {},
                create: {
                    nome: categoria.nome,
                    idArea: areaDb.id
                }
            })
        }
    }
    console.log('✅ Categorias Lançamento populadas.');
}

seed().then();