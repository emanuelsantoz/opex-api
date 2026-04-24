import { prisma } from '../lib/prisma.js';
import { AuthUser, CreateUsuarioInput } from '../types/index.js';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../lib/errors.js';

export class UsuarioService {
    async create(data: CreateUsuarioInput, user: AuthUser) {
        if (user.idPerfil !== 1 && user.idPerfil !== 2) {
            throw new ForbiddenError('Usuário não tem permissão para criar usuários');
        }

        const existingUsuario = await prisma.usuario.findUnique({
            where: { email: data.email },
        });

        if (existingUsuario) {
            throw new ConflictError('Email já cadastrado');
        }

        return await prisma.usuario.create({
            data: {
                nome: data.nome,
                email: data.email,
                senha: data.senha,
                idPerfil: data.idPerfil,
                idArea: data.idArea,
                idSuperior: data.idSuperior,
            },
            include: {
                perfil: true,
                area: true,
            },
        });
    }

    async findByEmail(email: string) {
        return await prisma.usuario.findUnique({
            where: { email },
            include: {
                perfil: true,
                area: true,
            },
        });
    }

    async login(email: string, senha: string) {
        const usuario = await prisma.usuario.findUnique({
            where: { email },
            include: {
                perfil: true,
                area: true,
            },
        });

        if (!usuario) {
            throw new NotFoundError('Usuário');
        }

        if (usuario.senha !== senha) {
            throw new UnauthorizedError('Credenciais inválidas');
        }

        return {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            idPerfil: usuario.idPerfil,
            idArea: usuario.idArea,
        };
    }
}
