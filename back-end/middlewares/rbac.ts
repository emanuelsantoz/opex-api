import { AuthUser } from '../types';
import { ForbiddenError } from '../lib/errors';

// Crie um mapa de IDs para Nomes de Perfil (conforme seu banco Neon)
const ID_PARA_PERFIL: Record<number, string> = {
  1: 'ESTRATEGISTA',
  2: 'PLANEJADOR',
  3: 'OPERACAO'
};

type Permission =
  | 'lancamento:create'
  | 'lancamento:read'
  | 'lancamento:update'
  | 'lancamento:delete'
  | 'lancamento:approve'
  | 'compra:create'
  | 'compra:read'
  | 'categoria:read'
  | 'produto:read';

const PERFIL_PERMISSIONS: Record<string, Permission[]> = {
  ESTRATEGISTA: [
    'lancamento:read',
    'lancamento:approve',
    'compra:read',
    'categoria:read',
    'produto:read',
  ],
  PLANEJADOR: [
    'lancamento:create',
    'lancamento:read',
    'lancamento:update',
    'compra:read',
    'categoria:read',
    'produto:read',
  ],
  OPERACAO: [
    'compra:create',
    'compra:read',
    'categoria:read',
    'produto:read',
  ],
};

export function hasPermission(user: AuthUser, permission: Permission): boolean {
  // Pegamos o nome do perfil baseado no ID que veio no AuthUser
  const perfilNome = ID_PARA_PERFIL[user.idPerfil];

  if (!perfilNome) return false;

  return PERFIL_PERMISSIONS[perfilNome]?.includes(permission) ?? false;
}

export function requirePermission(permission: Permission) {
  return function (
    _target: unknown,       // Adicionamos '_' para o TS ignorar que não está sendo usado
    _propertyKey: string,   // Adicionamos '_' para o TS ignorar que não está sendo usado
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      // 1. Tipamos o request para garantir que o TS saiba onde está o 'x-auth-user'
      const req = args[0] as { headers: { 'x-auth-user'?: AuthUser } };
      const user = req.headers['x-auth-user'];

      if (!user) {
        throw new ForbiddenError('Usuário não autenticado');
      }

      // 2. Usamos a nossa função hasPermission que já sabe lidar com idPerfil
      if (!hasPermission(user, permission)) {
        // 3. Buscamos o nome do perfil para a mensagem de erro não quebrar
        const perfilNome = ID_PARA_PERFIL[user.idPerfil] || 'Desconhecido';

        throw new ForbiddenError(
          `Perfil ${perfilNome} não possui permissão para ${permission}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function requireHierarquia(
  user: AuthUser,
  targetSuperiorId: number | null
): void {
  const perfilNome = ID_PARA_PERFIL[user.idPerfil];
  // Se o usuário é estrategista, pode agir sobre subordinados
  if (perfilNome === 'ESTRATEGISTA') {
    // Agora comparamos número com número com segurança
    if (targetSuperiorId !== user.id) {
      throw new ForbiddenError(
        'Apenas o gestor hierárquico pode aprovar/reprovar este lançamento'
      );
    }
    return;
  }

  // Planejador e Operação não podem aprovar
  throw new ForbiddenError(
    'Apenas usuários com perfil Estrategista podem aprovar/reprovar'
  );
}
