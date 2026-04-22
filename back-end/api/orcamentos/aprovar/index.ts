import { NextApiRequest, NextApiResponse } from "next";
import { successResponse, errorResponse } from "../../../lib/response.js";
import { getAuthUser } from "../../../middlewares/auth.js";
import { AprovacaoService } from "../../../services/AprovacaoService.js";


const aprovacaoService = new AprovacaoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Validar Método
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido' },
      });
    }

    // 2. Autenticação (Agora passando o 'req' inteiro corretamente!)
    const user = getAuthUser(req);

    // 3. Validação do Body
    // Dica: Crie um schema simples que espera apenas o idOrcamento
    const { idOrcamento } = req.body; 
    
    if (!idOrcamento || isNaN(Number(idOrcamento))) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'ID do orçamento é obrigatório e deve ser um número' }
      });
    }

    // 4. Chamada do Service (Aprovação em Massa)
    const orcamentoAprovado = await aprovacaoService.approveBudget(Number(idOrcamento), user);

    // 5. Resposta de Sucesso
    return res.status(200).json(successResponse(orcamentoAprovado));

  } catch (error) {
    // Seu middleware de erro que já trata Forbidden, NotFound, etc.
    const { statusCode, body } = errorResponse(error);
    return res.status(statusCode).json(body);
  }
}