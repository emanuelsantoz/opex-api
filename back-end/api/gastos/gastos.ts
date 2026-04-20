// import { VercelRequest, VercelResponse } from '@vercel/node';
// import { prisma } from '../lib/prisma';

// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   // 1. Configurar CORS (opcional, já que a Vercel lida com isso)
//   res.setHeader('Access-Control-Allow-Origin', '*');

//   // 2. Filtrar o método HTTP
//   if (req.method === 'GET') {
//     try {
//       const gastos = await prisma.gasto.findMany({
//         orderBy: { data: 'desc' }
//       });
//       return res.status(200).json(gastos);
//     } catch (error) {
//       return res.status(500).json({ error: "Erro ao buscar gastos" });
//     }
//   }

//   if (req.method === 'POST') {
//     const { descricao, valor } = req.body;
//     const novoGasto = await prisma.gasto.create({
//       data: { descricao, valor }
//     });
//     return res.status(201).json(novoGasto);
//   }

//   return res.status(405).json({ message: 'Método não permitido' });
// }