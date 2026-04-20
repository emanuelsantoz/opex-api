import { AuthUser } from '../types';
import { UnauthorizedError } from '../lib/errors';

// Ajustamos para aceitar os headers de uma requisição qualquer
export function getAuthUser(req: { headers: Record<string, string | string[] | undefined> }): AuthUser {
  const { headers } = req; // Extraímos os headers do objeto recebido
  
  const userId = headers['x-user-id'];
  const userArea = headers['x-user-area'];
  const userPerfil = headers['x-user-perfil'];
  const userSuperior = headers['x-user-superior'];

  if (!userId || !userArea || !userPerfil) {
    throw new UnauthorizedError('Cabeçalhos de autenticação não encontrados');
  }

  const id = parseInt(Array.isArray(userId) ? userId[0] : userId, 10);
  const idArea = parseInt(Array.isArray(userArea) ? userArea[0] : userArea, 10);
  const idPerfil = parseInt(Array.isArray(userPerfil) ? userPerfil[0] : userPerfil, 10);

  if (isNaN(id) || isNaN(idArea) || isNaN(idPerfil)) {
    throw new UnauthorizedError('Cabeçalhos de autenticação inválidos');
  }

  return {
    id,
    idArea,
    idPerfil,
    idSuperior: userSuperior ? parseInt(Array.isArray(userSuperior) ? userSuperior[0] : userSuperior, 10) : null,
  };
}