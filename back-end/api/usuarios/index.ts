import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma'; // Ajuste o caminho se necessário

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // O Prisma executa o SQL puro assim:
      const usuarios = await prisma.$queryRaw`SELECT * FROM "Usuario"`; 

      // Retorna o resultado para você ver no navegador
      return res.status(200).json({
        success: true,
        data: usuarios
      });
    }

    return res.status(405).json({ message: 'Método não permitido' });
  } catch (error: any) {
    // Se der erro, ele vai imprimir exatamente o que aconteceu no terminal
    console.error('Erro no teste de banco:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}